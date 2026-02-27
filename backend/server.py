from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
import subprocess
import asyncio
import json
import sys
import tempfile
import signal
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import aiosqlite

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database setup
DB_PATH = ROOT_DIR.parent / 'data' / 'projects.db'
CUSTOM_BLOCKS_PATH = ROOT_DIR.parent / 'data' / 'custom_blocks.json'
FRONTEND_BUILD_PATH = ROOT_DIR.parent / 'frontend' / 'build'

# Ensure data directory exists
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Database Initialization ──────────────────────────────────────────────────

async def init_db():
    """Initialize SQLite database for projects."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                workspace_xml TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        await db.commit()

# ─── Custom Blocks JSON Storage ──────────────────────────────────────────────

def load_custom_blocks() -> List[Dict[str, Any]]:
    """Load custom blocks from JSON file."""
    if CUSTOM_BLOCKS_PATH.exists():
        with open(CUSTOM_BLOCKS_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_custom_blocks(blocks: List[Dict[str, Any]]):
    """Save custom blocks to JSON file."""
    with open(CUSTOM_BLOCKS_PATH, 'w', encoding='utf-8') as f:
        json.dump(blocks, f, indent=2)

# ─── Models ───────────────────────────────────────────────────────────────────

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    workspace_xml: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProjectCreate(BaseModel):
    name: str
    description: str = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workspace_xml: Optional[str] = None

class ExecuteRequest(BaseModel):
    code: str
    project_id: Optional[str] = None

class ExecuteResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float

class ScanRequest(BaseModel):
    package_name: str

class ScanResponse(BaseModel):
    package_name: str
    modules: List[Dict[str, Any]]
    block_definitions: List[Dict[str, Any]]

class SaveFileRequest(BaseModel):
    code: str
    filepath: str
    filename: str

class ScanImportsRequest(BaseModel):
    code: str

class ScanImportsResponse(BaseModel):
    imports: List[Dict[str, Any]]

class CustomBlockDef(BaseModel):
    name: str
    params: List[str] = []
    body_code: str = ""
    description: str = ""
    color: str = "#8b5cf6"

# ─── Running processes tracker ────────────────────────────────────────────────
running_processes: Dict[str, subprocess.Popen] = {}

# ─── Health ───────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "PyForge Visual API", "version": "1.0.0", "status": "offline_ready"}

# ─── Projects CRUD (SQLite) ───────────────────────────────────────────────────

@api_router.post("/projects", response_model=Project)
async def create_project(data: ProjectCreate):
    project = Project(name=data.name, description=data.description)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO projects (id, name, description, workspace_xml, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (project.id, project.name, project.description, project.workspace_xml, project.created_at, project.updated_at)
        )
        await db.commit()
    return project

@api_router.get("/projects", response_model=List[Project])
async def list_projects():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM projects ORDER BY updated_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Project not found")
            return dict(row)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, data: ProjectUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
    values = list(update_data.values()) + [project_id]
    
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
        await db.commit()
        
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Project not found")
            return dict(row)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        await db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
    return {"status": "deleted"}

# ─── Code Execution ──────────────────────────────────────────────────────────

@api_router.post("/execute", response_model=ExecuteResponse)
async def execute_code(req: ExecuteRequest):
    import time
    start = time.time()
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
        f.write(req.code)
        tmp_path = f.name
    
    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd='/tmp'
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
        except asyncio.TimeoutError:
            proc.kill()
            await proc.communicate()
            return ExecuteResponse(
                stdout="", stderr="Execution timed out (30s limit)", exit_code=-1,
                execution_time=time.time() - start
            )
        
        return ExecuteResponse(
            stdout=stdout.decode('utf-8', errors='replace'),
            stderr=stderr.decode('utf-8', errors='replace'),
            exit_code=proc.returncode or 0,
            execution_time=time.time() - start
        )
    finally:
        os.unlink(tmp_path)

@api_router.post("/execute/stop")
async def stop_execution():
    for pid, proc in list(running_processes.items()):
        try:
            proc.kill()
        except Exception:
            pass
    running_processes.clear()
    return {"status": "stopped"}

# ─── Package Scanner ──────────────────────────────────────────────────────────

@api_router.post("/scanner/scan", response_model=ScanResponse)
async def scan_package(req: ScanRequest):
    """Scan a Python package and generate block definitions."""
    import importlib
    import inspect
    
    try:
        mod = importlib.import_module(req.package_name)
    except ImportError:
        raise HTTPException(status_code=404, detail=f"Package '{req.package_name}' not found")
    
    modules = []
    block_defs = []
    
    for name, obj in inspect.getmembers(mod):
        if name.startswith('_'):
            continue
        
        entry = {"name": name, "type": type(obj).__name__}
        
        if inspect.isfunction(obj) or inspect.isbuiltin(obj):
            entry["type"] = "function"
            try:
                sig = inspect.signature(obj)
                entry["params"] = [
                    {"name": p.name, "default": str(p.default) if p.default != inspect.Parameter.empty else None}
                    for p in sig.parameters.values()
                ]
            except (ValueError, TypeError):
                entry["params"] = []
            
            block_def = {
                "type": f"{req.package_name}_{name}",
                "message0": f"{req.package_name}.{name}(" + " ".join(f"%{i+1}" for i in range(len(entry.get("params", [])))) + ")",
                "args0": [
                    {"type": "input_value", "name": p["name"].upper(), "check": None}
                    for p in entry.get("params", [])
                ],
                "output": None,
                "colour": 160,
                "tooltip": f"Call {req.package_name}.{name}",
                "helpUrl": ""
            }
            block_defs.append(block_def)
        
        elif inspect.isclass(obj):
            entry["type"] = "class"
            entry["methods"] = [m for m in dir(obj) if not m.startswith('_') and callable(getattr(obj, m, None))]
        
        modules.append(entry)
    
    return ScanResponse(
        package_name=req.package_name,
        modules=modules[:50],
        block_definitions=block_defs[:30]
    )

@api_router.get("/scanner/installed")
async def list_installed_packages():
    """List installed Python packages."""
    from importlib.metadata import distributions
    packages = []
    for dist in distributions():
        packages.append({"name": dist.metadata["Name"], "version": dist.metadata["Version"]})
    packages.sort(key=lambda x: x["name"].lower())
    return {"packages": packages[:100]}

# ─── File Save ────────────────────────────────────────────────────────────────

@api_router.post("/files/save")
async def save_file(req: SaveFileRequest):
    """Save generated Python code to a specific file path."""
    filepath = Path(req.filepath).expanduser().resolve()
    filepath.mkdir(parents=True, exist_ok=True)
    
    # Ensure filename ends with .py
    filename = req.filename
    if not filename.endswith('.py'):
        filename += '.py'
    
    full_path = filepath / filename
    full_path.write_text(req.code, encoding='utf-8')
    
    return {"status": "saved", "path": str(full_path), "size": len(req.code)}

@api_router.post("/files/list-dir")
async def list_directory(data: dict):
    """List directories for the file picker."""
    dir_path = Path(data.get("path", "/tmp")).expanduser().resolve()
    if not dir_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")
    
    items = []
    try:
        for item in sorted(dir_path.iterdir()):
            if item.name.startswith('.'):
                continue
            items.append({
                "name": item.name,
                "is_dir": item.is_dir(),
                "path": str(item),
            })
    except PermissionError:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    return {
        "current": str(dir_path),
        "parent": str(dir_path.parent),
        "items": items[:200]
    }

# ─── Scan Imports from Code ───────────────────────────────────────────────────

@api_router.post("/scanner/scan-imports", response_model=ScanImportsResponse)
async def scan_imports(req: ScanImportsRequest):
    """Parse code to find all imports, auto-install missing ones, then scan for block generation."""
    import ast
    import importlib
    import inspect
    
    found_imports = []
    
    try:
        tree = ast.parse(req.code)
    except SyntaxError:
        return ScanImportsResponse(imports=[])
    
    module_names = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                module_names.add(alias.name.split('.')[0])
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                module_names.add(node.module.split('.')[0])
    
    # Standard library modules that don't need pip install
    stdlib = {
        'os', 'sys', 'io', 'math', 'json', 'csv', 're', 'datetime', 'time',
        'random', 'collections', 'itertools', 'functools', 'operator', 'string',
        'pathlib', 'shutil', 'glob', 'tempfile', 'subprocess', 'threading',
        'multiprocessing', 'socket', 'http', 'urllib', 'email', 'html', 'xml',
        'logging', 'unittest', 'typing', 'abc', 'copy', 'pprint', 'textwrap',
        'struct', 'codecs', 'hashlib', 'hmac', 'secrets', 'base64', 'binascii',
        'pickle', 'shelve', 'sqlite3', 'zipfile', 'tarfile', 'gzip', 'bz2',
        'lzma', 'configparser', 'argparse', 'getpass', 'platform', 'ctypes',
        'array', 'queue', 'heapq', 'bisect', 'decimal', 'fractions', 'statistics',
        'enum', 'dataclasses', 'contextlib', 'ast', 'dis', 'inspect', 'importlib',
        'pkgutil', 'token', 'tokenize', 'traceback', 'warnings', 'atexit',
        'signal', 'uuid', 'asyncio', 'concurrent', 'turtle', 'tkinter',
        'webbrowser', 'cgi', 'cgitb', 'wsgiref', 'xmlrpc', 'ftplib', 'smtplib',
        'imaplib', 'poplib', 'telnetlib', 'pdb', 'profile', 'cProfile',
        'timeit', 'trace', 'gc', 'resource', 'sysconfig', 'venv',
        'builtins', 'types', 'weakref',
    }
    
    for mod_name in sorted(module_names):
        mod_info = {
            "name": mod_name,
            "available": False,
            "installed": False,
            "functions": [],
            "classes": [],
            "constants": [],
        }
        
        # Try importing first
        try:
            mod = importlib.import_module(mod_name)
            mod_info["available"] = True
        except ImportError:
            # Auto-install if not a stdlib module
            if mod_name not in stdlib:
                try:
                    proc = await asyncio.create_subprocess_exec(
                        sys.executable, '-m', 'pip', 'install', mod_name, '--quiet',
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    await asyncio.wait_for(proc.communicate(), timeout=60)
                    if proc.returncode == 0:
                        mod_info["installed"] = True
                        importlib.invalidate_caches()
                        mod = importlib.import_module(mod_name)
                        mod_info["available"] = True
                except Exception:
                    pass
            
            if not mod_info["available"]:
                found_imports.append(mod_info)
                continue
        
        try:
            # Limit inspection to prevent timeout on large modules like 'os'
            member_count = 0
            max_members = 100
            
            for name, obj in inspect.getmembers(mod):
                if name.startswith('_'):
                    continue
                
                member_count += 1
                if member_count > max_members:
                    break
                
                if inspect.isfunction(obj) or inspect.isbuiltin(obj):
                    if len(mod_info["functions"]) >= 30:
                        continue
                    func_info = {"name": name, "type": "function"}
                    try:
                        sig = inspect.signature(obj)
                        func_info["params"] = [
                            p.name for p in list(sig.parameters.values())[:10]
                            if p.name != 'self'
                        ]
                    except (ValueError, TypeError):
                        func_info["params"] = []
                    mod_info["functions"].append(func_info)
                
                elif inspect.isclass(obj):
                    if len(mod_info["classes"]) >= 10:
                        continue
                    cls_info = {"name": name, "type": "class", "methods": []}
                    method_count = 0
                    for mname, mobj in inspect.getmembers(obj):
                        if mname.startswith('_') and mname != '__init__':
                            continue
                        if callable(mobj):
                            method_count += 1
                            if method_count > 10:
                                break
                            method_info = {"name": mname, "params": []}
                            cls_info["methods"].append(method_info)
                    mod_info["classes"].append(cls_info)
                
                elif not callable(obj):
                    if len(mod_info["constants"]) >= 15:
                        continue
                    try:
                        mod_info["constants"].append({"name": name, "type": type(obj).__name__})
                    except Exception:
                        pass
        except Exception:
            pass
        
        found_imports.append(mod_info)
    
    return ScanImportsResponse(imports=found_imports)

# ─── Custom Blocks (My Blocks / Scratch-like) ────────────────────────────────

@api_router.post("/custom-blocks")
async def save_custom_block(block: CustomBlockDef):
    """Save a reusable custom block definition."""
    blocks = load_custom_blocks()
    doc = block.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    blocks.append(doc)
    save_custom_blocks(blocks)
    return doc

@api_router.get("/custom-blocks")
async def list_custom_blocks():
    """List all custom block definitions."""
    blocks = load_custom_blocks()
    return {"blocks": blocks}

@api_router.delete("/custom-blocks/{block_id}")
async def delete_custom_block(block_id: str):
    blocks = load_custom_blocks()
    filtered = [b for b in blocks if b.get("id") != block_id]
    if len(filtered) == len(blocks):
        raise HTTPException(status_code=404, detail="Custom block not found")
    save_custom_blocks(filtered)
    return {"status": "deleted"}

# ─── WebSocket: Live Output ──────────────────────────────────────────────────

@app.websocket("/api/ws/output")
async def ws_output(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            if msg.get("type") == "execute":
                code = msg.get("code", "")
                with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='/tmp') as f:
                    f.write(code)
                    tmp_path = f.name
                
                try:
                    proc = await asyncio.create_subprocess_exec(
                        sys.executable, '-u', tmp_path,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        cwd='/tmp'
                    )
                    
                    run_id = str(uuid.uuid4())
                    await websocket.send_text(json.dumps({"type": "started", "run_id": run_id}))
                    
                    async def read_stream(stream, stream_type):
                        while True:
                            line = await stream.readline()
                            if not line:
                                break
                            await websocket.send_text(json.dumps({
                                "type": stream_type,
                                "data": line.decode('utf-8', errors='replace'),
                                "run_id": run_id
                            }))
                    
                    await asyncio.gather(
                        read_stream(proc.stdout, "stdout"),
                        read_stream(proc.stderr, "stderr")
                    )
                    
                    exit_code = await proc.wait()
                    await websocket.send_text(json.dumps({
                        "type": "finished",
                        "exit_code": exit_code,
                        "run_id": run_id
                    }))
                finally:
                    try:
                        os.unlink(tmp_path)
                    except Exception:
                        pass
                    
    except WebSocketDisconnect:
        pass

# ─── WebSocket: Terminal (Real PTY) ─────────────────────────────────────────

@app.websocket("/api/ws/terminal")
async def ws_terminal(websocket: WebSocket):
    """Real terminal with PTY - works like SSH!"""
    await websocket.accept()
    
    if sys.platform == 'win32':
        # Windows: Use winpty or ConPTY
        try:
            import winpty
            # Use winpty for Windows PTY
            proc = winpty.PTY(80, 24)
            proc.spawn('powershell.exe')
            
            async def read_from_pty():
                loop = asyncio.get_event_loop()
                while True:
                    try:
                        data = await loop.run_in_executor(None, proc.read, 4096)
                        if not data:
                            break
                        await websocket.send_text(data)
                    except Exception as e:
                        logger.error(f"PTY read error: {e}")
                        break
            
            async def write_to_pty():
                while True:
                    try:
                        data = await websocket.receive_text()
                        if data.startswith('RESIZE:'):
                            try:
                                _, rows, cols = data.split(':')
                                proc.set_size(int(cols), int(rows))
                            except Exception:
                                pass
                            continue
                        await asyncio.get_event_loop().run_in_executor(None, proc.write, data)
                    except WebSocketDisconnect:
                        break
                    except Exception as e:
                        logger.error(f"PTY write error: {e}")
                        break
            
            await asyncio.gather(read_from_pty(), write_to_pty(), return_exceptions=True)
            proc.close()
            
        except ImportError:
            # Fallback: Use subprocess with PIPE (not ideal but works)
            proc = await asyncio.create_subprocess_exec(
                'powershell.exe', '-NoLogo',
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            
            async def read_output():
                while True:
                    data = await proc.stdout.read(4096)
                    if not data:
                        break
                    await websocket.send_text(data.decode('utf-8', errors='replace'))
            
            async def write_input():
                while True:
                    try:
                        data = await websocket.receive_text()
                        if not data.startswith('RESIZE:'):
                            proc.stdin.write(data.encode('utf-8'))
                            await proc.stdin.drain()
                    except WebSocketDisconnect:
                        break
            
            await asyncio.gather(read_output(), write_input(), return_exceptions=True)
            proc.kill()
    else:
        # Linux/Mac: Use PTY
        import pty
        import select
        import struct
        import fcntl
        import termios
        
        shell = os.environ.get('SHELL', '/bin/bash')
        if isinstance(shell, str):
            shell = [shell]
        
        pid, fd = pty.fork()
        
        if pid == 0:
            # Child process
            try:
                os.execvp(shell[0], shell)
            except Exception:
                sys.exit(1)
        
        # Parent process
        try:
            fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', 24, 80, 0, 0))
            fl = fcntl.fcntl(fd, fcntl.F_GETFL)
            fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
            
            async def read_from_pty():
                loop = asyncio.get_event_loop()
                while True:
                    try:
                        await loop.run_in_executor(None, lambda: select.select([fd], [], [], 0.1))
                        data = os.read(fd, 4096)
                        if not data:
                            break
                        await websocket.send_text(data.decode('utf-8', errors='replace'))
                    except OSError:
                        break
                    except Exception as e:
                        logger.error(f"PTY read error: {e}")
                        break
            
            async def write_to_pty():
                while True:
                    try:
                        data = await websocket.receive_text()
                        if data.startswith('RESIZE:'):
                            try:
                                _, rows, cols = data.split(':')
                                fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack('HHHH', int(rows), int(cols), 0, 0))
                            except Exception:
                                pass
                            continue
                        os.write(fd, data.encode('utf-8'))
                    except WebSocketDisconnect:
                        break
                    except Exception as e:
                        logger.error(f"PTY write error: {e}")
                        break
            
            await asyncio.gather(read_from_pty(), write_to_pty(), return_exceptions=True)
        
        finally:
            try:
                os.close(fd)
                os.kill(pid, signal.SIGTERM)
                os.waitpid(pid, 0)
            except Exception:
                pass

# ─── Include router & middleware ──────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    await init_db()
    logger.info(f"Database initialized at {DB_PATH}")
    logger.info(f"Custom blocks storage at {CUSTOM_BLOCKS_PATH}")
    
    # Check if frontend build exists
    if FRONTEND_BUILD_PATH.exists():
        logger.info(f"✅ Frontend build found at {FRONTEND_BUILD_PATH}")
        logger.info("🌐 Access the app at: http://localhost:8001")
    else:
        logger.warning(f"⚠️ Frontend build not found at {FRONTEND_BUILD_PATH}")
        logger.warning("Run 'cd frontend && yarn build' to create production build")
        logger.warning("For now, run frontend separately: cd frontend && yarn start")

# Mount static files (frontend build) - AFTER all API routes
if FRONTEND_BUILD_PATH.exists():
    # Serve static files (JS, CSS, images)
    app.mount("/static", StaticFiles(directory=FRONTEND_BUILD_PATH / "static"), name="static")
    
    # Serve index.html for all other routes (SPA routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all frontend routes
        index_path = FRONTEND_BUILD_PATH / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend not built")
