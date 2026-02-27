#!/usr/bin/env python3
"""
PyForge Visual - Simple Single-Port Startup
Just run: python start.py
"""
import subprocess
import sys
import time
import os
from pathlib import Path

ROOT = Path(__file__).parent

def main():
    print("=" * 50)
    print("  PyForge Visual - Starting...")
    print("=" * 50)
    print()
    
    # Start backend (this serves both API and frontend)
    backend_cmd = [
        sys.executable, "-m", "uvicorn",
        "backend.server:app",
        "--host", "0.0.0.0",
        "--port", "8001",
        "--reload"
    ]
    
    print("[INFO] Starting server on port 8001...")
    print("[INFO] Backend serves API at /api/*")
    print("[INFO] Backend serves Frontend at /*")
    print()
    
    try:
        subprocess.run(backend_cmd, cwd=ROOT)
    except KeyboardInterrupt:
        print("\n[INFO] Shutting down...")
    
if __name__ == "__main__":
    main()
