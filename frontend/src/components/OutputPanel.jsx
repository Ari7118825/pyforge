import { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const OutputPanel = ({ isRunning, output, onClear }) => {
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div data-testid="output-panel" className="flex flex-col h-full" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#27272a', background: '#0a0a0a' }}>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Loader2 size={12} className="animate-spin" style={{ color: '#FFD43B' }} />
          ) : output.exitCode === 0 ? (
            <CheckCircle size={12} style={{ color: '#10b981' }} />
          ) : output.exitCode !== null ? (
            <AlertCircle size={12} style={{ color: '#ef4444' }} />
          ) : (
            <Play size={12} style={{ color: '#52525b' }} />
          )}
          <span className="text-xs font-medium" style={{ color: '#a1a1aa', fontFamily: 'Manrope, sans-serif' }}>
            Output
          </span>
          {output.executionTime > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#27272a', color: '#52525b' }}>
              <Clock size={9} />
              {output.executionTime.toFixed(2)}s
            </span>
          )}
        </div>
        <button
          data-testid="clear-output-btn"
          onClick={onClear}
          className="text-[10px] px-2 py-0.5 rounded hover:bg-white/5 active:scale-95"
          style={{ color: '#52525b' }}
        >
          Clear
        </button>
      </div>

      {/* Output Content */}
      <div ref={outputRef} className="flex-1 overflow-auto p-3 font-mono text-xs leading-5">
        {output.lines.length === 0 && !isRunning ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs" style={{ color: '#3f3f46' }}>Run your code to see output here</p>
          </div>
        ) : (
          output.lines.map((line, i) => (
            <div
              key={i}
              style={{
                color: line.type === 'stderr' ? '#ef4444' : line.type === 'system' ? '#06b6d4' : '#d4d4d8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
