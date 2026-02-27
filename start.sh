#!/bin/bash

echo "========================================"
echo "  PyForge Visual - Starting Services"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

# Check if yarn is installed
if ! command -v yarn &> /dev/null; then
    echo "[ERROR] Yarn is not installed"
    echo "Please install Yarn package manager"
    exit 1
fi

echo "[INFO] Starting Backend Server..."
cd backend
python3 -m uvicorn server:app --host 0.0.0.0 --port 8001 > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "[INFO] Waiting for backend to start..."
sleep 3

echo "[INFO] Starting Frontend Server..."
cd frontend
yarn start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  PyForge Visual is starting!"
echo "========================================"
echo ""
echo "  Backend:  http://localhost:8001"
echo "  Frontend: http://localhost:3000"
echo ""
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "  Press Ctrl+C to stop both servers"
echo "========================================"

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait for frontend process
wait $FRONTEND_PID
