import { useState, useEffect, useCallback } from 'react';
import {
  X, Plus, Trash2, Puzzle, Copy, Pencil,
  ChevronDown, ChevronRight, Loader2, Layers
} from 'lucide-react';
import axios from 'axios';

const API = '/api';

export const MyBlocksPanel = ({ isOpen, onClose, onBlockCreated }) => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', params: '', body_code: '', description: '', color: '#8b5cf6' });

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/custom-blocks`);
      setBlocks(res.data.blocks || []);
    } catch (e) {
      console.error('Failed to load custom blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchBlocks();
  }, [isOpen, fetchBlocks]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const res = await axios.post(`${API}/custom-blocks`, {
        name: form.name.trim().replace(/\s+/g, '_'),
        params: form.params.split(',').map(p => p.trim()).filter(Boolean),
        body_code: form.body_code,
        description: form.description,
        color: form.color,
      });
      setBlocks(prev => [...prev, res.data]);
      onBlockCreated?.(res.data);
      setCreating(false);
      setForm({ name: '', params: '', body_code: '', description: '', color: '#8b5cf6' });
    } catch (e) {
      console.error('Failed to create block');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/custom-blocks/${id}`);
      setBlocks(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error('Failed to delete block');
    }
  };

  const colors = [
    '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ec4899',
    '#ef4444', '#f97316', '#6366f1', '#14b8a6', '#FFD43B',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        data-testid="my-blocks-modal"
        className="w-full max-w-lg rounded-lg overflow-hidden animate-slide-up"
        style={{ background: '#18181b', border: '1px solid #27272a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex items-center gap-2">
            <Puzzle size={16} style={{ color: '#8b5cf6' }} />
            <h2 className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#fafafa' }}>My Blocks</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#27272a', color: '#52525b' }}>
              Scratch-style reusable
            </span>
          </div>
          <button data-testid="close-my-blocks-btn" onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5" style={{ color: '#52525b' }}>
            <X size={16} />
          </button>
        </div>

        {/* Create Button */}
        <div className="px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
          {!creating ? (
            <button
              data-testid="create-custom-block-btn"
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium active:scale-95"
              style={{ background: '#8b5cf6', color: '#fafafa', fontFamily: 'Manrope, sans-serif' }}
            >
              <Plus size={13} />
              Create New Block
            </button>
          ) : (
            <div className="space-y-3 animate-fade-in">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: '#52525b' }}>Block Name</label>
                  <input
                    data-testid="custom-block-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="my_block"
                    className="w-full h-8 px-3 rounded-md text-xs outline-none font-mono"
                    style={{ background: '#09090b', color: '#fafafa', border: '1px solid #27272a' }}
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: '#52525b' }}>Parameters (comma-sep)</label>
                  <input
                    data-testid="custom-block-params"
                    type="text"
                    value={form.params}
                    onChange={(e) => setForm(f => ({ ...f, params: e.target.value }))}
                    placeholder="x, y, z"
                    className="w-full h-8 px-3 rounded-md text-xs outline-none font-mono"
                    style={{ background: '#09090b', color: '#fafafa', border: '1px solid #27272a' }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: '#52525b' }}>Body Code (Python)</label>
                <textarea
                  data-testid="custom-block-body"
                  value={form.body_code}
                  onChange={(e) => setForm(f => ({ ...f, body_code: e.target.value }))}
                  placeholder={"# This code runs inside the block\nresult = x + y\nreturn result"}
                  rows={4}
                  className="w-full px-3 py-2 rounded-md text-xs outline-none font-mono resize-none"
                  style={{ background: '#09090b', color: '#fafafa', border: '1px solid #27272a', lineHeight: '1.6' }}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: '#52525b' }}>Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What does this block do?"
                    className="w-full h-8 px-3 rounded-md text-xs outline-none"
                    style={{ background: '#09090b', color: '#fafafa', border: '1px solid #27272a' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-semibold mb-1 block" style={{ color: '#52525b' }}>Color</label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-5 h-5 rounded-sm active:scale-90"
                        style={{
                          background: c,
                          outline: form.color === c ? '2px solid #fafafa' : 'none',
                          outlineOffset: '1px',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  data-testid="save-custom-block-btn"
                  onClick={handleCreate}
                  disabled={!form.name.trim()}
                  className="flex items-center gap-1 h-7 px-3 rounded-md text-xs font-semibold active:scale-95"
                  style={{ background: '#10b981', color: '#050505' }}
                >
                  Create Block
                </button>
                <button
                  onClick={() => setCreating(false)}
                  className="h-7 px-2 rounded-md text-xs hover:bg-white/5"
                  style={{ color: '#52525b' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Block List */}
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="animate-spin" style={{ color: '#52525b' }} />
            </div>
          ) : blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Layers size={24} style={{ color: '#27272a' }} />
              <p className="text-xs" style={{ color: '#3f3f46' }}>No custom blocks yet</p>
              <p className="text-[10px] text-center px-8" style={{ color: '#27272a' }}>
                Create reusable blocks to avoid duplicating logic. Define once, use everywhere — like Scratch's "My Blocks".
              </p>
            </div>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] group"
                style={{ borderBottom: '1px solid #1a1a1f' }}
              >
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: block.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium" style={{ color: '#fafafa' }}>{block.name}</span>
                    {block.params?.length > 0 && (
                      <span className="text-[10px] font-mono" style={{ color: '#52525b' }}>
                        ({block.params.join(', ')})
                      </span>
                    )}
                  </div>
                  {block.description && (
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: '#3f3f46' }}>{block.description}</p>
                  )}
                </div>
                <button
                  data-testid={`delete-custom-block-${block.id}`}
                  onClick={() => handleDelete(block.id)}
                  className="p-1.5 rounded hover:bg-white/5 opacity-0 group-hover:opacity-100 active:scale-95"
                  style={{ color: '#52525b' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
