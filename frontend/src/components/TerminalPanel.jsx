import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon } from 'lucide-react';
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
