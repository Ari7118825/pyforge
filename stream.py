#!/usr/bin/env python3
"""
Unified Remote Desktop Server
Combines video streaming (WebRTC), microphone audio, desktop audio, and remote control
into a single aiohttp server on one port. No Pinggy tunneling.
"""

import asyncio
import threading
import time
import json
import fractions
from http import HTTPStatus

import cv2
import numpy as np
import bettercam
import pyautogui
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from av import VideoFrame
from aiohttp import web

# Audio
import pyaudiowpatch as pyaudio

# Monitor detection
try:
    from screeninfo import get_monitors
except ImportError:
    def get_monitors():
        return []

# ----------------------------------------------------------------------
# Video track (unchanged from original)
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
        self.show_local_cursor = True   # default: show local cursor
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
# Unified server
# ----------------------------------------------------------------------
class UnifiedRemoteDesktopServer:
    def __init__(self, port=8080):
        self.port = port
        self.loop = None
        self.running = False

        # WebRTC / video
        self.pcs = set()
        self.camera = None
        self.track = None
        self.current_monitor_idx = 0  # default primary

        # WebSocket client sets
        self.control_clients = set()
        self.mic_clients = set()
        self.desktop_clients = set()

        # Audio
        self.mic_p = pyaudio.PyAudio()
        self.desktop_p = pyaudio.PyAudio()  # separate instance for desktop (optional but safe)
        self.mic_running = False
        self.desktop_running = False

        # Monitor-aware mouse control (from ControlServer)
        self.current_monitor_region = None  # (left, top, width, height)
        self.current_monitor_bounds = None  # (left, top, right, bottom)
        self._update_default_monitor()

    # ------------------------------------------------------------------
    # Monitor region helpers (from ControlServer)
    # ------------------------------------------------------------------
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

    # ------------------------------------------------------------------
    # Control input processing (from ControlServer)
    # ------------------------------------------------------------------
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
            pyautogui.scroll(-int(delta_y / 10))  # invert direction

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

    # ------------------------------------------------------------------
    # WebSocket handlers
    # ------------------------------------------------------------------
    async def control_handler(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.control_clients.add(ws)
        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        self._process_input(data)
                    except Exception as e:
                        print(f"Control input error: {e}")
        finally:
            self.control_clients.discard(ws)
        return ws

    async def mic_audio_handler(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.mic_clients.add(ws)
        try:
            await ws.close()  # just wait for client disconnect
        finally:
            self.mic_clients.discard(ws)
        return ws

    async def desktop_audio_handler(self, request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        self.desktop_clients.add(ws)
        try:
            await ws.close()
        finally:
            self.desktop_clients.discard(ws)
        return ws

    # ------------------------------------------------------------------
    # Audio capture loops (from mic_audio.py and desktop_audio.py)
    # ------------------------------------------------------------------
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

        while self.mic_running:
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
                if self.mic_clients and self.loop:
                    for client in list(self.mic_clients):
                        self.loop.call_soon_threadsafe(
                            asyncio.create_task, client.send_bytes(final_data)
                        )
            except Exception as e:
                print(f"[Mic] Capture error: {e}")
                break
        stream.stop_stream()
        stream.close()

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

        while self.desktop_running:
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
                if self.desktop_clients and self.loop:
                    for client in list(self.desktop_clients):
                        self.loop.call_soon_threadsafe(
                            asyncio.create_task, client.send_bytes(final_data)
                        )
            except Exception as e:
                print(f"[Desktop] Capture error: {e}")
                break
        stream.stop_stream()
        stream.close()

    # ------------------------------------------------------------------
    # HTTP endpoints (from HyperStreamRTC, adapted)
    # ------------------------------------------------------------------
    async def index(self, request):
        # HTML content – modified to connect to local WebSocket paths
        content = """<!DOCTYPE html>
<html>
<head>
    <title>Unified Remote Desktop</title>
    <style>
        body { background: #0a0a0a; margin: 0; overflow: hidden; font-family: 'Segoe UI', sans-serif; color: white; }
        .ui { 
            position: absolute; top: 20px; left: 20px; z-index: 100; 
            background: rgba(20,20,20,0.95); padding: 20px; border-radius: 12px; 
            width: 280px; border: 1px solid #333; box-shadow: 0 8px 32px rgba(0,0,0,0.8);
            transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
        }
        .ui.minimized { transform: translateX(-350px); opacity: 0; pointer-events: none; }
        .gear-toggle { 
            position: absolute; top: 20px; left: 20px; z-index: 101;
            background: rgba(20,20,20,0.8); border: 1px solid #444;
            width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; opacity: 0; pointer-events: none;
            transition: opacity 0.3s, transform 0.3s;
        }
        .gear-toggle.visible { opacity: 1; pointer-events: auto; }
        .gear-toggle:hover { background: #333; transform: rotate(45deg); }
        .gear-toggle svg { width: 20px; height: 20px; fill: #ff3366; }
        video { 
            width: 100vw; height: 100vh; object-fit: contain; background: #000; cursor: default !important; 
        }
        .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        input[type=range] { flex-grow: 1; margin-right: 15px; accent-color: #ff3366; cursor: pointer; }
        .val { font-weight: bold; color: #ff3366; font-family: monospace; font-size: 16px; min-width: 50px; text-align: right; }
        label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1.5px; }
        select { width: 100%; padding: 8px; background: #333; color: white; border: 1px solid #444; border-radius: 6px; margin-bottom: 12px; }
        .btn { 
            width: 100%; background: #333; color: white; border: 1px solid #444; 
            padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; 
            margin-top: 8px; transition: 0.2s; text-transform: uppercase; font-size: 12px;
        }
        .btn:hover { background: #444; }
        .btn.active { background: #00ffcc; color: #000; border-color: #00ffcc; }
        .btn-remote.active { background: #ff3366; color: white; border-color: #ff3366; }
        .btn-minimize { background: transparent; border-color: #555; color: #aaa; margin-top: 15px; }
        .fps-counter { font-size: 32px; color: #ff3366; font-weight: 800; font-family: monospace; text-align: center; margin-top: 10px;}
        #switchMsg { color: #ff3366; font-size: 14px; margin-top: 10px; text-align: center; display: none; }
        .loading-overlay {
            position: absolute; inset: 0; background: rgba(0,0,0,0.4);
            display: none; align-items: center; justify-content: center;
            color: white; font-size: 1.2em; z-index: 99;
        }
        .loading .loading-overlay { display: flex; }
        .loading input[type=range], .loading select, .loading button {
            pointer-events: none;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div id="gearToggle" class="gear-toggle">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58C4.84 11.36 4.81 11.69 4.81 12s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61L19.14 12.94zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
    </div>

    <div id="mainUi" class="ui">
        <div class="loading-overlay" id="loadingOverlay">Loading...</div>
        <div class="row"><label>Resolution Scale</label><span class="val" id="resVal">100%</span></div>
        <div class="row"><input type="range" id="resSlider" min="10" max="100" value="100"></div>
        
        <label>Monitor</label>
        <select id="monitorSelect"></select>
        <div id="switchMsg">Switching monitor... (stream will restart)</div>

        <button id="micBtn" class="btn">MICROPHONE AUDIO</button>
        <button id="desktopBtn" class="btn">DESKTOP AUDIO</button>
        <button id="remoteBtn" class="btn btn-remote">REMOTE CONTROL</button>
        <button id="minimizeBtn" class="btn btn-minimize">MINIMIZE UI</button>
        
        <div style="margin-top:20px; padding-top:15px; border-top:1px solid #333;">
            <label>Browser FPS</label>
            <div class="fps-counter" id="realFps">0.0</div>
        </div>
    </div>

    <video id="v" autoplay playsinline muted></video>

    <script>
        const video = document.getElementById('v');
        const switchMsg = document.getElementById('switchMsg');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const ui = document.getElementById('mainUi');
        let pc = null;
        let isLoading = false;

        function setLoading(state) {
            isLoading = state;
            ui.classList.toggle('loading', state);
            loadingOverlay.style.display = state ? 'flex' : 'none';
        }

        async function renegotiate(monitorId) {
            setLoading(true);
            switchMsg.style.display = 'block';
            if (pc) {
                pc.close();
            }
            pc = new RTCPeerConnection({iceServers: [{urls: 'stun:stun.l.google.com:19302'}]});
            pc.ontrack = e => video.srcObject = e.streams[0];
            pc.addTransceiver('video', {direction: 'recvonly'});
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            const res = await fetch('/offer', {
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
            switchMsg.style.display = 'none';
            setLoading(false);
        }

        // Monitor selection
        async function loadMonitors() {
            try {
                const res = await fetch('/monitors');
                const monitors = await res.json();
                const select = document.getElementById('monitorSelect');
                select.innerHTML = '';
                monitors.forEach((mon, i) => {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = mon.name || `Monitor ${i+1} (${mon.width}×${mon.height})`;
                    select.appendChild(opt);
                });
                select.value = 0;
                select.onchange = async () => {
                    const id = parseInt(select.value);
                    // Tell control server about new monitor
                    await fetch('/set_monitor_region', {
                        method: 'POST',
                        body: JSON.stringify({monitor_id: id}),
                        headers: {'Content-Type': 'application/json'}
                    });
                    // Then renegotiate video stream
                    await renegotiate(id);
                };
            } catch(e) {
                console.error("Failed to load monitors:", e);
            }
        }

        // Initial connection
        async function start() {
            await renegotiate(0);
        }

        // UI toggle
        let hoverTimeout = null;
        document.addEventListener('mousemove', () => {
            if (mainUi.classList.contains('minimized')) {
                clearTimeout(hoverTimeout);
                gearToggle.classList.add('visible');
                hoverTimeout = setTimeout(() => gearToggle.classList.remove('visible'), 3000);
            }
        });

        gearToggle.onclick = () => {
            mainUi.classList.remove('minimized');
            gearToggle.classList.remove('visible');
        };

        minimizeBtn.onclick = () => mainUi.classList.add('minimized');

        let remoteActive = false;
        let audioCtx = null;
        let nextStartTime = 0;
        const RATE = 48000;
        const CHANNELS = 2;
        let controlWs = null;

        function sendInput(type, data = {}) {
            if (!remoteActive || !controlWs || controlWs.readyState !== WebSocket.OPEN) return;
            controlWs.send(JSON.stringify({type, ...data}));
        }

        function getContentRect() {
            const rect = video.getBoundingClientRect();
            if (video.videoWidth === 0 || video.videoHeight === 0) return rect;
            const aspect = video.videoWidth / video.videoHeight;
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
        }

        // Remote control: connect directly to /control WebSocket
        remoteBtn.onclick = async () => {
            remoteBtn.disabled = true;
            remoteBtn.innerText = "CONNECTING...";
            const wsUrl = `ws://${window.location.host}/control`;
            controlWs = new WebSocket(wsUrl);
            controlWs.onopen = async () => {
                remoteActive = true;
                remoteBtn.innerText = "REMOTE ACTIVE";
                remoteBtn.classList.add('active');
                remoteBtn.disabled = false;
                // Tell server to hide local cursor
                await fetch('/set_cursor', {
                    method: 'POST',
                    body: JSON.stringify({show: false}),
                    headers: {'Content-Type': 'application/json'}
                });
            };
            controlWs.onerror = () => {
                remoteBtn.innerText = "REMOTE CONTROL";
                remoteBtn.disabled = false;
            };
            controlWs.onclose = () => {
                remoteActive = false;
                remoteBtn.innerText = "REMOTE CONTROL";
                remoteBtn.classList.remove('active');
                // Show local cursor again when remote disconnects
                fetch('/set_cursor', {
                    method: 'POST',
                    body: JSON.stringify({show: true}),
                    headers: {'Content-Type': 'application/json'}
                });
            };
        };

        video.addEventListener('mousemove', (e) => {
            if (!remoteActive) return;
            const r = getContentRect();
            const inside = e.clientX >= r.left && e.clientX <= r.left + r.width &&
                           e.clientY >= r.top  && e.clientY <= r.top  + r.height;
            if (inside) {
                const x_pct = (e.clientX - r.left) / r.width;
                const y_pct = (e.clientY - r.top)  / r.height;
                sendInput('mouse_move', {x_pct, y_pct});
            }
        });

        video.addEventListener('mousedown', (e) => {
            if (!remoteActive) return;
            const r = getContentRect();
            if (e.clientX >= r.left && e.clientX <= r.left + r.width &&
                e.clientY >= r.top  && e.clientY <= r.top  + r.height) {
                sendInput('mouse_down');
            }
        });

        video.addEventListener('mouseup', (e) => {
            if (!remoteActive) return;
            const r = getContentRect();
            if (e.clientX >= r.left && e.clientX <= r.left + r.width &&
                e.clientY >= r.top  && e.clientY <= r.top  + r.height) {
                sendInput('mouse_up');
            }
        });

        video.addEventListener('wheel', (e) => {
            if (!remoteActive) return;
            const r = getContentRect();
            if (e.clientX >= r.left && e.clientX <= r.left + r.width &&
                e.clientY >= r.top  && e.clientY <= r.top  + r.height) {
                sendInput('mouse_scroll', {delta_y: e.deltaY});
            }
        }, {passive: false});

        document.addEventListener('keydown', (e) => {
            if (!remoteActive) return;
            e.preventDefault();  // Disable browser shortcuts
            let key = e.key.toLowerCase();
            // Map special keys to pyautogui names
            const keyMap = {
                'arrowleft': 'left',
                'arrowright': 'right',
                'arrowup': 'up',
                'arrowdown': 'down',
                'enter': 'enter',
                'escape': 'esc',
                'backspace': 'backspace',
                'delete': 'delete',
                'tab': 'tab',
                'capslock': 'capslock',
                'shiftleft': 'shift',
                'shiftright': 'shift',
                'controlleft': 'ctrl',
                'controlright': 'ctrl',
                'altleft': 'alt',
                'altright': 'alt',
                'metaleft': 'win',
                'metaright': 'win',
                'contextmenu': 'apps',
                'f1': 'f1',
                'f2': 'f2',
                'f3': 'f3',
                'f4': 'f4',
                'f5': 'f5',
                'f6': 'f6',
                'f7': 'f7',
                'f8': 'f8',
                'f9': 'f9',
                'f10': 'f10',
                'f11': 'f11',
                'f12': 'f12',
                'insert': 'insert',
                'home': 'home',
                'end': 'end',
                'pageup': 'pageup',
                'pagedown': 'pagedown',
                'numlock': 'numlock',
                'numpad0': '0',
                'numpad1': '1',
                'numpad2': '2',
                'numpad3': '3',
                'numpad4': '4',
                'numpad5': '5',
                'numpad6': '6',
                'numpad7': '7',
                'numpad8': '8',
                'numpad9': '9',
                'divide': '/',
                'multiply': '*',
                'subtract': '-',
                'add': '+',
                'decimal': '.'
            };
            key = keyMap[key] || key;
            sendInput('key_down', {key});
        });

        document.addEventListener('keyup', (e) => {
            if (!remoteActive) return;
            e.preventDefault();  // Disable browser shortcuts
            let key = e.key.toLowerCase();
            // Use the same keyMap for up events
            const keyMap = {
                'arrowleft': 'left',
                'arrowright': 'right',
                'arrowup': 'up',
                'arrowdown': 'down',
                'enter': 'enter',
                'escape': 'esc',
                'backspace': 'backspace',
                'delete': 'delete',
                'tab': 'tab',
                'capslock': 'capslock',
                'shiftleft': 'shift',
                'shiftright': 'shift',
                'controlleft': 'ctrl',
                'controlright': 'ctrl',
                'altleft': 'alt',
                'altright': 'alt',
                'metaleft': 'win',
                'metaright': 'win',
                'contextmenu': 'apps',
                'f1': 'f1',
                'f2': 'f2',
                'f3': 'f3',
                'f4': 'f4',
                'f5': 'f5',
                'f6': 'f6',
                'f7': 'f7',
                'f8': 'f8',
                'f9': 'f9',
                'f10': 'f10',
                'f11': 'f11',
                'f12': 'f12',
                'insert': 'insert',
                'home': 'home',
                'end': 'end',
                'pageup': 'pageup',
                'pagedown': 'pagedown',
                'numlock': 'numlock',
                'numpad0': '0',
                'numpad1': '1',
                'numpad2': '2',
                'numpad3': '3',
                'numpad4': '4',
                'numpad5': '5',
                'numpad6': '6',
                'numpad7': '7',
                'numpad8': '8',
                'numpad9': '9',
                'divide': '/',
                'multiply': '*',
                'subtract': '-',
                'add': '+',
                'decimal': '.'
            };
            key = keyMap[key] || key;
            sendInput('key_up', {key});
        });

        // Audio: connect directly to /mic_audio or /desktop_audio
        document.getElementById('micBtn').onclick = (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.innerText = "CONNECTING...";
            const wsUrl = `ws://${window.location.host}/mic_audio`;
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            ws.onopen = () => {
                btn.innerText = "MIC LIVE";
                btn.classList.add('active');
                btn.disabled = false;
            };
            ws.onmessage = (e) => {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: RATE});
                const int16 = new Int16Array(e.data);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
                const buffer = audioCtx.createBuffer(CHANNELS, float32.length/CHANNELS, RATE);
                for (let c = 0; c < CHANNELS; c++) {
                    const d = buffer.getChannelData(c);
                    for (let i = 0; i < buffer.length; i++) d[i] = float32[i*CHANNELS + c];
                }
                const src = audioCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(audioCtx.destination);
                const start = Math.max(audioCtx.currentTime, nextStartTime);
                src.start(start);
                nextStartTime = start + buffer.duration;
            };
            ws.onclose = () => {
                btn.innerText = "MICROPHONE AUDIO";
                btn.classList.remove('active');
            };
        };

        document.getElementById('desktopBtn').onclick = (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.innerText = "CONNECTING...";
            const wsUrl = `ws://${window.location.host}/desktop_audio`;
            const ws = new WebSocket(wsUrl);
            ws.binaryType = 'arraybuffer';
            ws.onopen = () => {
                btn.innerText = "DESKTOP LIVE";
                btn.classList.add('active');
                btn.disabled = false;
            };
            ws.onmessage = (e) => {
                if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)({sampleRate: RATE});
                const int16 = new Int16Array(e.data);
                const float32 = new Float32Array(int16.length);
                for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
                const buffer = audioCtx.createBuffer(CHANNELS, float32.length/CHANNELS, RATE);
                for (let c = 0; c < CHANNELS; c++) {
                    const d = buffer.getChannelData(c);
                    for (let i = 0; i < buffer.length; i++) d[i] = float32[i*CHANNELS + c];
                }
                const src = audioCtx.createBufferSource();
                src.buffer = buffer;
                src.connect(audioCtx.destination);
                const start = Math.max(audioCtx.currentTime, nextStartTime);
                src.start(start);
                nextStartTime = start + buffer.duration;
            };
            ws.onclose = () => {
                btn.innerText = "DESKTOP AUDIO";
                btn.classList.remove('active');
            };
        };

        // FPS & resolution
        let frameCount = 0, lastTime = performance.now();
        resSlider.oninput = (e) => {
            const scale = parseInt(e.target.value) / 100;
            document.getElementById('resVal').innerText = e.target.value + "%";
            fetch('/config', {
                method: 'POST',
                body: JSON.stringify({scale}),
                headers: {'Content-Type':'application/json'}
            });
        };

        function monitorFrames() {
            frameCount++;
            requestAnimationFrame(monitorFrames);
        }
        monitorFrames();

        setInterval(() => {
            const now = performance.now();
            const fps = (frameCount / ((now - lastTime)/1000)).toFixed(1);
            document.getElementById('realFps').innerText = fps;
            frameCount = 0; lastTime = now;
        }, 1000);

        async function init() {
            await start();
            await loadMonitors();
        }
        init();
    </script>
</body>
</html>"""
        return web.Response(content_type="text/html", text=content)

    async def get_monitors(self, request):
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
        return web.json_response(data)

    async def set_monitor_and_recreate(self, monitor_id):
        print(f"[Monitor Switch] Changing to output_idx {monitor_id}")
        # Destroy old
        if self.track:
            self.track.stop()
            del self.track
            self.track = None

        if self.camera:
            try:
                self.camera.stop()
            except:
                pass
            del self.camera
            self.camera = None
            await asyncio.sleep(0.5)

        # Create new with output_idx
        self.camera = bettercam.create(output_idx=monitor_id, output_color="BGR")
        self.camera.start(target_fps=0)
        self.track = UncappedStreamTrack(self.camera, monitor_id)
        self.current_monitor_idx = monitor_id

        print(f"[Monitor Switch] Successfully switched to output_idx {monitor_id}")

    async def offer(self, request):
        params = await request.json()
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

        monitor_id = params.get("monitor_id")
        if monitor_id is not None:
            await self.set_monitor_and_recreate(int(monitor_id))

        pc = RTCPeerConnection()
        self.pcs.add(pc)

        if self.camera is None:
            self.camera = bettercam.create(output_idx=self.current_monitor_idx, output_color="BGR")
            self.camera.start(target_fps=0)

        if self.track is None:
            self.track = UncappedStreamTrack(self.camera, self.current_monitor_idx)

        pc.addTrack(self.track)
        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        return web.json_response({"sdp": pc.localDescription.sdp, "type": pc.localDescription.type})

    async def set_monitor_region(self, request):
        data = await request.json()
        monitor_id = data.get('monitor_id')
        monitors = get_monitors()
        if 0 <= monitor_id < len(monitors):
            mon = monitors[monitor_id]
            region = (mon.x, mon.y, mon.width, mon.height)
            self.set_monitor_region(region)  # call our own method
            return web.json_response({"status": "ok"})
        return web.json_response({"status": "error", "message": "Invalid monitor"}, status=400)

    async def update_config(self, request):
        data = await request.json()
        scale = data.get('scale', 1.0)
        if self.track:
            self.track.set_scale(scale)
        return web.json_response({"status": "ok"})

    async def set_cursor(self, request):
        data = await request.json()
        show = data.get('show', True)
        if self.track:
            self.track.set_show_cursor(show)
        return web.json_response({"status": "ok"})

    # ------------------------------------------------------------------
    # Server start / stop
    # ------------------------------------------------------------------
    async def start(self):
        self.running = True
        self.loop = asyncio.get_running_loop()

        # Start audio capture threads
        self.mic_running = True
        threading.Thread(target=self.mic_capture_loop, daemon=True).start()
        self.desktop_running = True
        threading.Thread(target=self.desktop_capture_loop, daemon=True).start()

        # Initialize default camera and track (monitor 0)
        self.camera = bettercam.create(output_idx=0, output_color="BGR")
        self.camera.start(target_fps=0)
        self.track = UncappedStreamTrack(self.camera, 0)

        # Set up aiohttp application
        app = web.Application()
        app.router.add_get("/", self.index)
        app.router.add_get("/monitors", self.get_monitors)
        app.router.add_post("/offer", self.offer)
        app.router.add_post("/set_monitor_region", self.set_monitor_region)
        app.router.add_post("/config", self.update_config)
        app.router.add_post("/set_cursor", self.set_cursor)

        # WebSocket endpoints
        app.router.add_get("/control", self.control_handler)
        app.router.add_get("/mic_audio", self.mic_audio_handler)
        app.router.add_get("/desktop_audio", self.desktop_audio_handler)

        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", self.port)
        await site.start()
        print(f"Server running on http://localhost:{self.port}")

        # Keep running
        try:
            await asyncio.Event().wait()
        finally:
            await runner.cleanup()
            # Clean up resources
            self.running = False
            self.mic_running = False
            self.desktop_running = False
            if self.track:
                self.track.stop()
            if self.camera:
                self.camera.stop()
            self.mic_p.terminate()
            self.desktop_p.terminate()
            # Close all peer connections
            for pc in self.pcs:
                await pc.close()

# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------
async def main():
    import sys
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except:
            pass
    server = UnifiedRemoteDesktopServer(port=port)
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())