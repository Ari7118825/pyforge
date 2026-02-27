@echo off
REM PyForge Visual - Production Build Script
REM This builds the frontend and prepares for single-port deployment

echo ========================================
echo   PyForge Visual - Production Build
echo ========================================
echo.

REM Check Node.js
echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    pause
    exit /b 1
)
echo ✅ Node.js found
echo.

REM Check Yarn
echo [2/3] Checking Yarn...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Yarn...
    call npm install -g yarn
)
echo ✅ Yarn ready
echo.

REM Build Frontend
echo [3/3] Building Frontend (this takes 1-2 minutes)...
cd frontend
call yarn install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    cd ..
    pause
    exit /b 1
)

call yarn build
if errorlevel 1 (
    echo [ERROR] Failed to build frontend
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   ✅ Build Complete!
echo ========================================
echo.
echo Frontend built to: frontend\build\
echo.
echo Now you can run on SINGLE PORT (8001):
echo   python -m uvicorn backend.server:app --host 0.0.0.0 --port 8001
echo.
echo Or use the run-production.bat script
echo.
echo Access at: http://localhost:8001
echo.
echo ========================================
pause
