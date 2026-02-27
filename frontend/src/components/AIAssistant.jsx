import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Sparkles, Code, Wand2, Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AIAssistant = ({ currentCode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `ai-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/ai/chat`, {
        message: userMsg.content,
        context: currentCode || '',
        session_id: sessionId,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentCode, sessionId]);

  const clearChat = async () => {
    try {
      await axios.delete(`${API}/ai/chat/${sessionId}`);
    } catch (e) { /* ignore */ }
    setMessages([]);
  };

  const quickActions = [
    { label: 'Explain code', icon: Code, prompt: 'Explain what this code does step by step' },
    { label: 'Generate', icon: Wand2, prompt: 'Generate a Python program that ' },
    { label: 'Fix errors', icon: Sparkles, prompt: 'Find and fix any issues in this code' },
  ];

  return (
    <div data-testid="ai-assistant" className="flex flex-col h-full" style={{ background: '#18181b' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: '#27272a' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#FFD43B' }} />
          <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#a1a1aa', fontFamily: 'Manrope, sans-serif' }}>
            PyForge AI
          </span>
        </div>
        <button
          data-testid="clear-ai-chat-btn"
          onClick={clearChat}
          className="p-1.5 rounded-md hover:bg-white/5 active:scale-95"
          style={{ color: '#52525b' }}
          title="Clear chat"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255, 212, 59, 0.1)' }}>
              <Sparkles size={18} style={{ color: '#FFD43B' }} />
            </div>
            <p className="text-xs text-center" style={{ color: '#52525b', maxWidth: '200px' }}>
              Ask me anything about Python. I can generate code, explain blocks, or help you fix issues.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  data-testid={`ai-quick-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setInput(action.prompt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left hover:bg-white/5 active:scale-[0.98]"
                  style={{ color: '#a1a1aa', border: '1px solid #27272a' }}
                >
                  <action.icon size={12} style={{ color: '#06b6d4' }} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`animate-slide-up ${msg.role === 'user' ? 'ml-4' : 'mr-4'}`}
          >
            <div
              className="px-3 py-2.5 rounded-lg text-xs leading-relaxed"
              style={{
                background: msg.role === 'user' ? 'rgba(255, 212, 59, 0.08)' : '#27272a',
                color: msg.role === 'user' ? '#fafafa' : '#a1a1aa',
                fontFamily: msg.role === 'assistant' ? 'JetBrains Mono, monospace' : 'inherit',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 px-3 py-2 animate-fade-in">
            <Loader2 size={12} className="animate-spin" style={{ color: '#06b6d4' }} />
            <span className="text-xs" style={{ color: '#52525b' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: '#27272a' }}>
        <div className="flex items-center gap-2">
          <input
            data-testid="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask PyForge AI..."
            className="flex-1 h-8 px-3 text-xs rounded-md outline-none"
            style={{
              background: '#09090b',
              color: '#fafafa',
              border: '1px solid #27272a',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          <button
            data-testid="ai-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="h-8 w-8 flex items-center justify-center rounded-md active:scale-95"
            style={{
              background: input.trim() ? '#FFD43B' : '#27272a',
              color: input.trim() ? '#09090b' : '#52525b',
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
