import { useState, useEffect, useRef } from 'react';
import { Copy, Check, FileCode, ChevronDown, ChevronUp } from 'lucide-react';

export const CodePreview = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const codeRef = useRef(null);

  const copyCode = () => {
    navigator.clipboard.writeText(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = (code || '# Drag blocks to generate Python code').split('\n');
  const lineCount = lines.length;

  return (
    <div data-testid="code-preview" className="flex flex-col h-full" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#27272a', background: '#0a0a0a' }}>
        <div className="flex items-center gap-2">
          <FileCode size={12} style={{ color: '#06b6d4' }} />
          <span className="text-xs font-medium" style={{ color: '#a1a1aa', fontFamily: 'Manrope, sans-serif' }}>
            Generated Python
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#27272a', color: '#52525b' }}>
            {lineCount} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid="copy-code-btn"
            onClick={copyCode}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-white/5 active:scale-95"
            style={{ color: copied ? '#10b981' : '#52525b' }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-white/5"
            style={{ color: '#52525b' }}
          >
            {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Code */}
      {!collapsed && (
        <div ref={codeRef} className="flex-1 overflow-auto p-0">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td
                    className="text-right px-3 py-0 select-none font-mono text-[11px]"
                    style={{ color: '#3f3f46', minWidth: '36px', userSelect: 'none' }}
                  >
                    {i + 1}
                  </td>
                  <td
                    className="px-2 py-0 font-mono text-[11px] whitespace-pre"
                    style={{ color: '#d4d4d8' }}
                  >
                    {colorize(line)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Simple Python syntax highlighting
function colorize(line) {
  if (!line) return ' ';

  const keywords = /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|async|await|lambda|pass|break|continue|and|or|not|in|is|True|False|None|yield|global|nonlocal|assert|del)\b/g;
  const strings = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  const comments = /#.*/g;
  const numbers = /\b\d+\.?\d*\b/g;
  const builtins = /\b(print|input|range|len|str|int|float|list|dict|set|tuple|type|isinstance|open|super|self)\b/g;

  // Check comment first
  const commentMatch = line.match(comments);
  if (commentMatch && line.trimStart().startsWith('#')) {
    return <span style={{ color: '#52525b', fontStyle: 'italic' }}>{line}</span>;
  }

  const parts = [];
  let lastIdx = 0;
  const tokens = [];

  // Collect all matches
  let m;
  while ((m = strings.exec(line)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, text: m[0], color: '#10b981' });
  }
  while ((m = keywords.exec(line)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, text: m[0], color: '#06b6d4', bold: true });
  }
  while ((m = builtins.exec(line)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, text: m[0], color: '#FFD43B' });
  }
  while ((m = numbers.exec(line)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, text: m[0], color: '#f59e0b' });
  }

  // Sort by position and remove overlaps
  tokens.sort((a, b) => a.start - b.start);
  const filtered = [];
  let maxEnd = 0;
  for (const t of tokens) {
    if (t.start >= maxEnd) {
      filtered.push(t);
      maxEnd = t.end;
    }
  }

  for (const t of filtered) {
    if (t.start > lastIdx) {
      parts.push(<span key={`p${lastIdx}`} style={{ color: '#d4d4d8' }}>{line.slice(lastIdx, t.start)}</span>);
    }
    parts.push(
      <span key={`t${t.start}`} style={{ color: t.color, fontWeight: t.bold ? 600 : 400 }}>
        {t.text}
      </span>
    );
    lastIdx = t.end;
  }

  if (lastIdx < line.length) {
    parts.push(<span key={`end`} style={{ color: '#d4d4d8' }}>{line.slice(lastIdx)}</span>);
  }

  return parts.length > 0 ? parts : <span style={{ color: '#d4d4d8' }}>{line}</span>;
}
