@echo off
REM Quick Setup Script for PyForge Visual
REM Run this once after downloading

echo ========================================
echo   PyForge Visual - Initial Setup
echo ========================================
echo.
echo This will install all dependencies.
echo Please wait, this may take a few minutes...
echo.

REM Check Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Please install Python 3.9+ from https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version
echo.

REM Check Node.js
echo [2/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found! Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM Install Yarn if needed
echo [3/4] Checking Yarn...
yarn --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installing Yarn globally...
    call npm install -g yarn
    if errorlevel 1 (
        echo [ERROR] Failed to install Yarn
        pause
        exit /b 1
    )
)
yarn --version
echo.

REM Install Backend Dependencies
echo [4/4] Installing Backend Dependencies...
cd backend
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Backend dependencies installed!
echo.

REM Install Frontend Dependencies
echo [5/5] Installing Frontend Dependencies (this takes 2-3 minutes)...
cd frontend
yarn install
if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    echo [TIP] Try deleting node_modules folder and running this again
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Frontend dependencies installed!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo All dependencies are installed.
echo.
echo To start PyForge Visual:
echo   1. Run: start.bat
echo   2. Wait for "Compiled successfully!" message
echo   3. Open browser to: http://localhost:3000
echo.
echo For help, see:
echo   - README.md (features overview)
echo   - WINDOWS_INSTALL.md (troubleshooting)
echo   - QUICKSTART.md (first program tutorial)
echo.
echo ========================================
pause
