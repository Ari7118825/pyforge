import { useState } from 'react';
import { Settings, Info, Hash, Palette, ToggleLeft } from 'lucide-react';

export const PropertiesPanel = ({ selectedBlock }) => {
  const [activeSection, setActiveSection] = useState('properties');

  return (
    <div data-testid="properties-panel" className="flex flex-col h-full" style={{ background: '#18181b' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: '#27272a' }}>
        <Settings size={13} style={{ color: '#06b6d4' }} />
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#a1a1aa', fontFamily: 'Manrope, sans-serif' }}>
          Properties
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {selectedBlock ? (
          <div className="space-y-4 animate-fade-in">
            {/* Block Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash size={11} style={{ color: '#FFD43B' }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#52525b' }}>Block Info</span>
              </div>
              <div className="p-3 rounded-md" style={{ background: '#09090b', border: '1px solid #27272a' }}>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#52525b' }}>Type</span>
                    <span className="text-xs font-mono" style={{ color: '#fafafa' }}>{selectedBlock.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs" style={{ color: '#52525b' }}>ID</span>
                    <span className="text-xs font-mono" style={{ color: '#3f3f46' }}>{selectedBlock.id?.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fields */}
            {selectedBlock.fields && Object.keys(selectedBlock.fields).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ToggleLeft size={11} style={{ color: '#06b6d4' }} />
                  <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#52525b' }}>Fields</span>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(selectedBlock.fields).map(([key, value]) => (
                    <div key={key} className="p-2 rounded" style={{ background: '#09090b', border: '1px solid #27272a' }}>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: '#52525b' }}>{key}</span>
                      <p className="text-xs font-mono mt-0.5" style={{ color: '#d4d4d8' }}>{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#09090b' }}>
              <Info size={16} style={{ color: '#27272a' }} />
            </div>
            <p className="text-xs text-center" style={{ color: '#3f3f46' }}>
              Click a block to inspect its properties
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
