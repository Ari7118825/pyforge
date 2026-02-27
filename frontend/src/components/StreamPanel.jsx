import { useState } from 'react';
import { Monitor, MonitorOff, Maximize2, Minimize2, MousePointer2 } from 'lucide-react';

export const StreamPanel = () => {
  const [streaming, setStreaming] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div data-testid="stream-panel" className="flex flex-col h-full" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#27272a', background: '#0a0a0a' }}>
        <div className="flex items-center gap-2">
          <Monitor size={12} style={{ color: streaming ? '#10b981' : '#52525b' }} />
          <span className="text-xs font-medium" style={{ color: '#a1a1aa', fontFamily: 'Manrope, sans-serif' }}>
            Desktop Stream
          </span>
          {streaming && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <span className="status-dot status-running" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid="toggle-stream-btn"
            onClick={() => setStreaming(!streaming)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] hover:bg-white/5 active:scale-95"
            style={{ color: streaming ? '#ef4444' : '#06b6d4' }}
          >
            {streaming ? <MonitorOff size={11} /> : <Monitor size={11} />}
            {streaming ? 'Stop' : 'Stream'}
          </button>
        </div>
      </div>

      {/* Stream Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        {streaming ? (
          <div className="relative w-full h-full rounded-md overflow-hidden" style={{ border: '1px solid #27272a' }}>
            {/* TODO: Implement real WebRTC/MJPEG stream from host desktop */}
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-3"
              style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #18181b 100%)' }}
            >
              <Monitor size={32} style={{ color: '#27272a' }} />
              <p className="text-xs font-mono" style={{ color: '#3f3f46' }}>
                Desktop stream active
              </p>
              <p className="text-[10px]" style={{ color: '#27272a' }}>
                Stream feed will appear here when running on localhost
              </p>
            </div>
            {/* Stream overlay controls */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <button
                className="p-1.5 rounded glass hover:bg-white/10 active:scale-95"
                style={{ color: '#a1a1aa' }}
                title="Mouse passthrough"
              >
                <MousePointer2 size={12} />
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-1.5 rounded glass hover:bg-white/10 active:scale-95"
                style={{ color: '#a1a1aa' }}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ background: '#18181b', border: '1px dashed #27272a' }}
            >
              <Monitor size={24} style={{ color: '#27272a' }} />
            </div>
            <div className="text-center">
              <p className="text-xs" style={{ color: '#52525b' }}>Desktop Streaming</p>
              <p className="text-[10px] mt-1" style={{ color: '#3f3f46' }}>
                Click "Stream" to capture the host desktop
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
