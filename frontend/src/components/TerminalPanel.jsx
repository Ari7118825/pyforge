import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Plus, X } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const TerminalPanel = () => {
  const [terminals, setTerminals] = useState([{ id: 1, name: 'Terminal 1' }]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const terminalsRef = useRef({});
  const containerRefs = useRef({});
  const wsRefs = useRef({});
  const fitAddonsRef = useRef({});

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/terminal`;

  // Create a new terminal tab
  const createTerminal = () => {
    const newId = Math.max(...terminals.map(t => t.id), 0) + 1;
    setTerminals([...terminals, { id: newId, name: `Terminal ${newId}` }]);
    setActiveTerminal(newId);
  };

  // Close a terminal tab
  const closeTerminal = (id) => {
    if (terminals.length === 1) return; // Keep at least one terminal
    
    // Close WebSocket
    if (wsRefs.current[id]) {
      wsRefs.current[id].close();
      delete wsRefs.current[id];
    }
    
    // Dispose terminal
    if (terminalsRef.current[id]) {
      terminalsRef.current[id].dispose();
      delete terminalsRef.current[id];
    }
    
    // Remove from state
    const newTerminals = terminals.filter(t => t.id !== id);
    setTerminals(newTerminals);
    
    // Switch to another terminal if the closed one was active
    if (activeTerminal === id) {
      setActiveTerminal(newTerminals[0].id);
    }
  };

  // Initialize terminal instance
  const initTerminal = (id) => {
    if (!containerRefs.current[id] || terminalsRef.current[id]) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRefs.current[id]);
    
    // Fit after opening
    setTimeout(() => {
      fitAddon.fit();
    }, 100);
    
    terminalsRef.current[id] = term;
    fitAddonsRef.current[id] = fitAddon;

    // Connect WebSocket
    const socket = new WebSocket(wsUrl);
    let connected = false;
    
    socket.onopen = () => {
      connected = true;
      term.writeln('\x1b[1;32m✓ Connected to terminal\x1b[0m');
      socket.send(`RESIZE:${term.rows}:${term.cols}`);
    };

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    socket.onerror = () => {
      if (connected) {
        term.writeln('\r\n\x1b[1;31m✗ Terminal connection error\x1b[0m');
      }
    };

    socket.onclose = () => {
      if (connected) {
        term.writeln('\r\n\x1b[1;33m✗ Terminal disconnected\x1b[0m');
      }
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        if (terminalsRef.current[id]) {
          term.writeln('\r\n\x1b[1;36m↻ Reconnecting...\x1b[0m');
          initTerminal(id);
        }
      }, 2000);
    };

    wsRefs.current[id] = socket;

    // Handle terminal input
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      if (fitAddonsRef.current[id] && terminalsRef.current[id]) {
        fitAddonsRef.current[id].fit();
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(`RESIZE:${term.rows}:${term.cols}`);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      term.dispose();
    };
  };

  // Initialize terminals when they become active
  useEffect(() => {
    terminals.forEach(t => {
      if (t.id === activeTerminal && !terminalsRef.current[t.id]) {
        setTimeout(() => initTerminal(t.id), 50);
      }
    });
  }, [terminals, activeTerminal]);

  // Fit terminal when switching tabs
  useEffect(() => {
    if (fitAddonsRef.current[activeTerminal]) {
      setTimeout(() => {
        fitAddonsRef.current[activeTerminal].fit();
      }, 100);
    }
  }, [activeTerminal]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header with tabs */}
      <div className="flex items-center gap-0 px-0 py-0 border-b border-white/10 bg-[#252526]">
        {terminals.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-3 py-2 border-r border-white/10 cursor-pointer group ${
              activeTerminal === t.id ? 'bg-[#1e1e1e]' : 'hover:bg-[#2a2a2e]'
            }`}
            onClick={() => setActiveTerminal(t.id)}
          >
            <TermIcon size={12} className={activeTerminal === t.id ? 'text-green-500' : 'text-gray-400'} />
            <span className="text-xs text-gray-300">{t.name}</span>
            {terminals.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-0.5"
              >
                <X size={12} className="text-gray-400 hover:text-red-400" />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={createTerminal}
          className="flex items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-[#2a2a2e]"
          title="New Terminal"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Terminal containers */}
      {terminals.map(t => (
        <div
          key={t.id}
          ref={el => containerRefs.current[t.id] = el}
          className="flex-1 p-2"
          style={{ 
            display: t.id === activeTerminal ? 'block' : 'none',
            minHeight: 0 
          }}
        />
      ))}
    </div>
  );
};
