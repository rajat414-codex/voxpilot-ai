# 🚀 VoxPilot AI - Autonomous Multilingual Voice Agent

A Hybrid Voice Automation Agent designed to understand **Hindi, English, and Hinglish** commands and execute real-world tasks across multiple platforms (YouTube, Gmail, WhatsApp Web, Google Search, and native Windows desktop apps).

---

## 🌟 Key Capabilities

- **Hindi + English + Hinglish Voice Recognition**: Natural phonetics and accent processing (e.g., *"bhai youtube pe chikni chameli chalao"*).
- **Deep YouTube Automation**: Resolves the exact top video ID and autoplays the song directly in your browser.
- **Gmail Automation**: Opens direct drafts with pre-filled recipient and subject.
- **Native Windows Desktop Control**: Launches desktop applications like Calculator, Notepad, File Explorer, Terminal.
- **Local & Open-Source First**:
  - Built-in High-Accuracy Hinglish Natural Language Processing (zero API keys or heavy GPU required).
  - Ready for local **Ollama** models (`llama3`, `mistral`, `phi3`) if installed.
- **Futuristic Cyber-Glassmorphism UI**:
  - Live audio-reactive quantum orb visualizer with Web Audio API.
  - Real-time speech transcription badge.
  - Interactive Action Console logging intent extraction and browser dispatch.

---

## 🎙️ Example Voice Commands

| Category | Hinglish / Hindi Command | English Command | What it does |
|---|---|---|---|
| **YouTube** | *"YouTube pe chikni chameli chalao"* | *"Open YouTube and play Chikni Chameli"* | Finds and autoplays "Chikni Chameli" on YouTube |
| **YouTube** | *"Arijit Singh ke gaane sunao"* | *"Play Arijit Singh songs on YouTube"* | Plays Arijit Singh hits on YouTube |
| **Gmail** | *"Gmail kholo aur Rohit ko email bhejo"* | *"Open Gmail and compose email to Rohit"* | Opens Gmail compose window with draft ready |
| **WhatsApp** | *"WhatsApp Web open karo"* | *"Open WhatsApp Web"* | Opens WhatsApp Web |
| **Desktop** | *"Calculator kholo"* | *"Open Calculator"* | Launches Windows Calculator |
| **Desktop** | *"Notepad kholo"* | *"Open Notepad"* | Launches Notepad |
| **Google** | *"Google pe weather search karo"* | *"Search weather on Google"* | Searches weather on Google |

---

## 🚀 How to Run

Run the one-click launcher from PowerShell / Command Prompt:

```powershell
python "C:\Users\RAJAT KAMAL\.gemini\antigravity-ide\scratch\voxpilot-voice-agent\run.py"
```

This will automatically:
1. Start the VoxPilot backend API server at `http://localhost:8000`
2. Open the futuristic web dashboard in your default browser.

---

## 📁 Project Structure

```
voxpilot-voice-agent/
├── backend/
│   ├── intent_engine.py       # Multilingual NLP parser (Hindi, Hinglish, English) + Ollama support
│   ├── automation.py          # Platform automations (YouTube autoplay, Gmail, WhatsApp, Desktop)
│   └── server.py              # Zero-dependency Threading HTTP & REST API server
├── public/
│   ├── css/
│   │   └── style.css          # Futuristic cyber-glassmorphism theme & animations
│   ├── js/
│   │   ├── visualizer.js      # Web Audio API reactive canvas visualizer
│   │   ├── speech.js          # Speech-to-Text & Text-to-Speech engine
│   │   └── app.js             # Client coordinator & live terminal logs
│   └── index.html             # Main dashboard UI
├── run.py                     # One-click launcher
└── README.md
```
