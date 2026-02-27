import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon, Plus, X, Maximize2, Minimize2 } from 'lucide-react';

export const TerminalPanel = () => {
  const [tabs, setTabs] = useState([{ id: 1, name: 'Terminal 1', lines: [] }]);
  const [activeTab, setActiveTab] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [ws, setWs] = useState(null);
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const termRef = useRef(null);
  const inputRef = useRef(null);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const wsUrl = backendUrl.replace(/^http/, 'ws') + '/api/ws/terminal';

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      addLine('system', 'Connected to PyForge Terminal');
      addLine('system', 'Type commands below...');
    };

    socket.onmessage = (event) => {
      addLine('output', event.data);
    };

    socket.onerror = () => {
      addLine('error', 'Terminal connection error');
    };

    socket.onclose = () => {
      addLine('system', 'Terminal disconnected');
    };

    setWs(socket);

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addLine = (type, text) => {
    setTabs(prev => prev.map(tab =>
      tab.id === 1 ? { ...tab, lines: [...tab.lines, { type, text, ts: Date.now() }] } : tab
    ));
  };

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [tabs]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addLine('input', `$ ${inputValue}`);
    setHistory(prev => [...prev, inputValue]);
    setHistIdx(-1);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(inputValue + '\n');
    }

    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = histIdx < history.length - 1 ? histIdx + 1 : histIdx;
      setHistIdx(newIdx);
      setInputValue(history[history.length - 1 - newIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
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
