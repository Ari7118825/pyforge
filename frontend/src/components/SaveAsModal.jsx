import { useState, useEffect, useCallback } from 'react';
import {
  X, FolderOpen, ChevronRight, ChevronUp, FileCode, Folder,
  HardDrive, Save, Loader2
} from 'lucide-react';
import axios from 'axios';

const API = '/api';

export const SaveAsModal = ({ isOpen, onClose, code }) => {
  const [currentPath, setCurrentPath] = useState('/tmp');
  const [filename, setFilename] = useState('main.py');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const loadDir = useCallback(async (path) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/files/list-dir`, { path });
      setCurrentPath(res.data.current);
      setItems(res.data.items);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to read directory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDir(currentPath);
      setSaved(false);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!filename.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await axios.post(`${API}/files/save`, {
        code: code || '',
        filepath: currentPath,
        filename: filename.trim(),
      });
      setSaved(true);
      setTimeout(() => { onClose(); setSaved(false); }, 1500);
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save file');
    } finally {
      setSaving(false);
    }
  };

  const navigateUp = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDir(parent);
  };

  if (!isOpen) return null;

  const dirs = items.filter(i => i.is_dir);
  const files = items.filter(i => !i.is_dir);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        data-testid="save-as-modal"
        className="w-full max-w-xl rounded-lg overflow-hidden animate-slide-up"
        style={{ background: '#18181b', border: '1px solid #27272a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex items-center gap-2">
            <Save size={16} style={{ color: '#FFD43B' }} />
            <h2 className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#fafafa' }}>Save As</h2>
          </div>
          <button
            data-testid="close-save-as-btn"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 active:scale-95"
            style={{ color: '#52525b' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Filename Input */}
        <div className="px-5 pt-4 pb-2">
          <label className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: '#52525b' }}>Filename</label>
          <input
            data-testid="save-as-filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full h-9 px-3 rounded-md text-sm outline-none font-mono"
            style={{ background: '#09090b', color: '#fafafa', border: '1px solid #3f3f46' }}
            placeholder="main.py"
          />
        </div>

        {/* Path Navigation */}
        <div className="px-5 py-2">
          <label className="text-[10px] uppercase tracking-wider font-semibold mb-1.5 block" style={{ color: '#52525b' }}>Location</label>
          <div className="flex items-center gap-1 mb-2">
            <button
              onClick={navigateUp}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs hover:bg-white/5 active:scale-95"
              style={{ color: '#a1a1aa', border: '1px solid #27272a' }}
            >
              <ChevronUp size={12} />
              Up
            </button>
            <div className="flex-1 flex items-center gap-1 px-2 py-1 rounded text-xs font-mono overflow-x-auto" style={{ background: '#09090b', color: '#06b6d4', border: '1px solid #27272a' }}>
              <HardDrive size={11} style={{ color: '#52525b', flexShrink: 0 }} />
              <span className="whitespace-nowrap">{currentPath}</span>
            </div>
          </div>
        </div>

        {/* Directory Browser */}
        <div className="px-5 pb-2">
          <div className="rounded-md overflow-hidden" style={{ border: '1px solid #27272a', maxHeight: '240px', overflowY: 'auto' }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin" style={{ color: '#52525b' }} />
              </div>
            ) : (
              <>
                {dirs.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.03]"
                    style={{ borderBottom: '1px solid #1a1a1f' }}
                    onClick={() => loadDir(item.path)}
                  >
                    <Folder size={13} style={{ color: '#FFD43B' }} />
                    <span className="text-xs" style={{ color: '#d4d4d8' }}>{item.name}</span>
                    <ChevronRight size={11} className="ml-auto" style={{ color: '#3f3f46' }} />
                  </div>
                ))}
                {files.filter(f => f.name.endsWith('.py')).map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.03]"
                    style={{ borderBottom: '1px solid #1a1a1f' }}
                    onClick={() => setFilename(item.name)}
                  >
                    <FileCode size={13} style={{ color: '#06b6d4' }} />
                    <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>{item.name}</span>
                  </div>
                ))}
                {dirs.length === 0 && files.length === 0 && (
                  <div className="flex items-center justify-center py-6">
                    <span className="text-xs" style={{ color: '#3f3f46' }}>Empty directory</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 pb-2">
            <p className="text-xs px-3 py-1.5 rounded" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: '#27272a' }}>
          <span className="text-[10px] font-mono" style={{ color: '#3f3f46' }}>
            {currentPath}/{filename}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-8 px-3 rounded-md text-xs hover:bg-white/5"
              style={{ color: '#52525b' }}
            >
              Cancel
            </button>
            <button
              data-testid="save-as-confirm-btn"
              onClick={handleSave}
              disabled={saving || !filename.trim()}
              className="flex items-center gap-1.5 h-8 px-4 rounded-md text-xs font-semibold active:scale-95"
              style={{
                background: saved ? '#10b981' : '#FFD43B',
                color: '#09090b',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saved ? 'Saved!' : 'Save File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
