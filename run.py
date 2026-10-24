"""
VoxPilot AI - One-Click Launcher
Starts the backend server and automatically opens the futuristic Web UI.
"""

import os
import sys
import time
import webbrowser
import threading
from pathlib import Path

# Add backend directory to path
project_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(project_dir / "backend"))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from server import run_server, PORT

def open_browser():
    time.sleep(1.2)
    url = f"http://127.0.0.1:{PORT}"
    print(f"\n[VOXPILOT] Launching VoxPilot AI UI in browser: {url}")
    sys.stdout.flush()
    webbrowser.open(url)

if __name__ == "__main__":
    print("\n" + "="*65)
    print("      VOXPILOT AI - HYBRID MULTILINGUAL VOICE AGENT")
    print("="*65)
    print(" * Languages Supported: Hindi, Indian English, Hinglish")
    print(" * Multi-Platform Tasks:")
    print("   - YouTube: 'open youtube and play chikni chameli'")
    print("   - Gmail:   'open gmail and compose email to boss'")
    print("   - WhatsApp:'open whatsapp web'")
    print("   - Search:  'google pe mausam kaisa hai search karo'")
    print("   - Desktop: 'calculator kholo' / 'open notepad'")
    print("="*65 + "\n")
    sys.stdout.flush()

    # Start browser opener in background thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run HTTP Server
    run_server(PORT)
