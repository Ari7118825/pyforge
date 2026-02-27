# PyForge Visual - Complete Installation & Setup Guide

## 📦 What You Need

**Pre-installed on your machine:**
- **Python 3.9+** (Download: https://www.python.org/downloads/)
- **Node.js 18+** (Download: https://nodejs.org/)
- **Yarn** (Install after Node.js: `npm install -g yarn`)

**That's it! Everything else is included.**

---

## 🚀 Windows Installation (Windows 10/11)

### Step 1: Download & Extract
1. Download this project as a ZIP file
2. Extract to a folder (e.g., `C:\PyForge-Visual`)
3. Open Command Prompt or PowerShell

### Step 2: Install Backend Dependencies
```cmd
cd C:\PyForge-Visual\backend
pip install -r requirements.txt
```

### Step 3: Install Frontend Dependencies
```cmd
cd C:\PyForge-Visual\frontend
yarn install
```

### Step 4: Run the Application
```cmd
cd C:\PyForge-Visual
start.bat
```

**Alternative Manual Start:**
```cmd
REM Terminal 1 - Backend
cd C:\PyForge-Visual\backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001

REM Terminal 2 - Frontend (new terminal)
cd C:\PyForge-Visual\frontend
yarn start
```

### Step 5: Access the IDE
Open your browser and go to: **http://localhost:3000**

---

## 🐧 Linux/Mac Installation

### Step 1: Download & Extract
```bash
# Download and extract, then:
cd ~/PyForge-Visual
```

### Step 2: Install Backend Dependencies
```bash
cd backend
pip3 install -r requirements.txt
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
yarn install
cd ..
```

### Step 4: Run the Application
```bash
chmod +x start.sh
./start.sh
```

**Alternative Manual Start:**
```bash
# Terminal 1 - Backend
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start
```

### Step 5: Access the IDE
Open your browser and go to: **http://localhost:3000**

---

## 📁 Installed Dependencies

### Backend (Python)
All installed via `pip install -r requirements.txt`:
- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **aiosqlite** - Async SQLite database
- **python-dotenv** - Environment variables
- **python-multipart** - File upload support
- **websockets** - WebSocket support
- **pydantic** - Data validation

**Total Size: ~50MB**

### Frontend (JavaScript)
All installed via `yarn install`:
- **react** - UI framework
- **blockly** - Block-based editor
- **axios** - HTTP client
- **@xterm/xterm** - Terminal emulator
- **react-resizable-panels** - Resizable UI panels
- **lucide-react** - Icons
- **tailwindcss** - Styling
- **@radix-ui/** - UI components

**Total Size: ~300MB (includes all node_modules)**

---

## 🔌 Offline Usage

Once dependencies are installed:
1. **Disconnect from the internet**
2. Run `start.bat` (Windows) or `./start.sh` (Linux/Mac)
3. The app works 100% offline on localhost

**No external API calls. No cloud services. Fully self-contained.**

---

## 🗂️ Data Storage Locations

All data is stored locally:
- **Projects**: `/data/projects.db` (SQLite database)
- **Custom Blocks**: `/data/custom_blocks.json` (JSON file)
- **Settings**: Browser localStorage
- **Logs**: `/backend/backend.log` (if using startup scripts)

---

## ⚙️ Configuration

### Changing Ports

**Backend Port (default: 8001):**
Edit `/backend/.env`:
```
PORT=8002
```

**Frontend Connection:**
Edit `/frontend/.env`:
```
REACT_APP_BACKEND_URL=http://localhost:8002
```

### Network Access (Access from Other Devices)

1. Find your computer's IP address:
   - **Windows**: `ipconfig` → Look for "IPv4 Address"
   - **Linux/Mac**: `ifconfig` → Look for "inet"

2. Edit `/frontend/.env`:
   ```
   REACT_APP_BACKEND_URL=http://YOUR_IP:8001
   ```

3. Restart both servers

4. Access from other devices: `http://YOUR_IP:3000`

---

## 🛠️ Troubleshooting

### "Port already in use"
**Windows:**
```cmd
netstat -ano | findstr :8001
taskkill /PID [PID_NUMBER] /F
```

**Linux/Mac:**
```bash
lsof -i :8001
kill -9 [PID_NUMBER]
```

### "Python not found"
Make sure Python is in your PATH:
- **Windows**: Check "Add Python to PATH" during installation
- Verify: `python --version` or `python3 --version`

### "Yarn not found"
Install yarn globally:
```
npm install -g yarn
```

### "Module not found" errors
Reinstall dependencies:
```bash
# Backend
cd backend
pip install -r requirements.txt --upgrade

# Frontend
cd frontend
rm -rf node_modules
yarn install
```

### Database corruption
Reset the database:
```bash
rm data/projects.db
# Database will be recreated on next backend start
```

### Frontend won't start
Clear cache and rebuild:
```bash
cd frontend
rm -rf node_modules
yarn cache clean
yarn install
```

---

## 🎯 First Time Setup Checklist

- [ ] Python 3.9+ installed
- [ ] Node.js 18+ installed
- [ ] Yarn installed (`npm install -g yarn`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`yarn install`)
- [ ] Backend starts without errors (port 8001)
- [ ] Frontend starts without errors (port 3000)
- [ ] Browser opens to http://localhost:3000
- [ ] Can drag blocks to workspace
- [ ] Can run Python code
- [ ] Can save projects
- [ ] Works when internet is disconnected

---

## 📊 System Requirements

### Minimum:
- **CPU**: Dual-core 2GHz
- **RAM**: 4GB
- **Storage**: 1GB free space
- **OS**: Windows 10/11, Linux (Ubuntu 20.04+), macOS 11+
- **Browser**: Chrome 90+, Firefox 88+, Edge 90+

### Recommended:
- **CPU**: Quad-core 3GHz
- **RAM**: 8GB
- **Storage**: 2GB free space
- **Browser**: Latest Chrome/Edge

---

## 🔐 Security Notes

- **Local Only**: The server binds to 0.0.0.0 for network access but has no authentication
- **Production Use**: Not recommended for production without adding authentication
- **Code Execution**: Runs arbitrary Python code - only use on trusted networks
- **Firewall**: Consider blocking ports 8001/3000 if not using network features

---

## 📞 Getting Help

**Common Issues:**
1. Check the troubleshooting section above
2. Review `/backend/backend.log` for backend errors
3. Check browser console (F12) for frontend errors
4. Ensure all dependencies are installed
5. Verify ports 8001 and 3000 are not in use

**Still Stuck?**
- Review README.md for feature documentation
- Check CONTRIBUTING.md for customization
- Ensure you're using compatible Python/Node versions

---

## 🎓 Learning Resources

**Using PyForge Visual:**
1. Start with simple programs (print, variables, loops)
2. Use the "Reload Logic" button after adding imports
3. Create custom blocks for repeated code
4. View generated code to learn Python syntax
5. Use the terminal for package installation

**Python Learning:**
- Official Python Tutorial: https://docs.python.org/3/tutorial/
- Python Docs: https://docs.python.org/3/
- W3Schools Python: https://www.w3schools.com/python/

**Blockly Documentation:**
- Blockly Guides: https://developers.google.com/blockly

---

## 💾 Backup & Restore

### Backup Your Work
Copy these files to a safe location:
```
/data/projects.db           # All your projects
/data/custom_blocks.json    # Your custom blocks
```

### Restore
Copy the backed-up files back to the `/data/` folder.

---

## 🔄 Updating PyForge Visual

When a new version is released:
1. Backup your `/data/` folder
2. Download the new version
3. Copy your `/data/` folder to the new version
4. Reinstall dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   
   cd ../frontend
   yarn install
   ```
5. Run the new version

---

## ✅ Post-Installation Test

Run these commands to verify everything works:

```bash
# Test backend
curl http://localhost:8001/api/
# Should return: {"message":"PyForge Visual API","version":"1.0.0","status":"offline_ready"}

# Test database
ls data/
# Should show: projects.db custom_blocks.json (after first run)

# Test frontend
# Open http://localhost:3000 in browser
# Drag a block to workspace
# Click Run
# Should see output panel
```

---

**Congratulations! PyForge Visual is ready to use! 🎉**

Start creating Python programs with blocks, no internet required!
