# 🚀 Single-Port Deployment Guide

## 🎯 Overview

**PyForge Visual now runs on ONE PORT (8001)!**

No more `.env` files, no more port juggling, no more tunneling headaches!

---

## ✨ How It Works

### **Development Mode (2 ports)**
- Frontend dev server: `localhost:3000` (hot reload)
- Backend API: `localhost:8001`
- Frontend proxies API calls to backend

### **Production Mode (1 port)** ⭐
- Backend serves everything: `localhost:8001`
- Frontend build served as static files
- API at `/api/*`
- Works on ANY domain (no configuration needed!)

---

## 🛠️ Development Setup (For Coding)

### 1. Install Dependencies
```cmd
cd backend
pip install -r requirements.txt

cd ..\frontend
yarn install
```

### 2. Start Backend
```cmd
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

### 3. Start Frontend (separate terminal)
```cmd
cd frontend
yarn start
```

Frontend opens at `http://localhost:3000` and proxies API calls to port 8001

---

## 📦 Production Deployment (Single Port!)

### Step 1: Build Frontend
```cmd
build.bat
```

Or manually:
```cmd
cd frontend
yarn build
cd ..
```

This creates `frontend/build/` with optimized static files.

### Step 2: Run Production Server
```cmd
run-production.bat
```

Or manually:
```cmd
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
```

### Step 3: Access
Open browser to: **http://localhost:8001**

That's it! Everything served from one port!

---

## 🌐 Tunneling / Remote Access

### With Loophole
```bash
# Only need to tunnel ONE port now!
loophole http 8001
```

Access via: `https://xxxxx.loophole.site`

### With ngrok
```bash
ngrok http 8001
```

### With Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:8001
```

### With Local Network
```bash
# Start server with 0.0.0.0 (already default)
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001

# Access from other devices
http://YOUR_IP:8001
```

---

## 🎨 How URLs Work Now

### Frontend Code
```javascript
// Before (required .env):
const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// After (works everywhere):
const API = '/api';
```

### API Calls
```javascript
// All API calls use relative URLs
axios.get('/api/projects')        // → http://localhost:8001/api/projects
axios.post('/api/execute', ...)   // → http://localhost:8001/api/execute
```

### WebSocket
```javascript
// WebSocket uses current host
const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/terminal`;
```

### Benefits
✅ Works on `localhost`
✅ Works on `192.168.x.x` (LAN)
✅ Works on `example.com` (domain)
✅ Works on `xxxxx.loophole.site` (tunnel)
✅ Works on `https://...` (SSL)
✅ **No configuration needed!**

---

## 📂 File Structure

```
pyforge-visual/
├── backend/
│   ├── server.py          # Serves API + frontend
│   └── requirements.txt
├── frontend/
│   ├── src/               # Source code (development)
│   ├── build/             # Built files (production) ⭐
│   │   ├── index.html
│   │   ├── static/
│   │   │   ├── js/
│   │   │   └── css/
│   │   └── ...
│   └── package.json
├── build.bat              # Build frontend
├── run-production.bat     # Run production server
└── start.bat              # Run development mode
```

---

## 🔄 Development Workflow

### Daily Development
```cmd
# Terminal 1: Backend (leave running)
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001

# Terminal 2: Frontend (hot reload)
cd frontend
yarn start
```

Edit code → Save → See changes instantly!

### Before Deployment
```cmd
build.bat
```

Test production build:
```cmd
run-production.bat
```

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Development
```cmd
start.bat
```
Access: `http://localhost:3000` (dev mode)

### Scenario 2: Production Server
```cmd
build.bat
run-production.bat
```
Access: `http://localhost:8001` (optimized)

### Scenario 3: Tunneling (Loophole/ngrok)
```cmd
# Build once
build.bat

# Run production
run-production.bat

# Tunnel (new terminal)
loophole http 8001
```
Access: `https://xxxxx.loophole.site`

### Scenario 4: VPS/Cloud Server
```bash
# Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && yarn install && yarn build

# Run with systemd/pm2/screen
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001

# Or with production server
pip install gunicorn
gunicorn backend.server:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001
```

### Scenario 5: Docker
```dockerfile
FROM python:3.11
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN cd frontend && yarn install && yarn build
EXPOSE 8001
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## 🔍 Troubleshooting

### "Frontend not built" error
**Problem:** Trying to run production without building frontend

**Solution:**
```cmd
build.bat
```

### Port 8001 already in use
```cmd
# Windows
netstat -ano | findstr :8001
taskkill /F /PID [PID]

# Linux/Mac
lsof -i :8001
kill -9 [PID]
```

### Changes not showing in production
**Problem:** Viewing old build

**Solution:** Rebuild frontend
```cmd
cd frontend
rmdir /s /q build
yarn build
```

### API calls fail with 404
**Problem:** Not built properly or backend not running

**Check:**
1. Is backend running? `curl http://localhost:8001/api/`
2. Is build present? Check `frontend/build/index.html` exists
3. Restart backend after building

---

## ⚡ Performance Tips

### Production Build
- Minified JS/CSS
- Tree-shaken dependencies
- Optimized images
- Gzip compression (by FastAPI)

### Caching
FastAPI automatically serves static files with caching headers

### CDN (Optional)
Upload `frontend/build/static/*` to CDN, update paths in `index.html`

---

## 🎯 Comparison

### Before (2 ports)
```
Frontend: localhost:3000
Backend: localhost:8001
Tunneling: Need 2 tunnels + .env config
URLs: Hardcoded in .env
```

### After (1 port) ⭐
```
Everything: localhost:8001
Tunneling: Need 1 tunnel, no config
URLs: Relative, work everywhere
```

---

## ✅ Benefits

1. **One Port** - Easy tunneling, firewall, deployment
2. **No .env** - Works on any domain without config
3. **No CORS** - Same origin for API and frontend
4. **Simple** - Build once, deploy anywhere
5. **Fast** - Optimized production build
6. **Secure** - No exposed ports, no env leaks

---

## 📝 Quick Commands

```cmd
# Development (2 ports, hot reload)
start.bat

# Build for production
build.bat

# Run production (1 port)
run-production.bat

# Tunnel production
loophole http 8001
```

---

## 🎉 You're Done!

**PyForge Visual is now:**
- ✅ Single-port ready
- ✅ Tunnel-friendly
- ✅ Works on any domain
- ✅ No .env needed
- ✅ Production optimized

**Just build and deploy!** 🚀
