"""
VoxPilot AI - Multi-Platform Automation Controller
Automates YouTube playback, Gmail compose/read, Google search, WhatsApp Web,
and native Windows desktop applications.
"""

import os
import re
import sys
import subprocess
import webbrowser
import urllib.parse
import urllib.request
from typing import Dict, Any, Tuple

class AutomationController:
    def __init__(self):
        pass

    def get_first_youtube_video_id(self, query: str) -> OptionalStr:
        """
        Scrapes the top YouTube video ID for instant direct playback with autoplay.
        """
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            encoded_query = urllib.parse.quote_plus(query)
            url = f"https://www.youtube.com/results?search_query={encoded_query}"
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=4) as response:
                html = response.read().decode('utf-8', errors='ignore')
                # Find the first video ID pattern
                matches = re.findall(r'"videoId":"([a-zA-Z0-9_-]{11})"', html)
                if matches:
                    # Return the first match (avoid channel or playlist IDs if possible)
                    for vid in matches:
                        if len(vid) == 11:
                            return vid
        except Exception as e:
            print(f"[Automation] YouTube video ID fetch error: {e}")
        return None

    def execute(self, action: str, platform: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the requested automated action.
        """
        result = {
            "success": True,
            "action": action,
            "platform": platform,
            "url_opened": None,
            "message": ""
        }

        try:
            # 1. YOUTUBE AUTOMATION
            if action == "play_youtube":
                query = parameters.get("query", "").strip()
                if not query:
                    webbrowser.open("https://www.youtube.com")
                    result["url_opened"] = "https://www.youtube.com"
                    result["message"] = "YouTube opened."
                    return result

                # Try finding top video for instant autoplay
                video_id = self.get_first_youtube_video_id(query)
                if video_id:
                    target_url = f"https://www.youtube.com/watch?v={video_id}&autoplay=1"
                    result["message"] = f"Playing '{query}' directly on YouTube (Video ID: {video_id})"
                else:
                    target_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote_plus(query)}"
                    result["message"] = f"Searching and playing '{query}' on YouTube"

                webbrowser.open(target_url)
                result["url_opened"] = target_url
                return result

            elif action == "open_youtube":
                target_url = "https://www.youtube.com"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = "YouTube opened in your default browser."
                return result

            # 2. GMAIL AUTOMATION
            elif action == "compose_gmail":
                to_addr = urllib.parse.quote_plus(parameters.get("to", ""))
                su = urllib.parse.quote_plus(parameters.get("subject", ""))
                body = urllib.parse.quote_plus(parameters.get("body", "Sent via VoxPilot Voice AI."))
                
                # Direct Gmail compose URL
                target_url = f"https://mail.google.com/mail/u/0/?fs=1&tf=cm&to={to_addr}&su={su}&body={body}"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = f"Opened Gmail draft with pre-filled recipient and subject."
                return result

            elif action == "open_gmail":
                target_url = "https://mail.google.com/mail/u/0/#inbox"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = "Opened Gmail Inbox."
                return result

            # 3. WHATSAPP WEB AUTOMATION
            elif action == "open_whatsapp":
                phone = parameters.get("phone", "").strip()
                msg = urllib.parse.quote_plus(parameters.get("message", ""))
                if phone:
                    target_url = f"https://web.whatsapp.com/send?phone={phone}&text={msg}"
                else:
                    target_url = "https://web.whatsapp.com"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = "Opened WhatsApp Web."
                return result

            # 4. GOOGLE SEARCH & MAPS
            elif action == "google_search":
                query = parameters.get("query", "")
                target_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(query)}"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = f"Searched Google for '{query}'"
                return result

            elif action == "open_maps":
                loc = parameters.get("location", "")
                target_url = f"https://www.google.com/maps/search/{urllib.parse.quote_plus(loc)}"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = f"Opened Google Maps for '{loc}'"
                return result

            # 5. SPOTIFY
            elif action == "open_spotify":
                query = parameters.get("query", "")
                if query:
                    target_url = f"https://open.spotify.com/search/{urllib.parse.quote_plus(query)}"
                else:
                    target_url = "https://open.spotify.com"
                webbrowser.open(target_url)
                result["url_opened"] = target_url
                result["message"] = f"Opened Spotify for '{query}'"
                return result

            # 6. SYSTEM APP LAUNCHER
            elif action == "launch_app":
                app_name = parameters.get("app", "calculator").lower()
                cmd_map = {
                    "calculator": "calc.exe",
                    "notepad": "notepad.exe",
                    "explorer": "explorer.exe",
                    "cmd": "start cmd.exe",
                    "chrome": "start chrome",
                    "edge": "start msedge",
                    "settings": "start ms-settings:"
                }
                cmd = cmd_map.get(app_name, f"start {app_name}")
                if sys.platform == "win32":
                    subprocess.Popen(cmd, shell=True)
                else:
                    subprocess.Popen([cmd], shell=True)
                result["message"] = f"Launched native desktop app: {app_name}"
                return result

            else:
                result["success"] = False
                result["message"] = f"Unknown action: {action}"
                return result

        except Exception as e:
            result["success"] = False
            result["error"] = str(e)
            result["message"] = f"Automation error: {str(e)}"
            return result

OptionalStr = Any
