"""
VoxPilot AI - Backend Server
Lightweight, zero-dependency, ultra-fast Python Threading HTTP server
with REST API for Hinglish/Hindi/English voice commands, Ollama integration,
and cross-platform automation.
"""

import os
import sys
import json
import urllib.parse
import urllib.request
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

# Add current directory to path
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

# Configure UTF-8 for Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from intent_engine import IntentEngine
from automation import AutomationController

PORT = 8000
PUBLIC_DIR = current_dir.parent / "public"

intent_engine = IntentEngine()
automation_controller = AutomationController()

class VoxPilotHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def end_headers(self):
        # Enable CORS for cross-origin or local development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(HTTPStatus.OK)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # API Health & Status Endpoint
        if parsed_url.path == "/api/status":
            ollama_active = False
            try:
                req = urllib.request.Request(f"{intent_engine.ollama_url}/api/tags", headers={"User-Agent": "VoxPilot"})
                with urllib.request.urlopen(req, timeout=1) as resp:
                    if resp.status == 200:
                        ollama_active = True
            except Exception:
                ollama_active = False

            status_payload = {
                "status": "online",
                "version": "1.0.0",
                "engine": "VoxPilot Hybrid NLP Engine",
                "ollama_connected": ollama_active,
                "supported_platforms": ["youtube", "gmail", "whatsapp", "google", "maps", "spotify", "desktop"],
                "languages": ["hi-IN", "en-IN", "hinglish"]
            }
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(status_payload).encode('utf-8'))
            return

        # Fallback to serving static public files (index.html, etc.)
        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        
        # API Command Execution Endpoint
        if parsed_url.path == "/api/command":
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            
            try:
                data = json.loads(body_bytes.decode('utf-8'))
            except Exception:
                data = {}

            command_text = data.get("text", "").strip()
            use_ollama = data.get("use_ollama", False)
            
            if not command_text:
                self.send_response(HTTPStatus.BAD_REQUEST)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Empty command text"}).encode('utf-8'))
                return

            print(f"\n[VoxPilot Voice] Received: '{command_text}'")

            # 1. Intent Classification
            intent = None
            if use_ollama:
                intent = intent_engine.try_ollama_intent(command_text)
            
            # Fallback to our high-accuracy built-in Hinglish NLP parser
            if not intent:
                intent = intent_engine.parse_intent(command_text)

            print(f"[VoxPilot NLP] Action: {intent.get('action')} | Platform: {intent.get('platform')}")

            # 2. Automation Execution
            action = intent.get("action", "")
            platform = intent.get("platform", "")
            params = intent.get("parameters", {})
            
            exec_result = automation_controller.execute(action, platform, params)

            response_data = {
                "success": exec_result.get("success", True),
                "raw_command": command_text,
                "intent": intent,
                "automation": exec_result,
                "voice_response": intent.get("response_text", "Kaam ho gaya!")
            }

            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            return

        # Unknown endpoint
        self.send_response(HTTPStatus.NOT_FOUND)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server(port=PORT):
    server_address = ('127.0.0.1', port)
    httpd = ThreadingHTTPServer(server_address, VoxPilotHandler)
    print("=" * 60)
    print(f"[VOXPILOT] Backend Server running at: http://127.0.0.1:{port}")
    print(f"[VOXPILOT] Serving UI from: {PUBLIC_DIR}")
    print("[VOXPILOT] Ready for Hindi, English & Hinglish Voice Commands!")
    print("=" * 60)
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
