# 🔧 Backend URL Configuration Fix

## Problem
Frontend was showing `undefined` in API URLs, causing 404 errors on all API calls.

## Root Cause
- `.env` file not being read properly by Create React App
- No fallback values in code when env var is missing
- `.env` had wrong URL for local development

## Solution Applied

### 1. Added Fallbacks in All Components
Updated these files with fallback to `http://localhost:8001`:
- `src/App.js`
- `src/components/SaveAsModal.jsx`
- `src/components/MyBlocksPanel.jsx`
- `src/components/ProjectManager.jsx`
- `src/components/TerminalPanel.jsx`

### 2. Fixed .env File
Set correct localhost URL in `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## How to Use

### For Local Development (Default)
No changes needed! Works out of the box with `http://localhost:8001`

### For Loophole/Tunneling
Edit `frontend/.env` to use your tunnel URL:
```env
REACT_APP_BACKEND_URL=https://your-backend-tunnel-url.com
```

### For Network Access
Edit `frontend/.env` to use your local IP:
```env
REACT_APP_BACKEND_URL=http://192.168.1.xxx:8001
```

## Testing

1. **Check current config:**
   Open browser console (F12) and run:
   ```javascript
   console.log(process.env.REACT_APP_BACKEND_URL)
   ```

2. **Verify API calls:**
   Look for API calls in Network tab - should be:
   ```
   http://localhost:8001/api/...
   ```
   NOT:
   ```
   http://localhost:3000/undefined/api/...
   ```

## Troubleshooting

### Still seeing "undefined"?
1. **Delete frontend/.env** if it exists
2. The fallback will use `http://localhost:8001` automatically
3. Restart frontend: `Ctrl+C` then `yarn start`

### Using tunnel but getting 404?
1. Make sure backend is accessible via tunnel
2. Test: `curl https://your-tunnel-url/api/`
3. Update `frontend/.env` with backend tunnel URL
4. Restart frontend

### Environment variable not loading?
- Ensure file is named `.env` exactly (not `.env.txt`)
- Ensure it's in `frontend` folder (not root)
- Must restart frontend after .env changes (hot reload doesn't work for env)

## Important Notes

⚠️ **Always restart frontend after changing .env:**
```cmd
Ctrl+C
yarn start
```

✅ **Fallback works automatically if .env is missing**

🔄 **Hot reload does NOT reload environment variables**
