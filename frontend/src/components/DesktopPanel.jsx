import { useState, useRef, useEffect } from 'react';
import { Monitor, Settings, RefreshCw, ExternalLink, Mic, Volume2, Gamepad2 } from 'lucide-react';
import axios from 'axios';

const API = '/api/stream';

export const DesktopPanel = () => {
  const [connected, setConnected] = useState(false);
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitor, setSelectedMonitor] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);
  const [micActive, setMicActive] = useState(false);
  const [desktopAudioActive, setDesktopAudioActive] = useState(false);
  const [remoteActive, setRemoteActive] = useState(false);
  const [fps, setFps] = useState(0);
  
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const controlWsRef = useRef(null);
  const micWsRef = useRef(null);
  const desktopWsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    loadMonitors();
    
    // FPS monitoring
    const fpsInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastTimeRef.current) / 1000;
      const currentFps = frameCountRef.current / elapsed;
      setFps(Math.round(currentFps * 10) / 10);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }, 1000);

    // Monitor frames
    let animationId;
    const monitorFrames = () => {
      frameCountRef.current++;
      animationId = requestAnimationFrame(monitorFrames);
    };
    monitorFrames();

    return () => {
      clearInterval(fpsInterval);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const loadMonitors = async () => {
    try {
      const response = await axios.get(`${API}/monitors`);
      setMonitors(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load monitors:', err);
      setError('Desktop streaming not available. Check backend dependencies.');
    }
  };

  const startStreaming = async () => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnected(true);
        }
      };

      pc.addTransceiver('video', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const response = await axios.post(`${API}/offer`, {
        sdp: offer.sdp,
        type: offer.type,
        monitor_id: selectedMonitor
      });

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
    
    // Stop all audio/control connections
    if (controlWsRef.current) controlWsRef.current.close();
    if (micWsRef.current) micWsRef.current.close();
    if (desktopWsRef.current) desktopWsRef.current.close();
    
    setConnected(false);
    setRemoteActive(false);
    setMicActive(false);
    setDesktopAudioActive(false);
  };

  const toggleRemoteControl = async () => {
    if (remoteActive) {
      if (controlWsRef.current) {
        controlWsRef.current.close();
        controlWsRef.current = null;
      }
      setRemoteActive(false);
      
      // Show cursor again
      await axios.post(`${API}/set_cursor`, { show: true });
    } else {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${API}/control`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = async () => {
        setRemoteActive(true);
        controlWsRef.current = ws;
        
        // Hide local cursor
        await axios.post(`${API}/set_cursor`, { show: false });
      };
      
      ws.onclose = () => {
        setRemoteActive(false);
        controlWsRef.current = null;
        axios.post(`${API}/set_cursor`, { show: true });
      };
    }
  };

  const toggleMic = () => {
    if (micActive) {
      if (micWsRef.current) {
        micWsRef.current.close();
        micWsRef.current = null;
      }
      setMicActive(false);
    } else {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${API}/mic_audio`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = () => {
        setMicActive(true);
        micWsRef.current = ws;
      };
      
      ws.onmessage = (e) => {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 48000});
        }
        playAudioChunk(e.data);
      };
      
      ws.onclose = () => {
        setMicActive(false);
        micWsRef.current = null;
      };
    }
  };

  const toggleDesktopAudio = () => {
    if (desktopAudioActive) {
      if (desktopWsRef.current) {
        desktopWsRef.current.close();
        desktopWsRef.current = null;
      }
      setDesktopAudioActive(false);
    } else {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${API}/desktop_audio`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      
      ws.onopen = () => {
        setDesktopAudioActive(true);
        desktopWsRef.current = ws;
      };
      
      ws.onmessage = (e) => {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)({sampleRate: 48000});
        }
        playAudioChunk(e.data);
      };
      
      ws.onclose = () => {
        setDesktopAudioActive(false);
        desktopWsRef.current = null;
      };
    }
  };

  const playAudioChunk = (data) => {
    const int16 = new Int16Array(data);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    
    const buffer = audioCtxRef.current.createBuffer(2, float32.length / 2, 48000);
    for (let c = 0; c < 2; c++) {
      const channelData = buffer.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = float32[i * 2 + c];
      }
    }
    
    const source = audioCtxRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtxRef.current.destination);
    
    const start = Math.max(audioCtxRef.current.currentTime, nextStartTimeRef.current);
    source.start(start);
    nextStartTimeRef.current = start + buffer.duration;
  };

  const openInNewTab = () => {
    window.open(`${API}/viewer`, '_blank', 'width=1920,height=1080');
  };

  const sendInput = (type, data = {}) => {
    if (!remoteActive || !controlWsRef.current || controlWsRef.current.readyState !== WebSocket.OPEN) return;
    controlWsRef.current.send(JSON.stringify({type, ...data}));
  };

  const getContentRect = () => {
    if (!videoRef.current) return null;
    const rect = videoRef.current.getBoundingClientRect();
    if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) return rect;
    
    const aspect = videoRef.current.videoWidth / videoRef.current.videoHeight;
    let contentW = rect.width;
    let contentH = contentW / aspect;
    
    if (contentH > rect.height) {
      contentH = rect.height;
      contentW = contentH * aspect;
    }
    
    return {
      left: rect.left + (rect.width - contentW) / 2,
      top: rect.top + (rect.height - contentH) / 2,
      width: contentW,
      height: contentH
    };
  };

  const handleMouseMove = (e) => {
    if (!remoteActive) return;
    const r = getContentRect();
    if (!r) return;
    
    const inside = e.clientX >= r.left && e.clientX <= r.left + r.width &&
                   e.clientY >= r.top && e.clientY <= r.top + r.height;
    
    if (inside) {
      const x_pct = (e.clientX - r.left) / r.width;
      const y_pct = (e.clientY - r.top) / r.height;
      sendInput('mouse_move', {x_pct, y_pct});
    }
  };

  const handleClick = (e) => {
    if (!remoteActive) return;
    const r = getContentRect();
    if (!r) return;
    
    const inside = e.clientX >= r.left && e.clientX <= r.left + r.width &&
                   e.clientY >= r.top && e.clientY <= r.top + r.height;
    
    if (inside) {
      sendInput('mouse_click');
    }
  };

  const handleWheel = (e) => {
    if (!remoteActive) return;
    e.preventDefault();
    sendInput('mouse_scroll', {delta_y: e.deltaY});
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-gray-800">
        <div className="flex items-center gap-2">
          <Monitor size={14} className="text-gray-400" />
          <span className="text-xs text-gray-300">Desktop Stream</span>
          {connected && (
            <>
              <span className="ml-2 text-xs text-green-500">● Live</span>
              <span className="text-xs text-gray-500">{fps} FPS</span>
            </>
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
                <option key={mon.id} value={mon.id}>
                  {mon.name}
                </option>
              ))}
            </select>
          )}

          {/* Audio & Control Toggles (only when connected) */}
          {connected && (
            <>
              <button
                onClick={toggleMic}
                className={`p-1.5 rounded ${micActive ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Microphone Audio"
              >
                <Mic size={14} />
              </button>
              
              <button
                onClick={toggleDesktopAudio}
                className={`p-1.5 rounded ${desktopAudioActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Desktop Audio"
              >
                <Volume2 size={14} />
              </button>
              
              <button
                onClick={toggleRemoteControl}
                className={`p-1.5 rounded ${remoteActive ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                title="Remote Control"
              >
                <Gamepad2 size={14} />
              </button>
            </>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Settings"
          >
            <Settings size={14} className="text-gray-400" />
          </button>

          {/* Open in New Tab */}
          <button
            onClick={openInNewTab}
            className="p-1 hover:bg-gray-700 rounded"
            title="Open in New Tab"
          >
            <ExternalLink size={14} className="text-gray-400" />
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

      {/* Video Stream */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {error && (
          <div className="text-center">
            <Monitor size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <p className="text-xs text-gray-500">
              Check backend logs for details
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
              Select a monitor and click start
            </p>
          </div>
        )}

        {connected && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onWheel={handleWheel}
            className={`max-w-full max-h-full object-contain ${remoteActive ? 'cursor-crosshair' : 'cursor-default'}`}
            style={{ imageRendering: 'crisp-edges' }}
          />
        )}
        
        {/* Remote control indicator */}
        {remoteActive && (
          <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            🎮 REMOTE CONTROL ACTIVE
          </div>
        )}
      </div>

      {/* Status bar */}
      {connected && (
        <div className="px-3 py-1 bg-gray-800 border-t border-white/10 text-xs text-gray-400 flex items-center justify-between">
          <span>
            {monitors[selectedMonitor]?.name} • {monitors[selectedMonitor]?.width}x{monitors[selectedMonitor]?.height} • {fps} FPS
          </span>
          <span className="text-gray-500">
            {remoteActive ? 'Click & type to interact' : 'Enable remote control to interact'}
          </span>
        </div>
      )}
    </div>
  );
};
