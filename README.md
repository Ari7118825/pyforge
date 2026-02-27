# PyForge Visual - Offline Block-Based Python IDE

**PyForge Visual** is a fully offline, self-hostable, browser-based block-based Python IDE inspired by Scratch. Create Python programs using visual blocks that are as powerful as raw code, with full bidirectional sync between blocks and text.

## ✨ Features

- **200+ Python Blocks**: Comprehensive block library covering all Python features
  - Text manipulation (split, join, replace, regex, formatting)
  - Math & Statistics (sin, cos, sqrt, factorial, random)
  - File I/O & File System operations
  - DateTime handling
  - List/Dict operations (append, pop, keys, values, etc.)
  - Control flow (if/elif/else, loops, try/except)
  - Functions, Classes, Decorators, Generators
  - And much more!

- **Fully Offline**: No internet required after setup - runs entirely on localhost
- **Self-Hostable**: Easy to deploy on any machine with Node.js and Python
- **Block ↔ Code Sync**: Edit in blocks or code, changes sync bidirectionally
- **Live Code Execution**: Run Python code directly in the IDE
- **Integrated Terminal**: Full terminal access within the browser
- **Project Management**: Save and load projects with SQLite storage
- **Custom Blocks**: Create reusable "My Blocks" like Scratch
- **Dynamic Imports**: Scan code for imports and auto-generate blocks
- **Settings Panel**: Customizable workspace, zoom, behavior settings
- **Save As Feature**: Export generated Python code to .py files
- **Modern UI**: Dark theme, resizable panels, professional layout

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Yarn** package manager

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd pyforge-visual
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   yarn install
   cd ..
   ```

4. **Start the Application**

   **On Windows:**
   ```bash
   start.bat
   ```

   **On Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   **Manual Start:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python -m uvicorn server:app --host 0.0.0.0 --port 8001

   # Terminal 2 - Frontend
   cd frontend
   yarn start
   ```

5. **Open in Browser**
   Navigate to: `http://localhost:3000`

## 📁 Project Structure

```
pyforge-visual/
├── backend/                 # FastAPI Python backend
│   ├── server.py           # Main server file
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend configuration
├── frontend/               # React frontend
│   ├── src/
│   │   ├── blocks/
│   │   │   └── pythonBlocks.js   # 200+ block definitions
│   │   ├── components/           # UI components
│   │   └── App.js               # Main app component
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend configuration
├── data/                 # Local data storage
│   ├── projects.db      # SQLite database for projects
│   └── custom_blocks.json  # JSON storage for custom blocks
├── README.md            # This file
├── CONTRIBUTING.md      # Guide for adding blocks/features
├── start.bat           # Windows startup script
└── start.sh            # Linux/Mac startup script
```

## 🎮 Usage

### Basic Workflow

1. **Create Blocks**: Drag blocks from the toolbox to the workspace
2. **Connect Blocks**: Snap blocks together to build your program
3. **View Code**: See the generated Python code in real-time
4. **Run**: Click "Run" to execute your program
5. **Save**: Save your project or export as .py file

### Advanced Features

#### Custom "My Blocks"
1. Click "My Blocks" in the toolbar
2. Define block name, parameters, and body code
3. Use your custom block anywhere in the workspace

#### Dynamic Import Scanning
1. Add import blocks to your workspace
2. Click "Reload Logic" to scan imports
3. New blocks are automatically created for imported modules

#### Keyboard Shortcuts
- `Ctrl/Cmd + S`: Save project
- `Ctrl/Cmd + R`: Run code
- `Ctrl/Cmd + E`: Open/close code preview
- `Delete`: Remove selected block

## 🛠️ Configuration

### Backend Configuration (`backend/.env`)
```
PORT=8001
CORS_ORIGINS=*
```

### Frontend Configuration (`frontend/.env`)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Settings (via UI)
- Auto-hide block sidebar
- Snap blocks to grid
- Scroll to zoom
- Sound effects
- Default zoom level
- Show/hide trashcan

## 🧩 Adding New Blocks

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions on:
- Creating new block types
- Adding categories
- Implementing custom code generators
- Testing blocks

## 🗄️ Data Storage

- **Projects**: Stored in SQLite database (`data/projects.db`)
- **Custom Blocks**: Stored in JSON file (`data/custom_blocks.json`)
- **Settings**: Stored in browser localStorage
- **Workspace**: Auto-saved to project database

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change ports in .env files
# Backend: backend/.env -> PORT=8002
# Frontend: frontend/.env -> REACT_APP_BACKEND_URL=http://localhost:8002
```

### Python Package Missing
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules
yarn install
```

### Database Issues
```bash
# Reset database
rm data/projects.db
# Database will be recreated on next backend start
```

## 🌐 Deployment

### Local Network Access
To access from other devices on your network:

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Linux/Mac)
2. Update frontend/.env: `REACT_APP_BACKEND_URL=http://<YOUR_IP>:8001`
3. Restart both servers
4. Access from other devices: `http://<YOUR_IP>:3000`

### Production Deployment
For production deployment, see deployment guides for:
- Docker
- Nginx reverse proxy
- Systemd services

## 📚 Technologies

- **Frontend**: React 19, Blockly 12, TailwindCSS
- **Backend**: FastAPI, Python 3.9+
- **Database**: SQLite (via aiosqlite)
- **Terminal**: xterm.js
- **UI Components**: Radix UI, Lucide Icons

## 📝 License

This project is provided as-is for educational and personal use.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🐛 Bug Reports & Feature Requests

Please open an issue on the repository with:
- Clear description of the problem/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)

## 💡 Tips & Best Practices

1. **Start Small**: Begin with simple programs, gradually add complexity
2. **Use My Blocks**: For repeated code, create custom blocks
3. **Save Often**: Save your projects frequently
4. **Explore Imports**: Use Reload Logic to discover library functions
5. **Check Code**: View generated code to learn Python syntax
6. **Terminal Access**: Use the terminal for package installation

## 🌟 Roadmap

Future enhancements:
- [ ] Multi-file project support
- [ ] Virtual environment per project
- [ ] Debugging with breakpoints
- [ ] Block search functionality
- [ ] Export to executable
- [ ] Theme customization
- [ ] Code-to-blocks parser (AST-based)
- [ ] Plugin system for community blocks

---

**Made with ❤️ for Python education and visual programming enthusiasts**
