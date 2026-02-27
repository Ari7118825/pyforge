import { useState, useEffect } from 'react';
import { X, Settings, Monitor, Sidebar, MousePointer, Palette } from 'lucide-react';

const DEFAULT_SETTINGS = {
  autoHideToolbox: false,
  blockSnapToGrid: true,
  zoomOnScroll: true,
  showTrashcan: true,
  soundEffects: false,
  renderer: 'zelos',
  startScale: 0.9,
};

export const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [local, setLocal] = useState({ ...DEFAULT_SETTINGS, ...settings });

  useEffect(() => {
    setLocal({ ...DEFAULT_SETTINGS, ...settings });
  }, [settings]);

  const update = (key, value) => {
    const updated = { ...local, [key]: value };
    setLocal(updated);
    onSettingsChange(updated);
    localStorage.setItem('pyforge_settings', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const Toggle = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #1a1a1f' }}>
      <div>
        <p className="text-xs font-medium" style={{ color: '#d4d4d8' }}>{label}</p>
        {description && <p className="text-[10px] mt-0.5" style={{ color: '#3f3f46' }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-9 h-5 rounded-full transition-colors"
        style={{ background: value ? '#10b981' : '#27272a' }}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: '#fafafa',
            transform: value ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        data-testid="settings-modal"
        className="w-full max-w-md rounded-lg overflow-hidden animate-slide-up"
        style={{ background: '#18181b', border: '1px solid #27272a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex items-center gap-2">
            <Settings size={16} style={{ color: '#FFD43B' }} />
            <h2 className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#fafafa' }}>Settings</h2>
          </div>
          <button
            data-testid="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5"
            style={{ color: '#52525b' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings List */}
        <div className="px-5 py-2">
          {/* Workspace */}
          <div className="py-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sidebar size={12} style={{ color: '#06b6d4' }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#52525b' }}>Workspace</span>
            </div>
            <Toggle
              label="Auto-hide block sidebar"
              description="Sidebar collapses when not in use, more canvas space"
              value={local.autoHideToolbox}
              onChange={(v) => update('autoHideToolbox', v)}
            />
            <Toggle
              label="Snap blocks to grid"
              description="Blocks align to the grid when dropped"
              value={local.blockSnapToGrid}
              onChange={(v) => update('blockSnapToGrid', v)}
            />
            <Toggle
              label="Show trashcan"
              description="Show delete trashcan on the workspace"
              value={local.showTrashcan}
              onChange={(v) => update('showTrashcan', v)}
            />
          </div>

          {/* Behavior */}
          <div className="py-2">
            <div className="flex items-center gap-1.5 mb-2">
              <MousePointer size={12} style={{ color: '#f59e0b' }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#52525b' }}>Behavior</span>
            </div>
            <Toggle
              label="Scroll to zoom"
              description="Mouse wheel zooms the canvas (hold Shift to scroll categories)"
              value={local.zoomOnScroll}
              onChange={(v) => update('zoomOnScroll', v)}
            />
            <Toggle
              label="Sound effects"
              description="Play sounds when connecting and deleting blocks"
              value={local.soundEffects}
              onChange={(v) => update('soundEffects', v)}
            />
          </div>

          {/* Zoom */}
          <div className="py-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Monitor size={12} style={{ color: '#8b5cf6' }} />
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#52525b' }}>Zoom</span>
            </div>
            <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #1a1a1f' }}>
              <div>
                <p className="text-xs font-medium" style={{ color: '#d4d4d8' }}>Default zoom level</p>
              </div>
              <div className="flex items-center gap-2">
                {[0.5, 0.7, 0.9, 1.0, 1.2].map(s => (
                  <button
                    key={s}
                    onClick={() => update('startScale', s)}
                    className="px-2 py-1 rounded text-[10px] font-mono"
                    style={{
                      background: local.startScale === s ? '#FFD43B' : '#27272a',
                      color: local.startScale === s ? '#09090b' : '#52525b',
                    }}
                  >
                    {Math.round(s * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t" style={{ borderColor: '#27272a' }}>
          <button
            onClick={() => {
              const defaults = { ...DEFAULT_SETTINGS };
              setLocal(defaults);
              onSettingsChange(defaults);
              localStorage.setItem('pyforge_settings', JSON.stringify(defaults));
            }}
            className="text-[10px] px-3 py-1.5 rounded hover:bg-white/5"
            style={{ color: '#52525b' }}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_SETTINGS };
