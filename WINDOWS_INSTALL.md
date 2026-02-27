# Windows Installation Guide - PyForge Visual

## 🪟 Windows 10/11 Installation

### Prerequisites

Before starting, ensure you have:
1. **Python 3.9 or higher** - [Download](https://www.python.org/downloads/)
   - ✅ Check "Add Python to PATH" during installation
2. **Node.js 18 or higher** - [Download](https://nodejs.org/)
3. **Yarn** (will be auto-installed by start.bat)

---

## 📥 Step-by-Step Installation

### 1. Download and Extract

1. Download the ZIP file from GitHub
2. Extract to: `C:\PyForge-Visual\` (or your preferred location)
3. You should see folders: `backend`, `frontend`, `data`

### 2. Install Backend Dependencies

Open **PowerShell** or **Command Prompt** as Administrator:

```cmd
cd C:\PyForge-Visual\backend
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed fastapi-0.110.1 uvicorn-0.25.0 aiosqlite-0.19.0 ...
```

### 3. Install Frontend Dependencies

**IMPORTANT: Use Yarn, NOT npm!**

```cmd
cd C:\PyForge-Visual\frontend
```

**If you don't have Yarn installed:**
```cmd
npm install -g yarn
```

**Then install packages:**
```cmd
yarn install
```

**Expected output:**
```
yarn install v1.22.22
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
Done in 45.23s.
```

### 4. Run PyForge Visual

**Option A: Using the Start Script (Recommended)**
```cmd
cd C:\PyForge-Visual
start.bat
```

**Option B: Manual Start**
```cmd
REM Terminal 1 - Backend
cd C:\PyForge-Visual\backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001

REM Terminal 2 - Frontend (new terminal)
cd C:\PyForge-Visual\frontend
set BROWSER=none
yarn start
```

### 5. Access the Application

1. Wait for "Compiled successfully!" in the frontend terminal
2. Open your browser to: **http://localhost:3000**
3. Start building Python programs with blocks!

---

## 🔧 Troubleshooting

### ❌ Error: "npm ERESOLVE unable to resolve dependency tree"

**Problem:** You used `npm install` instead of `yarn install`

**Solution:**
```cmd
cd frontend
rmdir /s /q node_modules
yarn install
```

**Why?** This project uses Yarn for dependency management. npm and yarn use different resolution algorithms.

---

### ❌ Error: "Port 8001 is already in use"

**Problem:** Backend is already running or another process is using port 8001

**Solution 1: Find and kill the process**
```cmd
netstat -ano | findstr ":8001"
REM Note the PID (last column)
taskkill /F /PID [PID_NUMBER]
```

**Solution 2: Use the updated start.bat**
The new `start.bat` automatically kills processes on ports 8001 and 3000 before starting.

---

### ❌ Error: "Port 3000 is already in use"

**Problem:** Frontend is already running or another process is using port 3000

**Solution:**
```cmd
netstat -ano | findstr ":3000"
REM Note the PID
taskkill /F /PID [PID_NUMBER]
```

---

### ❌ Error: "Python is not installed or not in PATH"

**Problem:** Python not installed or not added to system PATH

**Solution:**
1. Reinstall Python from https://www.python.org/downloads/
2. ✅ **Check "Add Python to PATH"** during installation
3. Restart Command Prompt/PowerShell
4. Verify: `python --version`

---

### ❌ Error: "Node.js is not installed or not in PATH"

**Problem:** Node.js not installed

**Solution:**
1. Download from https://nodejs.org/
2. Install (will automatically add to PATH)
3. Restart Command Prompt/PowerShell
4. Verify: `node --version`

---

### ❌ Error: "yarn: command not found"

**Problem:** Yarn not installed globally

**Solution:**
```cmd
npm install -g yarn
yarn --version
```

---

### ❌ Error: "ModuleNotFoundError: No module named 'fastapi'"

**Problem:** Backend dependencies not installed

**Solution:**
```cmd
cd backend
pip install -r requirements.txt --upgrade
```

---

### ❌ Frontend shows blank page or errors

**Problem:** Node modules not installed correctly

**Solution:**
```cmd
cd frontend
rmdir /s /q node_modules
del yarn.lock
yarn install
yarn start
```

---

### ❌ "Cannot read property of undefined" in browser console

**Problem:** Backend not running or frontend can't connect

**Solution:**
1. Check backend is running: http://localhost:8001/api/
   - Should show: `{"message":"PyForge Visual API",...}`
2. Check frontend `.env` file has: `REACT_APP_BACKEND_URL=http://localhost:8001`
3. Restart both services

---

## 🔍 Verification Checklist

After installation, verify everything works:

### ✅ Backend Check
```cmd
curl http://localhost:8001/api/
```
**Expected:** `{"message":"PyForge Visual API","version":"1.0.0","status":"offline_ready"}`

### ✅ Frontend Check
Open browser to http://localhost:3000
**Expected:** PyForge Visual interface with block toolbox on left

### ✅ Block Test
1. Drag a "print" block from I/O category
2. Add a "string" block with "Hello, World!"
3. Click "Run" button
4. Check Output panel shows: "Hello, World!"

---

## 🎓 First Time Setup Tips

### 1. Create a Desktop Shortcut

Create a file `PyForge.bat` on your Desktop:
```batch
@echo off
cd C:\PyForge-Visual
start.bat
```

Right-click → Send to → Desktop (create shortcut)

### 2. Add to Windows Firewall

If Windows Firewall blocks Python/Node.js:
1. Click "Allow access" when prompted
2. Or manually add rules in Windows Defender Firewall

### 3. Use PowerShell (Recommended)

PowerShell has better error messages than CMD:
- Press `Win + X`
- Select "Windows PowerShell"

### 4. Keep Terminal Open

Don't close the terminal windows - they're running the servers!
- Backend terminal: Shows API logs
- Frontend terminal: Shows compilation logs

---

## 📝 Quick Reference

### Start Services
```cmd
cd C:\PyForge-Visual
start.bat
```

### Stop Services
- Press `Ctrl+C` in frontend terminal
- Press `Ctrl+C` in backend terminal (if manually started)
- Or close the terminal windows

### Restart After Code Changes
Backend auto-reloads with `--reload` flag
Frontend auto-reloads via React hot reload

### Update Dependencies
```cmd
REM Backend
cd backend
pip install -r requirements.txt --upgrade

REM Frontend
cd frontend
yarn install
```

---

## 💡 Performance Tips

### For Faster Startup:
1. **Use SSD** - Install on SSD drive, not HDD
2. **Exclude from Antivirus** - Add PyForge folder to exclusions
3. **Close Other Apps** - Free up RAM and CPU
4. **Use Latest Python** - Python 3.11/3.12 are faster

### For Better Development:
1. **Use VS Code** - Great for viewing code
2. **Keep Terminals Visible** - Monitor logs
3. **Use Chrome DevTools** - F12 for debugging
4. **Save Often** - Use Ctrl+S to save projects

---

## 🔒 Security Notes

- **Firewall:** Allow Python and Node.js through Windows Firewall
- **Antivirus:** Exclude PyForge folder for better performance
- **Ports:** 8001 and 3000 are local only by default
- **Network:** To access from other devices, update frontend/.env

---

## 🆘 Still Having Issues?

### Check Logs:
```cmd
REM Backend logs
type backend\backend.log

REM Frontend logs
REM Check the terminal window for errors
```

### Common Solutions:
1. **Restart Windows** - Fixes most PATH issues
2. **Run as Administrator** - For permission issues
3. **Reinstall Dependencies** - Delete node_modules and reinstall
4. **Check Disk Space** - Ensure 2GB+ free space
5. **Disable Antivirus Temporarily** - For installation only

### Get Help:
1. Check README.md for feature documentation
2. Review INSTALL.md for detailed setup
3. Check QUICKSTART.md for tutorials
4. Open GitHub issue with error details

---

## ✅ Success!

Once you see:
- Backend running on http://localhost:8001 ✅
- Frontend "Compiled successfully!" message ✅
- Browser shows PyForge Visual interface ✅

**You're ready to build Python programs with blocks!** 🎉

---

## 📚 Next Steps

1. Read **QUICKSTART.md** for your first program
2. Explore all 150+ blocks in the toolbox
3. Try the example programs
4. Create custom blocks
5. Save your projects
6. Export to .py files

**Happy Visual Coding!** 🐍✨
