import { useState, useEffect } from 'react';
import {
  Play, Square, Save, FolderOpen, Download,
  BoxSelect, Zap, Puzzle, RefreshCw, Loader2, Settings
} from 'lucide-react';

export const Toolbar = ({
  currentCode,
  isRunning,
  onRun,
  onStop,
  onSave,
  onSaveAs,
  onReloadLogic,
  onOpenProject,
  onOpenMyBlocks,
  onOpenSettings,
  projectName,
  onProjectNameChange,
  isReloading,
  importCount,
}) => {
  const [blockCount, setBlockCount] = useState(0);

  useEffect(() => {
    const lines = (currentCode || '').split('\n').filter(l => l.trim());
    setBlockCount(lines.length);
  }, [currentCode]);

  return (
    <header
      data-testid="toolbar"
      className="flex items-center justify-between h-11 px-3 border-b select-none"
      style={{ background: '#0a0a0a', borderColor: '#27272a' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'rgba(255, 212, 59, 0.1)' }}>
            <BoxSelect size={15} style={{ color: '#FFD43B' }} />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: '#fafafa' }}>
            PyForge
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            VISUAL
          </span>
        </div>

        <div className="w-px h-5" style={{ background: '#27272a' }} />

        {/* Project Name */}
        <input
          data-testid="project-name-input"
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="bg-transparent text-xs font-medium outline-none px-2 py-1 rounded hover:bg-white/5 focus:bg-white/5"
          style={{ color: '#d4d4d8', maxWidth: '180px', fontFamily: 'Manrope, sans-serif' }}
        />
      </div>

      {/* Center Section - Run + Save + Reload */}
      <div className="flex items-center gap-1.5">
        {!isRunning ? (
          <button
            data-testid="run-btn"
            onClick={onRun}
            disabled={!currentCode?.trim()}
            className="flex items-center gap-1.5 h-7 px-4 rounded-md text-xs font-semibold active:scale-95"
            style={{
              background: currentCode?.trim() ? '#10b981' : '#27272a',
              color: currentCode?.trim() ? '#050505' : '#52525b',
              fontFamily: 'Manrope, sans-serif',
            }}
          >
            <Play size={12} />
            Run
          </button>
        ) : (
          <button
            data-testid="stop-btn"
            onClick={onStop}
            className="flex items-center gap-1.5 h-7 px-4 rounded-md text-xs font-semibold active:scale-95"
            style={{ background: '#ef4444', color: '#fafafa', fontFamily: 'Manrope, sans-serif' }}
          >
            <Square size={10} />
            Stop
          </button>
        )}

        <button
          data-testid="save-btn"
          onClick={onSave}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium hover:bg-white/5 active:scale-95"
          style={{ color: '#a1a1aa', border: '1px solid #27272a' }}
        >
          <Save size={12} />
          Save
        </button>

        <button
          data-testid="save-as-btn"
          onClick={onSaveAs}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium hover:bg-white/5 active:scale-95"
          style={{ color: '#a1a1aa', border: '1px solid #27272a' }}
          title="Save As .py file"
        >
          <Download size={12} />
          Save As
        </button>

        <div className="w-px h-5 mx-0.5" style={{ background: '#27272a' }} />

        {/* Reload Logic Button */}
        <button
          data-testid="reload-logic-btn"
          onClick={onReloadLogic}
          disabled={isReloading || !currentCode?.trim()}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium active:scale-95"
          style={{
            background: isReloading ? '#27272a' : 'rgba(6, 182, 212, 0.1)',
            color: isReloading ? '#52525b' : '#06b6d4',
            border: '1px solid',
            borderColor: isReloading ? '#27272a' : 'rgba(6, 182, 212, 0.2)',
            fontFamily: 'Manrope, sans-serif',
          }}
          title="Scan imports and create dynamic blocks"
        >
          {isReloading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Reload Logic
          {importCount > 0 && (
            <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              {importCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <button
          data-testid="my-blocks-btn"
          onClick={onOpenMyBlocks}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium hover:bg-white/5 active:scale-95"
          style={{ color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)', fontFamily: 'Manrope, sans-serif' }}
          title="My Blocks (Scratch-style reusable)"
        >
          <Puzzle size={12} />
          My Blocks
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: '#18181b' }}>
          <Zap size={10} style={{ color: '#FFD43B' }} />
          <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>
            {blockCount} lines
          </span>
        </div>

        <button
          data-testid="open-project-btn"
          onClick={onOpenProject}
          className="flex items-center gap-1 h-7 px-2 rounded-md text-xs hover:bg-white/5 active:scale-95"
          style={{ color: '#52525b' }}
          title="Open Project"
        >
          <FolderOpen size={13} />
        </button>

        <button
          data-testid="settings-btn"
          onClick={onOpenSettings}
          className="flex items-center gap-1 h-7 px-2 rounded-md text-xs hover:bg-white/5 active:scale-95"
          style={{ color: '#52525b' }}
          title="Settings"
        >
          <Settings size={13} />
        </button>
      </div>
    </header>
  );
};
