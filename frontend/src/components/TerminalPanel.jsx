import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Plus, X } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const TerminalPanel = () => {
  const [connected, setConnected] = useState(false);
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  // Use current host for WebSocket - works on any domain
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/terminal`;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal
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
    term.open(terminalRef.current);
    fitAddon.fit();
    
    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect WebSocket
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      setConnected(true);
      term.writeln('\x1b[1;32m✓ Connected to terminal\x1b[0m');
      
      // Send terminal size
      socket.send(`RESIZE:${term.rows}:${term.cols}`);
    };

    socket.onmessage = (event) => {
      term.write(event.data);
    };

    socket.onerror = () => {
      term.writeln('\r\n\x1b[1;31m✗ Terminal connection error\x1b[0m');
      setConnected(false);
    };

    socket.onclose = () => {
      term.writeln('\r\n\x1b[1;33m✗ Terminal disconnected\x1b[0m');
      setConnected(false);
    };

    wsRef.current = socket;

    // Handle terminal input
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    // Handle terminal resize
    const handleResize = () => {
      fitAddon.fit();
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(`RESIZE:${term.rows}:${term.cols}`);
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#252526]">
        <TermIcon size={14} className="text-gray-400" />
        <span className="text-xs text-gray-300">Terminal</span>
        {connected && (
          <span className="ml-auto text-xs text-green-500">● Connected</span>
        )}
        {!connected && (
          <span className="ml-auto text-xs text-red-500">● Disconnected</span>
        )}
      </div>

      {/* Terminal */}
      <div 
        ref={terminalRef} 
        className="flex-1 p-2"
        style={{ minHeight: 0 }}
      />
    </div>
  );
};
      const newIdx = histIdx > 0 ? histIdx - 1 : -1;
      setHistIdx(newIdx);
      setInputValue(newIdx >= 0 ? history[history.length - 1 - newIdx] : '');
    }
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  const getLineColor = (type) => {
    switch (type) {
      case 'input': return '#FFD43B';
      case 'error': return '#ef4444';
      case 'system': return '#06b6d4';
      default: return '#a1a1aa';
    }
  };

  return (
    <div data-testid="terminal-panel" className="flex flex-col h-full" style={{ background: '#050505' }}>
      {/* Tab Bar */}
      <div className="flex items-center h-8 border-b" style={{ borderColor: '#27272a', background: '#0a0a0a' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-testid={`terminal-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 h-full text-xs border-r"
            style={{
              borderColor: '#27272a',
              background: activeTab === tab.id ? '#18181b' : 'transparent',
              color: activeTab === tab.id ? '#fafafa' : '#52525b',
            }}
          >
            <TermIcon size={11} />
            {tab.name}
          </button>
        ))}
        <button
          data-testid="terminal-new-tab-btn"
          onClick={() => {
            const id = Date.now();
            setTabs(prev => [...prev, { id, name: `Terminal ${prev.length + 1}`, lines: [] }]);
            setActiveTab(id);
          }}
          className="flex items-center justify-center w-7 h-full hover:bg-white/5"
          style={{ color: '#52525b' }}
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Terminal Content */}
      <div
        ref={termRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs leading-5 cursor-text"
        onClick={() => inputRef.current?.focus()}
        style={{ background: '#050505' }}
      >
        {activeTabData?.lines.map((line, i) => (
          <div key={i} style={{ color: getLineColor(line.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center px-2 py-1 border-t" style={{ borderColor: '#1a1a1a' }}>
        <span className="text-xs font-mono mr-1" style={{ color: '#FFD43B' }}>$</span>
        <input
          ref={inputRef}
          data-testid="terminal-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-xs font-mono"
          style={{ color: '#fafafa', caretColor: '#FFD43B' }}
          placeholder="Enter command..."
          autoFocus
        />
      </form>
    </div>
  );
};
