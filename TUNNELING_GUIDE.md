# 🚨 CRITICAL: How to Tunnel PyForge Visual Properly

## ❌ **What You're Doing Wrong**

```cmd
# Terminal 1: Backend on port 8001
python -m uvicorn server:app --host 0.0.0.0 --port 8001

# Terminal 2: Frontend on port 3000
yarn start

# Terminal 3: Tunnel ONLY port 3000
loophole http 3000  ❌ WRONG!
```

**Problem:** Frontend on 3000 can't reach backend on 8001 through the tunnel!

---

## ✅ **CORRECT WAY: Production Mode (Single Port)**

### **Step 1: Build Frontend (One Time)**
```cmd
cd C:\Users\eggza\Downloads\pyforge-main\pyforge-main
build.bat
```

This creates `frontend/build/` with optimized static files.

### **Step 2: Run Production Server**
```cmd
run-production.bat
```

Or manually:
```cmd
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
```

**Backend now serves BOTH API and Frontend on port 8001!**

### **Step 3: Tunnel ONE Port**
```bash
loophole http 8001
```

**That's it!** Everything works through one tunnel URL!

---

## 🧪 **Test Locally First**

Before tunneling, test production mode locally:

### **1. Build**
```cmd
build.bat
```

### **2. Run**
```cmd
run-production.bat
```

### **3. Open Browser**
```
http://localhost:8001
```

### **4. Test "Reload Logic"**
1. Drag "import" block (from Imports category)
2. Type "os" in the module name
3. Click **"Reload Logic"** button
4. Should see: "Created blocks for: os"
5. Check toolbox - new "os" category should appear
6. Blocks like `os.getcwd()`, `os.listdir()`, etc.

**If this works locally, it will work through tunnel!**

---

## 🌐 **Full Tunneling Instructions**

### **Windows**

```cmd
REM 1. Navigate to project
cd C:\Users\eggza\Downloads\pyforge-main\pyforge-main

REM 2. Build frontend (only needed once, or after code changes)
build.bat

REM 3. Start production server
start "PyForge Backend" cmd /k "python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001"

REM 4. Wait 5 seconds for server to start
timeout /t 5

REM 5. Tunnel the single port
loophole http 8001
```

### **Linux/Mac**

```bash
# 1. Navigate to project
cd ~/pyforge-visual

# 2. Build frontend
cd frontend && yarn build && cd ..

# 3. Start production server (background)
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001 &

# 4. Tunnel
loophole http 8001
```

---

## 📋 **Complete Tunneling Checklist**

- [ ] Build frontend: `build.bat`
- [ ] Check build exists: `frontend\build\index.html` file present
- [ ] Start server: `run-production.bat`
- [ ] Test locally: Open `http://localhost:8001`
- [ ] Verify API: Go to `http://localhost:8001/api/` (should show JSON)
- [ ] Test features:
  - [ ] Drag blocks to workspace
  - [ ] Click "Run" - code executes
  - [ ] Add import block (e.g., "os")
  - [ ] Click "Reload Logic" - new category appears
  - [ ] Terminal works
- [ ] If all works, then tunnel: `loophole http 8001`
- [ ] Access tunnel URL in browser
- [ ] All features should work through tunnel!

---

## 🐛 **Why It Wasn't Working**

### **Your Setup**
```
Frontend (localhost:3000) ──X──> Backend (localhost:8001)
         ↓
    Tunnel (3000)
```

When accessing via tunnel, the frontend on port 3000 tries to call `/api` which goes to the tunnel URL (also port 3000), but there's no backend there!

### **Correct Setup**
```
Backend serves Frontend + API (localhost:8001)
         ↓
    Tunnel (8001)
         ↓
Everything works!
```

---

## 🔧 **Troubleshooting**

### **"Reload Logic" Still Not Working**

**Check 1:** Is backend running?
```cmd
curl http://localhost:8001/api/
```
Expected: `{"message":"PyForge Visual API","version":"1.0.0","status":"offline_ready"}`

**Check 2:** Is frontend built?
```cmd
dir frontend\build\index.html
```
Should exist.

**Check 3:** Browser console (F12) errors?
Look for 404 or network errors. Should see calls to `/api/scanner/scan-imports` returning 200 OK.

**Check 4:** Try with simple import
- Add import block with "math"
- Click Reload Logic
- Should see "Created blocks for: math"
- New "math" category in toolbox

### **"Frontend not built" Error**

Backend says:
```
⚠️ Frontend build not found at frontend/build
```

**Solution:**
```cmd
build.bat
```

### **404 Errors in Browser**

Check browser network tab (F12 → Network):
- API calls should go to `/api/...` 
- Should return 200 OK
- If 404, backend not running or not serving correctly

---

## 📝 **Quick Commands Reference**

### **First Time Setup**
```cmd
cd backend
pip install -r requirements.txt

cd ..\frontend
yarn install
```

### **Build for Production**
```cmd
build.bat
```

### **Run Production**
```cmd
run-production.bat
```

### **Run Development (2 ports, local only)**
```cmd
REM Terminal 1
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001

REM Terminal 2
cd frontend
yarn start
```

### **Tunnel Production**
```cmd
loophole http 8001
```

---

## 🎯 **Expected Behavior**

### **After Following This Guide**

1. ✅ Open tunnel URL in browser
2. ✅ PyForge Visual loads (see block toolbox)
3. ✅ Drag "print" block, click Run → Output shows
4. ✅ Add "import os" block
5. ✅ Click "Reload Logic"
6. ✅ Output shows: "Created blocks for: os"
7. ✅ New "os" category in toolbox
8. ✅ Can drag `os.getcwd()` and other os blocks
9. ✅ Run code with os blocks → Works!
10. ✅ Terminal works
11. ✅ Save project works
12. ✅ All features functional

---

## 💡 **Why We Can't Remove Python**

You asked if we can remove Python or combine everything into one. **We cannot** because:

1. **Python execution** - The whole point is to run Python code!
2. **Import scanning** - Needs Python to introspect modules
3. **Code analysis** - Needs Python AST parsing
4. **Terminal** - Needs Python subprocess

**However**, we DID combine them into one port:
- Backend (Python FastAPI) serves the API
- Backend ALSO serves the frontend static files
- Everything on port 8001
- Only ONE port to tunnel

This is the best possible architecture - you can't eliminate Python from a Python IDE!

---

## 🚀 **Summary**

**Do this:**
```cmd
build.bat
run-production.bat
loophole http 8001
```

**Access your tunnel URL → Everything works!**

**Don't do this:**
```cmd
yarn start    ❌ (Dev mode)
loophole http 3000    ❌ (Wrong port)
```

---

## ✅ **Final Checklist**

- [ ] Downloaded latest code from GitHub
- [ ] Ran `build.bat` successfully
- [ ] Ran `run-production.bat` - backend started
- [ ] Opened `http://localhost:8001` - frontend loads
- [ ] Tested "Reload Logic" locally - works
- [ ] Ran `loophole http 8001` - got tunnel URL
- [ ] Opened tunnel URL - everything works
- [ ] Tested all features through tunnel - functional

**If all checked, you're done!** 🎉
