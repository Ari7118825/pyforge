@echo off
REM PyForge Visual - Production Runner
REM Single port deployment (port 8001)

echo ========================================
echo   PyForge Visual - Production Mode
echo ========================================
echo.

REM Check if build exists
if not exist "frontend\build\index.html" (
    echo [ERROR] Frontend not built!
    echo Please run: build.bat
    echo.
    pause
    exit /b 1
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found!
    pause
    exit /b 1
)

REM Kill existing process on 8001
echo [INFO] Stopping existing processes on port 8001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

REM Start server
echo [INFO] Starting PyForge Visual on port 8001...
echo.
echo ========================================
echo   🚀 PyForge Visual Running
echo ========================================
echo.
echo   Access at: http://localhost:8001
echo.
echo   For tunneling:
echo     loophole http 8001
echo     ngrok http 8001
echo     cloudflared tunnel 8001
echo.
echo   Press Ctrl+C to stop
echo ========================================
echo.

python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
