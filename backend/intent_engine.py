"""
VoxPilot AI - Multilingual Hinglish/English/Hindi Voice Intent Engine
Supports local Ollama LLMs and includes an advanced built-in rule-based NLP parser
for instant zero-latency recognition of voice commands.
"""

import re
import json
import urllib.parse
import urllib.request
from typing import Dict, Any, Optional

class IntentEngine:
    def __init__(self, ollama_url: str = "http://127.0.0.1:11434", ollama_model: str = "llama3"):
        self.ollama_url = ollama_url
        self.ollama_model = ollama_model
        
        # Multilingual keyword mappings (English, Hindi transliterated/Hinglish, Devanagari)
        self.play_verbs = [
            "play", "baja", "bajao", "chala", "chalao", "sunao", "laga", "lagao", "start",
            "बजाओ", "चलाओ", "सुनाओ", "लगाओ"
        ]
        self.open_verbs = [
            "open", "khol", "kholo", "launch", "start", "chalu", "chalu karo", "dikhao", "dekhna",
            "खोलो", "खोल", "चालू करो", "दिखाओ"
        ]
        self.search_verbs = [
            "search", "dhoondh", "dhoondho", "khoj", "khojo", "find", "pata karo", "batao", "google karo",
            "ढूंढो", "खोजो", "बताओ"
        ]
        self.send_verbs = [
            "send", "bhej", "bhejo", "compose", "likh", "likho", "mail karo", "email karo",
            "भेजो", "लिखो"
        ]

    def parse_intent(self, user_text: str) -> Dict[str, Any]:
        """
        Extract structured action and parameters from user voice command.
        Handles English, Hindi, and mixed Hinglish naturally.
        """
        raw_text = user_text.strip()
        lower_text = raw_text.lower()
        
        # Clean common Hindi filler words
        clean_text = re.sub(r'^(bhai|are yaar|hey vox|vox|alexa|siri|jarvis|sun|suno|kripya|please)\s+', '', lower_text).strip()
        
        # 1. YOUTUBE COMMANDS
        # Examples: "open youtube and play chikni chameli", "youtube pe arijit singh ke gaane chalao", "play believer on youtube"
        if "youtube" in clean_text or any(v in clean_text for v in ["chalao", "bajao", "sunao", "play"]):
            # Check if it's explicitly or implicitly YouTube
            is_youtube_specific = "youtube" in clean_text or "yt" in clean_text.split()
            
            # Extract query/song name
            query = clean_text
            
            # Strip platform keywords
            query = re.sub(r'\b(on\s+youtube|youtube\s+pe|youtube\s+par|youtube\s+me|youtube)\b', '', query, flags=re.IGNORECASE)
            
            # Strip verbs
            for verb in self.play_verbs + self.open_verbs:
                query = re.sub(rf'\b{verb}\b', '', query, flags=re.IGNORECASE)
            
            # Strip prepositions & fillers
            query = re.sub(r'\b(and|aur|ke|ka|ki|gaane|song|video|music|chahiye|pls|please|karo)\b', '', query, flags=re.IGNORECASE)
            query = re.sub(r'\s+', ' ', query).strip()
            
            if not query and is_youtube_specific:
                return {
                    "action": "open_youtube",
                    "platform": "youtube",
                    "parameters": {"query": ""},
                    "response_text": "YouTube khol raha hoon...",
                    "raw_command": raw_text
                }
            elif query:
                return {
                    "action": "play_youtube",
                    "platform": "youtube",
                    "parameters": {"query": query},
                    "response_text": f"YouTube par '{query}' chala raha hoon! Maza lijiye...",
                    "raw_command": raw_text
                }

        # 2. GMAIL / EMAIL COMMANDS
        # Examples: "open gmail", "gmail pe email compose karo", "send email to rajat about project"
        if any(w in clean_text for w in ["gmail", "email", "mail", "inbox"]):
            # Check if compose action is requested
            is_compose = any(w in clean_text for w in ["compose", "send", "bhejo", "likho", "draft", "new mail", "naya mail"])
            
            to_match = re.search(r'\b(to|ko)\s+([a-zA-Z0-9._%+-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?|[a-zA-Z]+)', clean_text)
            subject_match = re.search(r'\b(about|subject|vishay|topic|regarding)\s+([^.]+)', clean_text)
            
            recipient = to_match.group(2) if to_match else ""
            subject = subject_match.group(2).strip() if subject_match else ""
            
            if is_compose or recipient or subject:
                return {
                    "action": "compose_gmail",
                    "platform": "gmail",
                    "parameters": {"to": recipient, "subject": subject, "body": ""},
                    "response_text": f"Gmail compose khol raha hoon" + (f" {recipient} ke liye..." if recipient else "..."),
                    "raw_command": raw_text
                }
            else:
                return {
                    "action": "open_gmail",
                    "platform": "gmail",
                    "parameters": {},
                    "response_text": "Gmail inbox khol raha hoon...",
                    "raw_command": raw_text
                }

        # 3. WHATSAPP WEB
        if any(w in clean_text for w in ["whatsapp", "whats app", "wa"]):
            phone_match = re.search(r'\b(\d{10,12})\b', clean_text)
            phone = phone_match.group(1) if phone_match else ""
            msg_match = re.search(r'\b(message|msg|bolna|kaho)\s+([^.]+)', clean_text)
            message = msg_match.group(2).strip() if msg_match else ""
            
            return {
                "action": "open_whatsapp",
                "platform": "whatsapp",
                "parameters": {"phone": phone, "message": message},
                "response_text": "WhatsApp Web open kar raha hoon...",
                "raw_command": raw_text
            }

        # 4. GOOGLE SEARCH & KNOWLEDGE
        # Examples: "google search python tutorial", "search karo weather today", "what is photosynthesis"
        if any(w in clean_text for w in ["google", "search", "dhoondo", "khojo", "kaisa hai", "weather", "mausam"]):
            query = clean_text
            query = re.sub(r'\b(on\s+google|google\s+pe|google\s+par|google|search|dhoondho|khojo|batao|karo)\b', '', query, flags=re.IGNORECASE)
            query = re.sub(r'\s+', ' ', query).strip()
            
            return {
                "action": "google_search",
                "platform": "google",
                "parameters": {"query": query or "Latest News"},
                "response_text": f"Google par '{query}' search kar raha hoon...",
                "raw_command": raw_text
            }

        # 5. GOOGLE MAPS
        if any(w in clean_text for w in ["map", "maps", "rasta", "direction", "location"]):
            query = re.sub(r'\b(map|maps|kahan hai|rasta|location|dikhao)\b', '', clean_text).strip()
            return {
                "action": "open_maps",
                "platform": "google_maps",
                "parameters": {"location": query},
                "response_text": f"Google Maps par '{query}' search kar raha hoon...",
                "raw_command": raw_text
            }

        # 6. SYSTEM DESKTOP APPS
        # Examples: "open calculator", "calculator kholo", "notepad kholo", "open chrome"
        app_map = {
            "calculator": ["calculator", "calc", "hisaab"],
            "notepad": ["notepad", "text editor", "likhne wala"],
            "explorer": ["file manager", "explorer", "my computer", "files", "folder"],
            "cmd": ["terminal", "command prompt", "cmd", "powershell"],
            "chrome": ["chrome", "google chrome"],
            "edge": ["edge", "microsoft edge"],
            "settings": ["settings", "control panel", "setting"]
        }
        
        for app_id, triggers in app_map.items():
            if any(t in clean_text for t in triggers):
                return {
                    "action": "launch_app",
                    "platform": "desktop",
                    "parameters": {"app": app_id},
                    "response_text": f"Aapke PC par {app_id.capitalize()} open kar raha hoon...",
                    "raw_command": raw_text
                }

        # 7. SPOTIFY / MUSIC
        if "spotify" in clean_text:
            query = re.sub(r'\b(on\s+spotify|spotify\s+pe|spotify|play|chalao|bajao)\b', '', clean_text).strip()
            return {
                "action": "open_spotify",
                "platform": "spotify",
                "parameters": {"query": query},
                "response_text": f"Spotify par '{query}' play kar raha hoon...",
                "raw_command": raw_text
            }

        # 8. DEFAULT FALLBACK -> GOOGLE SEARCH
        return {
            "action": "google_search",
            "platform": "google",
            "parameters": {"query": clean_text},
            "response_text": f"Aapke sawaal '{clean_text}' ke liye search kar raha hoon...",
            "raw_command": raw_text
        }

    def try_ollama_intent(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Attempts to query Ollama local LLM for intent classification if available.
        """
        try:
            prompt = f"""
You are VoxPilot AI intent classifier. Analyze this voice command (Hindi/English/Hinglish):
"{text}"

Output strictly a single valid JSON object with fields:
{{
  "action": "play_youtube" | "open_youtube" | "compose_gmail" | "open_gmail" | "google_search" | "launch_app" | "open_whatsapp",
  "platform": "youtube" | "gmail" | "google" | "desktop" | "whatsapp",
  "parameters": {{"query": "...", "to": "...", "subject": "...", "app": "..."}},
  "response_text": "polite confirmation response in natural Hindi/Hinglish"
}}
JSON ONLY:
"""
            payload = json.dumps({
                "model": self.ollama_model,
                "prompt": prompt,
                "stream": False,
                "format": "json"
            }).encode('utf-8')
            
            req = urllib.request.Request(
                f"{self.ollama_url}/api/generate",
                data=payload,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                raw_response = result.get("response", "")
                parsed = json.loads(raw_response)
                parsed["raw_command"] = text
                return parsed
        except Exception:
            return None
