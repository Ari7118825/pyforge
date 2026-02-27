import { useState, useRef, useEffect } from 'react';
import { Monitor, Settings, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = '/api';

export const DesktopPanel = () => {
  const [connected, setConnected] = useState(false);
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitor, setSelectedMonitor] = useState(1);
  const [fps, setFps] = useState(15);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadMonitors();
  }, []);

  const loadMonitors = async () => {
    try {
      const response = await axios.get(`${API}/desktop/monitors`);
      setMonitors(response.data.monitors);
    } catch (err) {
      console.error('Failed to load monitors:', err);
      setError('Desktop streaming not available. Install required packages.');
    }
  };

  const startStreaming = async () => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // Handle incoming video track
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnected(true);
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to server
      const response = await axios.post(`${API}/desktop/offer`, {
        sdp: offer.sdp,
        type: offer.type,
        monitor: selectedMonitor,
        fps: fps
      });

      // Set remote description (answer from server)
      await pc.setRemoteDescription(new RTCSessionDescription({
        sdp: response.data.sdp,
        type: response.data.type
      }));

      pcRef.current = pc;
      setError(null);
    } catch (err) {
      console.error('Failed to start streaming:', err);
      setError('Failed to start streaming: ' + err.message);
      setConnected(false);
    }
  };

  const stopStreaming = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setConnected(false);
  };

  const handleMouseMove = (e) => {
    if (!connected || !videoRef.current) return;
    
    const rect = videoRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * monitors[selectedMonitor]?.width || 0);
    const y = Math.floor((e.clientY - rect.top) / rect.height * monitors[selectedMonitor]?.height || 0);
    
    axios.post(`${API}/desktop/input/mouse`, {
      action: 'move',
      x, y
    }).catch(console.error);
  };

  const handleClick = (e) => {
    if (!connected || !videoRef.current) return;
    
    const rect = videoRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / rect.width * monitors[selectedMonitor]?.width || 0);
    const y = Math.floor((e.clientY - rect.top) / rect.height * monitors[selectedMonitor]?.height || 0);
    
    axios.post(`${API}/desktop/input/mouse`, {
      action: 'click',
      x, y,
      button: e.button === 0 ? 'left' : e.button === 2 ? 'right' : 'middle'
    }).catch(console.error);
  };

  const handleKeyPress = (e) => {
    if (!connected) return;
    
    axios.post(`${API}/desktop/input/keyboard`, {
      action: 'press',
      key: e.key
    }).catch(console.error);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gray-800">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-xs text-gray-300">Desktop Stream</span>
          {connected && (
            <span className="ml-2 text-xs text-green-500">● Streaming</span>
          )}
          {!connected && monitors.length > 0 && (
            <span className="ml-2 text-xs text-gray-500">● Disconnected</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Monitor selector */}
          {!connected && monitors.length > 0 && (
            <select
              value={selectedMonitor}
              onChange={(e) => setSelectedMonitor(Number(e.target.value))}
              className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-2 py-1"
            >
              {monitors.map((mon) => (
                <option key={mon.index} value={mon.index}>
                  {mon.name} ({mon.width}x{mon.height})
                </option>
              ))}
            </select>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Settings"
          >
            <Settings size={14} className="text-gray-400" />
          </button>

          {/* Connect/Disconnect */}
          {!connected ? (
            <button
              onClick={startStreaming}
              disabled={monitors.length === 0}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded"
            >
              Start Stream
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Stop Stream
            </button>
          )}

          <button
            onClick={loadMonitors}
            className="p-1 hover:bg-gray-700 rounded"
            title="Refresh monitors"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-3 py-2 bg-gray-800 border-b border-white/10">
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-gray-400">FPS:</span>
              <input
                type="range"
                min="5"
                max="30"
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-white w-8">{fps}</span>
            </label>
          </div>
        </div>
      )}

      {/* Video Stream */}
      <div className="flex-1 flex items-center justify-center bg-black">
        {error && (
          <div className="text-center">
            <Monitor size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <p className="text-xs text-gray-500">
              Install: pip install aiortc mss numpy pillow pyautogui av
            </p>
          </div>
        )}
        
        {!error && monitors.length === 0 && (
          <div className="text-center">
            <Monitor size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-gray-400">Loading monitors...</p>
          </div>
        )}

        {!error && monitors.length > 0 && !connected && (
          <div className="text-center">
            <Monitor size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-gray-400 mb-2">Click "Start Stream" to view desktop</p>
            <p className="text-xs text-gray-500">
              Select a monitor above and adjust FPS if needed
            </p>
          </div>
        )}

        {connected && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onKeyDown={handleKeyPress}
            tabIndex={0}
            className="max-w-full max-h-full object-contain cursor-crosshair"
            style={{ imageRendering: 'crisp-edges' }}
          />
        )}
      </div>

      {/* Status bar */}
      {connected && (
        <div className="px-3 py-1 bg-gray-800 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
          <span>
            Monitor {selectedMonitor}: {monitors[selectedMonitor]?.width}x{monitors[selectedMonitor]?.height} @ {fps}fps
          </span>
          <span className="text-gray-500">
            Click to interact • Type to send keys
          </span>
        </div>
      )}
    </div>
  );
};
