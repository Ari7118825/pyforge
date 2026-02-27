import { useState, useEffect, useCallback } from 'react';
import {
  X, FolderOpen, Plus, Trash2, Clock, FileCode,
  ChevronRight, Loader2, Search
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const ProjectManager = ({ isOpen, onClose, onLoadProject, onNewProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (e) {
      console.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) fetchProjects();
  }, [isOpen, fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await axios.post(`${API}/projects`, { name: newName.trim() });
      onNewProject(res.data);
      setCreating(false);
      setNewName('');
      onClose();
    } catch (e) {
      console.error('Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error('Failed to delete project');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        data-testid="project-manager-modal"
        className="w-full max-w-lg rounded-lg overflow-hidden animate-slide-up"
        style={{ background: '#18181b', border: '1px solid #27272a', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex items-center gap-2">
            <FolderOpen size={16} style={{ color: '#FFD43B' }} />
            <h2 className="text-sm font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#fafafa' }}>Projects</h2>
          </div>
          <button
            data-testid="close-project-manager-btn"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 active:scale-95"
            style={{ color: '#52525b' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search + New */}
        <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: '#27272a' }}>
          <div className="flex-1 flex items-center gap-2 h-8 px-3 rounded-md" style={{ background: '#09090b', border: '1px solid #27272a' }}>
            <Search size={12} style={{ color: '#52525b' }} />
            <input
              data-testid="project-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: '#fafafa' }}
            />
          </div>
          <button
            data-testid="new-project-btn"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1 h-8 px-3 rounded-md text-xs font-medium active:scale-95"
            style={{ background: '#FFD43B', color: '#09090b', fontFamily: 'Manrope, sans-serif' }}
          >
            <Plus size={13} />
            New
          </button>
        </div>

        {/* Create Form */}
        {creating && (
          <div className="flex items-center gap-2 px-5 py-3 border-b animate-fade-in" style={{ borderColor: '#27272a', background: 'rgba(255,212,59,0.03)' }}>
            <input
              data-testid="new-project-name-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Project name..."
              className="flex-1 h-8 px-3 rounded-md outline-none text-xs"
              style={{ background: '#09090b', color: '#fafafa', border: '1px solid #3f3f46' }}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="h-8 px-3 rounded-md text-xs font-medium active:scale-95"
              style={{ background: '#10b981', color: '#050505' }}
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(''); }}
              className="h-8 px-2 rounded-md text-xs hover:bg-white/5"
              style={{ color: '#52525b' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Project List */}
        <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={18} className="animate-spin" style={{ color: '#52525b' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <FileCode size={24} style={{ color: '#27272a' }} />
              <p className="text-xs" style={{ color: '#3f3f46' }}>
                {projects.length === 0 ? 'No projects yet' : 'No matching projects'}
              </p>
            </div>
          ) : (
            filtered.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] cursor-pointer group"
                style={{ borderBottom: '1px solid #1a1a1f' }}
                onClick={() => { onLoadProject(project); onClose(); }}
              >
                <div className="flex items-center gap-3">
                  <FileCode size={14} style={{ color: '#06b6d4' }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: '#fafafa' }}>{project.name}</p>
                    <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: '#3f3f46' }}>
                      <Clock size={9} />
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    data-testid={`delete-project-${project.id}`}
                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                    className="p-1.5 rounded hover:bg-white/5 active:scale-95"
                    style={{ color: '#52525b' }}
                  >
                    <Trash2 size={12} />
                  </button>
                  <ChevronRight size={14} style={{ color: '#3f3f46' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
