@echo off
echo ========================================
echo   PyForge Visual - Starting Services
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9 or higher from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18 or higher from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Yarn is installed
yarn --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Yarn is not installed. Installing yarn globally...
    call npm install -g yarn
    if errorlevel 1 (
        echo [ERROR] Failed to install yarn
        echo Please run: npm install -g yarn
        pause
        exit /b 1
    )
)

echo [INFO] Checking if ports are available...

REM Check if port 8001 is in use
netstat -ano | findstr ":8001" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 8001 is already in use - stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8001"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM Check if port 3000 is in use
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo [WARNING] Port 3000 is already in use - stopping existing process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo [INFO] Starting Backend Server...
cd backend
start /B cmd /c "python -m uvicorn server:app --host 0.0.0.0 --port 8001 > backend.log 2>&1"
cd ..

echo [INFO] Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo [INFO] Starting Frontend Server...
cd frontend
start "PyForge Visual - Frontend" cmd /c "set BROWSER=none && yarn start"
cd ..

echo.
echo ========================================
echo   PyForge Visual is starting!
echo ========================================
echo.
echo   Backend:  http://localhost:8001
echo   Frontend: http://localhost:3000
echo.
echo   A new window will open for the frontend.
echo   Wait for "Compiled successfully!" message.
echo.
echo   Then open your browser to: http://localhost:3000
echo.
echo   Press Ctrl+C in the frontend window to stop
echo ========================================
echo.
echo Tip: If ports are still in use, manually run:
echo   netstat -ano ^| findstr ":8001"
echo   taskkill /F /PID [PID_NUMBER]
echo.
pause
