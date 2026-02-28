import { useState } from 'react';
import { Monitor, ExternalLink, RefreshCw } from 'lucide-react';

const STREAM_URL = '/api/stream/viewer';

export const DesktopPanel = () => {
  const [key, setKey] = useState(0);

  const openInNewTab = () => {
    window.open(STREAM_URL, '_blank', 'width=1920,height=1080');
  };

  const refreshStream = () => {
    setKey(prev => prev + 1);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gray-800">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-xs text-gray-300">Desktop Stream</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={refreshStream}
            className="p-1 hover:bg-gray-700 rounded"
            title="Refresh Stream"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>

          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            title="Open in New Tab"
          >
            <ExternalLink size={12} />
            Open in New Tab
          </button>
        </div>
      </div>

      {/* Embedded Stream via iframe */}
      <div className="flex-1 relative bg-black">
        <iframe
          key={key}
          src={STREAM_URL}
          className="w-full h-full border-0"
          title="Desktop Stream"
          allow="camera; microphone; display-capture"
        />
      </div>

      {/* Status bar */}
      <div className="px-3 py-1 bg-gray-800 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
        <span>Embedded Desktop Viewer</span>
        <span className="text-gray-500">
          Click "Open in New Tab" for fullscreen experience
        </span>
      </div>
    </div>
  );
};
