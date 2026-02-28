"""
Integrated Desktop Streaming Server for PyForge
Based on original stream.py - Windows ONLY
Uses bettercam for high-performance capture
"""

import asyncio
import threading
import time
import json
import fractions
from typing import Dict, Set

import cv2
import numpy as np
import bettercam
import pyautogui
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

# Audio
import pyaudiowpatch as pyaudio

# Monitor detection
try:
    from screeninfo import get_monitors
except ImportError:
    def get_monitors():
        return []

# Router
stream_router = APIRouter(prefix="/api/stream")

# ----------------------------------------------------------------------
# Video track (ORIGINAL from stream.py)
# ----------------------------------------------------------------------
class UncappedStreamTrack(VideoStreamTrack):
    def __init__(self, camera, monitor_idx=0):
        super().__init__()
        self.camera = camera
        self._start_time = time.time()
        self._time_base = fractions.Fraction(1, 1000)
        self.current_scale = 1.0
        self._latest_frame = None
        self._running = True
        self.show_local_cursor = True
        self.monitor_idx = monitor_idx
        self._capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._capture_thread.start()

    def set_scale(self, scale):
        self.current_scale = max(0.1, min(1.0, scale))

    def set_show_cursor(self, show: bool):
        self.show_local_cursor = show

    def stop(self):
        self._running = False
        if self._capture_thread.is_alive():
            self._capture_thread.join(timeout=1.0)

    def _capture_loop(self):
        while self._running:
            try:
                frame = self.camera.get_latest_frame()
                if frame is not None:
                    self._latest_frame = frame
            except Exception as e:
                print(f"[Capture thread] Error: {e}")
            time.sleep(0.001)

    async def recv(self):
        pts = int((time.time() - self._start_time) * 1000)
        frame = self._latest_frame
        while frame is None and self._running:
            await asyncio.sleep(0.001)
            frame = self._latest_frame

        if frame is None:
            return None

        img = frame.copy()

        # Only draw local cursor when remote control is NOT active
        if self.show_local_cursor:
            mx, my = pyautogui.position()
            # Simple absolute cursor draw (whole desktop coords)
            cv2.circle(img, (int(mx), int(my)), 7, (0, 0, 0), -1, cv2.LINE_AA)
            cv2.circle(img, (int(mx), int(my)), 5, (0, 0, 255), -1, cv2.LINE_AA)

        if self.current_scale < 0.99:
            h, w = img.shape[:2]
            new_w = max(160, int(w * self.current_scale))
            new_h = max(120, int(h * self.current_scale))
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        video_frame = VideoFrame.from_ndarray(img, format="bgr24")
        video_frame.pts = pts
        video_frame.time_base = self._time_base
        return video_frame

# ----------------------------------------------------------------------
# Global state
# ----------------------------------------------------------------------
class StreamServerState:
    def __init__(self):
        self.pcs: Set[RTCPeerConnection] = set()
        self.camera = None
        self.track = None
        self.current_monitor_idx = 0
        
        # WebSocket clients
        self.control_clients: Set[WebSocket] = set()
        self.mic_clients: Set[WebSocket] = set()
        self.desktop_clients: Set[WebSocket] = set()
        
        # Audio
        self.mic_p = pyaudio.PyAudio()
        self.desktop_p = pyaudio.PyAudio()
        self.mic_running = False
        self.desktop_running = False
        
        # Monitor region
        self.current_monitor_region = None
        self.current_monitor_bounds = None
        self._update_default_monitor()
        
        # Event loop for async operations from threads
        self.loop = None
        
        # Start audio threads
        self._start_audio_threads()
        
    def set_loop(self, loop):
        """Set the event loop for thread-safe async operations"""
        self.loop = loop

    def _update_default_monitor(self):
        """Fallback to primary monitor if no region is set yet"""
        try:
            monitors = get_monitors()
            primary = next((m for m in monitors if m.x == 0 and m.y == 0), monitors[0] if monitors else None)
            if primary:
                self.set_monitor_region((primary.x, primary.y, primary.width, primary.height))
            else:
                w, h = pyautogui.size()
                self.set_monitor_region((0, 0, w, h))
        except:
            w, h = pyautogui.size()
            self.set_monitor_region((0, 0, w, h))

    def set_monitor_region(self, region):
        """
        Set the current monitor region for mouse coordinate mapping.
        region = (left, top, width, height)
        """
        if not isinstance(region, (tuple, list)) or len(region) != 4:
            print("[Control] Invalid region format - ignoring")
            return

        left, top, width, height = map(int, region)
        self.current_monitor_region = (left, top, width, height)
        self.current_monitor_bounds = (left, top, left + width, top + height)
        print(f"[Control] Mouse control now mapped to monitor region: {self.current_monitor_bounds}")

    def _process_input(self, data: dict):
        action = data.get("type")
        if not action:
            return

        if action == "mouse_move":
            x_pct = float(data.get("x_pct", 0))
            y_pct = float(data.get("y_pct", 0))
            x_pct = max(0.0, min(1.0, x_pct))
            y_pct = max(0.0, min(1.0, y_pct))

            if self.current_monitor_region:
                left, top, width, height = self.current_monitor_region
                target_x = left + int(x_pct * width)
                target_y = top + int(y_pct * height)
            else:
                screen_w, screen_h = pyautogui.size()
                target_x = int(x_pct * screen_w)
                target_y = int(y_pct * screen_h)

            # Clamp to monitor bounds
            if self.current_monitor_bounds:
                l, t, r, b = self.current_monitor_bounds
                target_x = max(l, min(target_x, r - 1))
                target_y = max(t, min(target_y, b - 1))

            pyautogui.moveTo(target_x, target_y, duration=0.0, _pause=False)

        elif action == "mouse_down":
            pyautogui.mouseDown(_pause=False)

        elif action == "mouse_up":
            pyautogui.mouseUp(_pause=False)

        elif action == "mouse_click":
            pyautogui.click(_pause=False)

        elif action == "mouse_scroll":
            delta_y = data.get("delta_y", 0)
            pyautogui.scroll(-int(delta_y / 10))

        elif action == "key_down":
            key = data.get("key")
            if key:
                try:
                    pyautogui.keyDown(key, _pause=False)
                except:
                    pass

        elif action == "key_up":
            key = data.get("key")
            if key:
                try:
                    pyautogui.keyUp(key, _pause=False)
                except:
                    pass

    def _start_audio_threads(self):
        """Start microphone and desktop audio capture threads"""
        threading.Thread(target=self.mic_capture_loop, daemon=True).start()
        threading.Thread(target=self.desktop_capture_loop, daemon=True).start()

    def mic_capture_loop(self):
        FORMAT, CHUNK, TARGET_RATE = pyaudio.paInt16, 1024, 48000
        try:
            wasapi_info = self.mic_p.get_host_api_info_by_type(pyaudio.paWASAPI)
            mic = self.mic_p.get_device_info_by_index(wasapi_info["defaultInputDevice"])
            dev_rate = int(mic['defaultSampleRate'])
            dev_channels = mic["maxInputChannels"]
        except Exception as e:
            print(f"[Mic] Could not get default microphone: {e}")
            return

        stream = self.mic_p.open(format=FORMAT, channels=dev_channels, rate=dev_rate,
                                 input=True, input_device_index=mic["index"],
                                 frames_per_buffer=CHUNK)

        while True:
            if not self.mic_running:
                time.sleep(0.1)
                continue
                
            try:
                raw_bytes = stream.read(CHUNK, exception_on_overflow=False)
                audio_np = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32).reshape(-1, dev_channels)

                if dev_channels == 1:
                    audio_np = np.repeat(audio_np, 2, axis=1)

                if dev_rate != TARGET_RATE:
                    num_samples = int(len(audio_np) * TARGET_RATE / dev_rate)
                    audio_np = np.array([np.interp(np.linspace(0, len(audio_np), num_samples),
                                        np.arange(len(audio_np)), audio_np[:, c]) for c in range(2)]).T

                final_data = np.clip(audio_np.flatten(), -32768, 32767).astype(np.int16).tobytes()
                
                # Send to all connected mic clients (thread-safe)
                if self.mic_clients and self.loop:
                    for client in list(self.mic_clients):
                        try:
                            asyncio.run_coroutine_threadsafe(
                                client.send_bytes(final_data),
                                self.loop
                            )
                        except Exception as e:
                            pass
            except Exception as e:
                print(f"[Mic] Capture error: {e}")
                time.sleep(0.1)

    def desktop_capture_loop(self):
        FORMAT, CHUNK, TARGET_RATE = pyaudio.paInt16, 512, 48000
        # Find loopback device
        try:
            wasapi_info = self.desktop_p.get_host_api_info_by_type(pyaudio.paWASAPI)
            default_speakers = self.desktop_p.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
            loopback = None
            for lb in self.desktop_p.get_loopback_device_info_generator():
                if default_speakers["name"] in lb["name"]:
                    loopback = lb
                    break
            if not loopback:
                print("[Desktop] No loopback device found.")
                return
        except Exception as e:
            print(f"[Desktop] Error finding loopback: {e}")
            return

        dev_rate = int(loopback['defaultSampleRate'])
        dev_channels = loopback["maxInputChannels"]

        stream = self.desktop_p.open(format=FORMAT, channels=dev_channels, rate=dev_rate,
                                     input=True, input_device_index=loopback["index"],
                                     frames_per_buffer=CHUNK)

        while True:
            if not self.desktop_running:
                time.sleep(0.1)
                continue
                
            try:
                raw_bytes = stream.read(CHUNK, exception_on_overflow=False)
                audio_np = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32).reshape(-1, dev_channels)

                if dev_channels == 1:
                    audio_np = np.repeat(audio_np, 2, axis=1)
                elif dev_channels > 2:
                    audio_np = audio_np[:, :2]

                if dev_rate != TARGET_RATE:
                    num_samples = int(len(audio_np) * TARGET_RATE / dev_rate)
                    audio_np = np.array([np.interp(np.linspace(0, len(audio_np), num_samples),
                                        np.arange(len(audio_np)), audio_np[:, c]) for c in range(2)]).T

                final_data = np.clip(audio_np.flatten(), -32768, 32767).astype(np.int16).tobytes()
                
                # Send to all connected desktop audio clients (thread-safe)
                if self.desktop_clients and self.loop:
                    for client in list(self.desktop_clients):
                        try:
                            asyncio.run_coroutine_threadsafe(
                                client.send_bytes(final_data),
                                self.loop
                            )
                        except Exception as e:
                            pass
            except Exception as e:
                print(f"[Desktop] Capture error: {e}")
                time.sleep(0.1)

state = StreamServerState()

# ----------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------

@stream_router.get("/monitors")
async def get_monitors_list():
    """Get available monitors"""
    monitors = get_monitors()
    data = []
    for i, mon in enumerate(monitors):
        name = getattr(mon, 'name', f"Monitor {i+1}")
        if hasattr(mon, 'is_primary') and mon.is_primary:
            name += " (Primary)"
        data.append({
            "id": i,
            "name": name,
            "width": mon.width,
            "height": mon.height
        })
    return data

@stream_router.post("/offer")
async def handle_offer(data: dict):
    """Handle WebRTC offer"""
    # Set event loop for audio threads
    state.set_loop(asyncio.get_event_loop())
    
    sdp = data.get("sdp")
    sdp_type = data.get("type")
    monitor_id = data.get("monitor_id", 0)
    
    if monitor_id != state.current_monitor_idx:
        await set_monitor_and_recreate(monitor_id)
    
    pc = RTCPeerConnection()
    state.pcs.add(pc)
    
    if state.camera is None:
        state.camera = bettercam.create(output_idx=state.current_monitor_idx, output_color="BGR")
        state.camera.start(target_fps=0)
    
    if state.track is None:
        state.track = UncappedStreamTrack(state.camera, state.current_monitor_idx)
    
    pc.addTrack(state.track)
    
    offer = RTCSessionDescription(sdp=sdp, type=sdp_type)
    await pc.setRemoteDescription(offer)
    
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

async def set_monitor_and_recreate(monitor_id: int):
    """Switch monitor"""
    print(f"[Monitor Switch] Changing to output_idx {monitor_id}")
    
    # Destroy old
    if state.track:
        state.track.stop()
        del state.track
        state.track = None

    if state.camera:
        try:
            state.camera.stop()
        except:
            pass
        del state.camera
        state.camera = None
        await asyncio.sleep(0.5)

    # Create new with output_idx
    state.camera = bettercam.create(output_idx=monitor_id, output_color="BGR")
    state.camera.start(target_fps=0)
    state.track = UncappedStreamTrack(state.camera, monitor_id)
    state.current_monitor_idx = monitor_id

    print(f"[Monitor Switch] Successfully switched to output_idx {monitor_id}")

@stream_router.post("/set_monitor_region")
async def set_monitor_region_route(data: dict):
    """Set monitor region for mouse control"""
    monitor_id = data.get('monitor_id')
    monitors = get_monitors()
    if 0 <= monitor_id < len(monitors):
        mon = monitors[monitor_id]
        region = (mon.x, mon.y, mon.width, mon.height)
        state.set_monitor_region(region)
        return {"status": "ok"}
    return {"status": "error"}

@stream_router.post("/config")
async def update_config(data: dict):
    """Update stream config"""
    scale = data.get('scale', 1.0)
    if state.track:
        state.track.set_scale(scale)
    return {"status": "ok"}

@stream_router.post("/set_cursor")
async def set_cursor(data: dict):
    """Show/hide cursor"""
    show = data.get('show', True)
    if state.track:
        state.track.set_show_cursor(show)
    return {"status": "ok"}

# WebSocket endpoints
@stream_router.websocket("/control")
async def control_websocket(websocket: WebSocket):
    await websocket.accept()
    state.control_clients.add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                state._process_input(msg)
            except Exception as e:
                print(f"Control input error: {e}")
    except WebSocketDisconnect:
        pass
    finally:
        state.control_clients.discard(websocket)

@stream_router.websocket("/mic_audio")
async def mic_audio_websocket(websocket: WebSocket):
    await websocket.accept()
    state.mic_clients.add(websocket)
    state.mic_running = True
    try:
        # Keep connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        state.mic_clients.discard(websocket)
        if len(state.mic_clients) == 0:
            state.mic_running = False

@stream_router.websocket("/desktop_audio")
async def desktop_audio_websocket(websocket: WebSocket):
    await websocket.accept()
    state.desktop_clients.add(websocket)
    state.desktop_running = True
    try:
        # Keep connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        state.desktop_clients.discard(websocket)
        if len(state.desktop_clients) == 0:
            state.desktop_running = False

# Standalone HTML page
@stream_router.get("/viewer")
async def stream_viewer():
    """Standalone desktop stream viewer (opens in new tab)"""
    return HTMLResponse(content=STREAM_VIEWER_HTML)

STREAM_VIEWER_HTML = """<!DOCTYPE html>
<html>
<head>
    <title>Desktop Stream - PyForge</title>
    <style>
        body { background: #09090b; margin: 0; overflow: hidden; font-family: system-ui, sans-serif; color: white; }
        .ui { 
            position: absolute; top: 20px; left: 20px; z-index: 100; 
            background: rgba(15,15,20,0.95); padding: 20px; border-radius: 12px; 
            width: 280px; border: 1px solid #27272a; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        }
        video { width: 100vw; height: 100vh; object-fit: contain; background: #000; }
        .btn { 
            width: 100%; background: #18181b; color: white; border: 1px solid #27272a; 
            padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; 
            margin-top: 8px; transition: 0.2s;
        }
        .btn:hover { background: #27272a; }
        .btn.active { background: #0ea5e9; border-color: #0ea5e9; }
        select { width: 100%; padding: 8px; background: #18181b; color: white; border: 1px solid #27272a; border-radius: 6px; margin-bottom: 12px; }
        .fps { font-size: 24px; color: #0ea5e9; font-weight: 800; font-family: monospace; text-align: center; margin-top: 10px;}
    </style>
</head>
<body>
    <div class="ui">
        <select id="monitorSelect"></select>
        <button id="remoteBtn" class="btn">🎮 REMOTE CONTROL</button>
        <div class="fps" id="fps">0.0 FPS</div>
    </div>
    <video id="v" autoplay playsinline muted></video>
    <script>
        const video = document.getElementById('v');
        let pc = null;
        let remoteActive = false;
        let controlWs = null;

        async function start(monitorId = 0) {
            if (pc) pc.close();
            pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
            pc.ontrack = e => video.srcObject = e.streams[0];
            pc.addTransceiver('video', {direction: 'recvonly'});
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const res = await fetch('/api/stream/offer', {
                method: 'POST',
                body: JSON.stringify({
                    sdp: pc.localDescription.sdp,
                    type: pc.localDescription.type,
                    monitor_id: monitorId
                }),
                headers: {'Content-Type': 'application/json'}
            });
            const answer = await res.json();
            await pc.setRemoteDescription(answer);
        }

        async function loadMonitors() {
            const res = await fetch('/api/stream/monitors');
            const monitors = await res.json();
            const select = document.getElementById('monitorSelect');
            select.innerHTML = '';
            monitors.forEach((mon, i) => {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = mon.name || `Monitor ${i+1}`;
                select.appendChild(opt);
            });
            select.onchange = () => start(parseInt(select.value));
        }

        remoteBtn.onclick = async () => {
            const wsUrl = `ws://${window.location.host}/api/stream/control`;
            controlWs = new WebSocket(wsUrl);
            controlWs.onopen = () => {
                remoteActive = true;
                remoteBtn.innerText = "🎮 ACTIVE";
                remoteBtn.classList.add('active');
            };
            controlWs.onclose = () => {
                remoteActive = false;
                remoteBtn.innerText = "🎮 REMOTE CONTROL";
                remoteBtn.classList.remove('active');
            };
        };

        function sendInput(type, data = {}) {
            if (!remoteActive || !controlWs || controlWs.readyState !== WebSocket.OPEN) return;
            controlWs.send(JSON.stringify({type, ...data}));
        }

        video.addEventListener('mousemove', (e) => {
            if (!remoteActive) return;
            const r = video.getBoundingClientRect();
            const x_pct = (e.clientX - r.left) / r.width;
            const y_pct = (e.clientY - r.top) / r.height;
            sendInput('mouse_move', {x_pct, y_pct});
        });

        video.addEventListener('click', () => remoteActive && sendInput('mouse_click'));

        let frameCount = 0, lastTime = performance.now();
        function monitorFrames() {
            frameCount++;
            requestAnimationFrame(monitorFrames);
        }
        monitorFrames();
        setInterval(() => {
            const now = performance.now();
            const fps = (frameCount / ((now - lastTime)/1000)).toFixed(1);
            document.getElementById('fps').innerText = fps + " FPS";
            frameCount = 0; lastTime = now;
        }, 1000);

        loadMonitors().then(() => start(0));
    </script>
</body>
</html>"""
