# Quick Start Guide - PyForge Visual

## 🚀 Get Started in 5 Minutes!

### Prerequisites Check
✅ Python 3.9 or higher installed  
✅ Node.js 18 or higher installed  
✅ Yarn package manager installed  

### Installation

**Windows (10/11):**
```cmd
cd C:\PyForge-Visual\backend
pip install -r requirements.txt

cd ..\frontend
yarn install

cd ..
start.bat
```

**Linux/Mac:**
```bash
cd backend && pip3 install -r requirements.txt && cd ..
cd frontend && yarn install && cd ..
chmod +x start.sh && ./start.sh
```

### Access
Open browser: **http://localhost:3000**

---

## 🎯 Your First Program

### 1. Hello World
1. Drag a **"print"** block from the **I/O** category
2. Drag a **"string"** block into the print block
3. Change the text to "Hello, World!"
4. Click **"Run"** button
5. See output in the bottom panel!

### 2. Simple Math
1. Drag a **"set variable"** block from **Variables**
2. Name it "result"
3. Drag an **"arithmetic"** block (from **Math**)
4. Set it to add 5 + 3
5. Add a **"print"** block below
6. Drag the **"result"** variable into print
7. Click **"Run"**

### 3. Loop & Print
1. Drag a **"for loop"** block from **Loops**
2. Set variable to "i"
3. Drag a **"range"** block into the loop
4. Set range to 5
5. Inside the loop, add a **"print"** block
6. Print the "i" variable
7. Click **"Run"** - see numbers 0-4!

---

## 🎨 Interface Overview

### Top Toolbar
- **Run**: Execute your code
- **Save**: Save project to database
- **Save As**: Export to .py file
- **Reload Logic**: Scan imports and create blocks
- **My Blocks**: Create custom reusable blocks
- **Settings**: Configure workspace

### Left Panel - Block Toolbox
- **Variables**: Create and use variables
- **Values**: Strings, numbers, lists, dicts
- **Logic**: If/else conditions
- **Loops**: For, while, break, continue
- **Functions**: Define and call functions
- **Text**: String operations (30+ blocks)
- **Math**: Mathematical functions (25+ blocks)
- **Random**: Random numbers and choices
- **Lists & Seqs**: List operations (20+ blocks)
- **Dictionaries**: Dict methods (10+ blocks)
- **I/O**: Print, input, file operations
- **File System**: File/folder operations
- **DateTime**: Date and time functions
- **And many more!**

### Right Panel
- **Code**: View generated Python code
- **Props**: Block properties (when selected)

### Bottom Panel
- **Output**: Program output and errors
- **Terminal**: Interactive shell
- **Desktop**: Desktop streaming (placeholder)

---

## 💡 Tips & Tricks

### Keyboard Shortcuts
- **Delete**: Remove selected block
- **Ctrl+C / Ctrl+V**: Copy/paste blocks
- **Ctrl+Z / Ctrl+Y**: Undo/redo

### Block Operations
- **Right-click** on block for options:
  - Duplicate
  - Add Comment
  - Inline Inputs
  - Collapse/Expand
  - Disable Block
  - Delete

### Workspace Navigation
- **Mouse wheel**: Scroll categories or zoom (if enabled)
- **Click + Drag**: Pan workspace
- **Ctrl + Wheel**: Zoom in/out

### Connecting Blocks
- **Snap together**: Drag blocks close to auto-connect
- **Value inputs**: Drop blocks that return values
- **Statement inputs**: Stack blocks that execute

---

## 🧩 Creating Custom Blocks

1. Click **"My Blocks"** in toolbar
2. Enter block name (e.g., "greet")
3. Add parameters (e.g., "name")
4. Write body code:
   ```python
   print(f"Hello, {name}!")
   ```
5. Choose a color
6. Click **"Create Block"**
7. Find your block in **"My Blocks"** category!

---

## 📦 Using External Libraries

### Example: Using Math Module
1. Drag **"import"** block from **Imports**
2. Type "math" as module name
3. Click **"Reload Logic"** button
4. New **"math"** category appears!
5. Use math.sin, math.cos, etc.

### Example: Using Random
1. Import "random"
2. Click **"Reload Logic"**
3. Use random.randint, random.choice, etc.

### Installing New Packages
1. Open **Terminal** tab
2. Type: `pip install package-name`
3. Import and use with **Reload Logic**

---

## 💾 Saving Your Work

### Save to Database
- Click **"Save"** to save to local SQLite database
- Projects persist across sessions
- Auto-saves workspace layout

### Export to Python File
1. Click **"Save As"**
2. Choose directory
3. Enter filename
4. Click **"Save"**
5. Your .py file is ready!

---

## 🔧 Settings Configuration

Click **Settings** icon (⚙️) to customize:

**Workspace:**
- Auto-hide block sidebar
- Snap blocks to grid
- Show/hide trashcan

**Behavior:**
- Scroll to zoom
- Sound effects

**Zoom:**
- Default zoom level (50%-120%)

---

## 🐛 Common Issues

### "Module not found" when importing
**Solution**: Install the package first
```bash
# In Terminal tab:
pip install package-name
```

### Blocks don't appear after import
**Solution**: Click **"Reload Logic"** button after adding import blocks

### Code doesn't run
**Check:**
- ✅ All blocks connected properly
- ✅ No red error highlights
- ✅ Required imports added
- ✅ View Output panel for errors

### Backend not connecting
**Solution**: Restart backend
```bash
cd backend
python -m uvicorn server:app --host 0.0.0.0 --port 8001
```

---

## 📚 Learning Path

### Beginner
1. ✅ Hello World (print blocks)
2. ✅ Variables (set, get, use)
3. ✅ Math operations (+, -, *, /)
4. ✅ Conditionals (if/else)
5. ✅ Loops (for, while)

### Intermediate
6. ✅ Functions (define, call, return)
7. ✅ Lists (create, append, iterate)
8. ✅ Strings (split, join, format)
9. ✅ Dictionaries (keys, values, items)
10. ✅ File I/O (read, write files)

### Advanced
11. ✅ Classes (define, instantiate)
12. ✅ Error handling (try/except)
13. ✅ Imports and modules
14. ✅ Custom blocks
15. ✅ Complex programs

---

## 🎓 Example Programs

### Calculator
```
Input: "Enter first number:"
Input: "Enter second number:"
Input: "Enter operation (+, -, *, /):"
Calculate and print result
```

### File Reader
```
Open file in read mode
Read all lines
For each line:
    Print line
Close file
```

### Password Generator
```
Import random
Import string
Set length = 12
Create list of characters
For i in range(length):
    Add random character
Join and print password
```

### Web Scraper (with requests)
```
Import requests
Set url = "https://example.com"
Make GET request
Print response text
```

---

## 🌟 Next Steps

1. **Explore all block categories** - Discover 200+ blocks!
2. **Build small projects** - Calculator, guess the number, etc.
3. **Use external libraries** - requests, pandas, matplotlib
4. **Create custom blocks** - Reusable code components
5. **Share your projects** - Export and share .py files

---

## 🆘 Get Help

- **README.md**: Full feature documentation
- **INSTALL.md**: Detailed installation guide
- **CONTRIBUTING.md**: Add your own blocks
- **GitHub Issues**: Report bugs or request features

---

**Happy coding with PyForge Visual! 🎉**

*Build powerful Python programs without typing code!*
