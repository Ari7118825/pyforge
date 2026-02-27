from fastapi import APIRouter
from fastapi.responses import HTMLResponse
import asyncio
import json
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer
from av import VideoFrame
import numpy as np
import mss
import time
from typing import Dict
import uuid

desktop_router = APIRouter(prefix="/api/desktop")

# Store active peer connections
pcs: Dict[str, RTCPeerConnection] = {}

class ScreenStreamTrack(VideoStreamTrack):
    """WebRTC video track that streams screen/window capture"""
    
    def __init__(self, monitor_index=0, fps=15):
        super().__init__()
        self.monitor_index = monitor_index
        self.fps = fps
        self.sct = mss.mss()
        self.frame_duration = 1.0 / fps
        self.last_frame_time = 0
        
    async def recv(self):
        """Capture and return video frame"""
        # Rate limiting
        current_time = time.time()
        wait_time = self.frame_duration - (current_time - self.last_frame_time)
        if wait_time > 0:
            await asyncio.sleep(wait_time)
        
        self.last_frame_time = time.time()
        
        # Capture screen
        monitor = self.sct.monitors[self.monitor_index]
        screenshot = self.sct.grab(monitor)
        
        # Convert to numpy array
        img = np.array(screenshot)
        
        # Convert BGRA to RGB
        img = img[:, :, :3]
        img = np.ascontiguousarray(img)
        
        # Create video frame
        frame = VideoFrame.from_ndarray(img, format='rgb24')
        frame.pts = int(self.last_frame_time * 1000000)
        frame.time_base = 1 / 1000000
        
        return frame

@desktop_router.post("/offer")
async def webrtc_offer(offer_data: dict):
    """Handle WebRTC offer from browser"""
    pc = RTCPeerConnection()
    pc_id = str(uuid.uuid4())
    pcs[pc_id] = pc
    
    # Get settings from offer
    monitor = offer_data.get("monitor", 1)  # 0 = all, 1+ = specific monitor
    fps = offer_data.get("fps", 15)
    
    # Add screen stream track
    screen_track = ScreenStreamTrack(monitor_index=monitor, fps=fps)
    pc.addTrack(screen_track)
    
    # Set remote description
    await pc.setRemoteDescription(RTCSessionDescription(
        sdp=offer_data["sdp"],
        type=offer_data["type"]
    ))
    
    # Create answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type,
        "pc_id": pc_id
    }

@desktop_router.get("/monitors")
async def get_monitors():
    """Get list of available monitors"""
    sct = mss.mss()
    monitors = []
    for i, monitor in enumerate(sct.monitors):
        monitors.append({
            "index": i,
            "width": monitor["width"],
            "height": monitor["height"],
            "left": monitor.get("left", 0),
            "top": monitor.get("top", 0),
            "name": f"Monitor {i}" if i > 0 else "All Monitors"
        })
    return {"monitors": monitors}

@desktop_router.post("/input/mouse")
async def handle_mouse_input(data: dict):
    """Handle mouse input from browser"""
    import pyautogui
    
    action = data.get("action")
    x = data.get("x")
    y = data.get("y")
    button = data.get("button", "left")
    
    if action == "move":
        pyautogui.moveTo(x, y)
    elif action == "click":
        pyautogui.click(x, y, button=button)
    elif action == "scroll":
        pyautogui.scroll(data.get("delta", 0), x=x, y=y)
    
    return {"status": "ok"}

@desktop_router.post("/input/keyboard")
async def handle_keyboard_input(data: dict):
    """Handle keyboard input from browser"""
    import pyautogui
    
    action = data.get("action")
    key = data.get("key")
    
    if action == "press":
        pyautogui.press(key)
    elif action == "type":
        pyautogui.write(data.get("text", ""))
    
    return {"status": "ok"}

@desktop_router.post("/close/{pc_id}")
async def close_connection(pc_id: str):
    """Close WebRTC connection"""
    if pc_id in pcs:
        await pcs[pc_id].close()
        del pcs[pc_id]
    return {"status": "closed"}
