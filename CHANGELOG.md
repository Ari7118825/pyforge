# Changelog

All notable changes to PyForge Visual are documented in this file.

## [1.0.0] - 2026-02-27

### 🎉 Initial Release - Offline Self-Hosted Version

#### ✨ Added
- **200+ Python Blocks** across 15+ categories
  - Text Manipulation: split, join, replace, find, slice, format, case operations, tests (isdigit, isalpha, etc.)
  - Math Functions: sin, cos, tan, sqrt, log, exp, ceil, floor, factorial, constants (pi, e, tau)
  - Random Module: randint, choice, uniform, shuffle, sample
  - File I/O: open, read, write, close, readline, readlines
  - File System: exists, isfile, isdir, listdir, mkdir, remove, rename
  - DateTime: now, date, time, strftime, timedelta
  - List Operations: append, extend, insert, remove, pop, clear, sort, reverse, index, count
  - Dict Operations: get, pop, keys, values, items, update, clear, setdefault
  - Control Flow: if/elif/else, loops, break, continue, pass, try/except/finally, assert
  - Functions: def, return, yield, lambda, global, nonlocal
  - All Python builtins: type conversions, introspection, sequences, etc.

- **Offline-First Architecture**
  - SQLite database for project storage (replaced MongoDB)
  - JSON file storage for custom blocks
  - No external API dependencies
  - No internet required after installation
  - Fully self-contained on localhost

- **Settings Panel**
  - Auto-hide block sidebar
  - Snap blocks to grid
  - Scroll to zoom configuration
  - Sound effects toggle
  - Default zoom level selection
  - Show/hide trashcan option

- **Comprehensive Documentation**
  - README.md with feature overview
  - INSTALL.md with step-by-step setup
  - CONTRIBUTING.md with block creation guide
  - Extensive code examples
  - Troubleshooting guides

- **Startup Scripts**
  - start.bat for Windows (10/11)
  - start.sh for Linux/Mac
  - Automatic service initialization
  - Error checking and validation

- **Clean Dependencies**
  - Minimal backend: 7 packages (FastAPI, uvicorn, aiosqlite, etc.)
  - Essential frontend: React, Blockly, UI components only
  - No AI/ML libraries
  - No cloud service SDKs
  - Total install size: ~350MB

#### 🗑️ Removed
- All AI features and integrations
  - Removed AI Assistant panel
  - Removed emergentintegrations library
  - Removed GPT-5.2 integration
  - Removed AI chat history
  - Removed all AI-related endpoints

- External Service Dependencies
  - Removed MongoDB (replaced with SQLite)
  - Removed motor (async MongoDB driver)
  - Removed pymongo
  - Removed all Google AI packages
  - Removed OpenAI packages
  - Removed litellm
  - Removed anthropic packages

- Emergent.sh Infrastructure
  - Removed .emergent folder
  - Removed deployment dependencies
  - Removed cloud-specific configurations
  - Removed memory folder
  - Removed test_reports folder

- Unnecessary Dependencies
  - Removed ~50+ unused Python packages
  - Cleaned up backend to 7 essential packages
  - Removed all external API clients
  - Removed unused frontend dependencies

#### 🔧 Changed
- **Backend Architecture**
  - Switched from MongoDB to SQLite for projects
  - Implemented aiosqlite for async database operations
  - Simplified server.py (removed AI endpoints)
  - Updated environment configuration
  - Removed MONGO_URL and EMERGENT_LLM_KEY requirements

- **Frontend Architecture**
  - Removed AIAssistant component
  - Updated App.js to remove AI tab
  - Changed default right panel from 'ai' to 'code'
  - Added Settings button to toolbar
  - Integrated SettingsModal component

- **Block System**
  - Expanded from ~30 blocks to 200+ blocks
  - Organized into 15+ categories
  - Added comprehensive tooltips
  - Improved code generation
  - Enhanced input validation

- **Configuration**
  - Simplified .env files
  - Removed external service URLs
  - Removed API keys requirements
  - Updated CORS to allow all origins for local network access

#### 🐛 Fixed
- Database connection issues (switched to local SQLite)
- Offline functionality (removed all external calls)
- Port configuration (simplified to localhost defaults)
- Environment variable handling
- Cross-platform compatibility (Windows 10/11 focus)

#### 📝 Documentation
- Complete README with features, installation, usage
- INSTALL.md with detailed setup instructions
- CONTRIBUTING.md with block creation guide
- Inline code documentation
- Examples and best practices

#### 🔒 Security
- Local-only operation by default
- No external API keys required
- No data sent to external services
- Code execution sandboxed to /tmp
- SQLite database with local file access only

---

## Future Roadmap

### Planned Features
- [ ] Code-to-blocks parser (AST-based bidirectional sync)
- [ ] Multi-file project support
- [ ] Virtual environment per project
- [ ] Debugging with breakpoints
- [ ] Block search functionality
- [ ] Theme customization (light/dark/custom)
- [ ] Export to standalone executable
- [ ] Plugin system for community blocks
- [ ] Block library marketplace
- [ ] Keyboard shortcut customization

### Under Consideration
- [ ] Mobile/tablet touch support
- [ ] Collaborative editing (local network)
- [ ] Version control integration (Git)
- [ ] Package manager UI
- [ ] Python environment manager
- [ ] Block animations and transitions
- [ ] Accessibility improvements (screen readers, etc.)
- [ ] Internationalization (i18n)
- [ ] Block favorites/bookmarks
- [ ] Workspace templates

---

## Version History

**[1.0.0]** - 2026-02-27
- Initial release
- Complete offline transformation
- 200+ blocks
- Full self-hosting support
- Windows 10/11 compatible
- Clean dependency tree
- Comprehensive documentation

---

## Contributors

Special thanks to all contributors who made this transformation possible!

## License

MIT License - See LICENSE file for details
