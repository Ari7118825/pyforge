@echo off
echo ========================================
echo   PyForge Visual - Starting Services
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9 or higher
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher
    pause
    exit /b 1
)

echo [INFO] Starting Backend Server...
cd backend
start /B cmd /c "python -m uvicorn server:app --host 0.0.0.0 --port 8001 > backend.log 2>&1"
cd ..

echo [INFO] Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [INFO] Starting Frontend Server...
cd frontend
start cmd /c "yarn start"
cd ..

echo.
echo ========================================
echo   PyForge Visual is starting!
echo ========================================
echo.
echo   Backend:  http://localhost:8001
echo   Frontend: http://localhost:3000
echo.
echo   Press Ctrl+C in the frontend window to stop
echo ========================================
pause
