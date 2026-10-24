# 🤖 VoxPilot AI - Autonomous Multilingual Voice & Automation Platform

> A next-generation, high-performance **Continuous Voice Automation Platform** designed to understand **Hindi, English, and Hinglish** commands and execute real-world tasks across multiple platforms (YouTube, Spotify, Gmail, WhatsApp Web, Google Search, and Desktop Tools).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-6.1.0-646cff.svg)

---

## 🌟 Key Features

1. **Continuous Voice Pipeline (Command After Command)**
   - Listens continuously without stopping after a single command.
   - Execute task 1 ➔ Task runs ➔ Mic automatically stays active for task 2 ➔ Task runs ➔ Never interrupts your workflow.

2. **Animated AI Robot Companion**
   - Interactive, floating 2D Canvas companion with realistic hover physics.
   - Expressive LED Visor Eyes with natural blinking and real-time audio spectrum mouth waves.
   - Dynamic reactive states: *Idle, Listening, Processing, Executing*.

3. **Direct Media Playback Engine (YouTube & Spotify)**
   - **YouTube Direct Watch Autoplay**: Bypasses search result pages; opens direct `/watch?v={videoId}&autoplay=1` video streams with instant buffering.
   - **In-Page Floating Video Dock**: Watch the video directly on the web app with autoplay!
   - **Integrated Spotify Web Player**: Embeds Spotify track players with instant play actions.

4. **Multi-Platform Automation Controller**
   - **Gmail**: Directly opens Gmail compose drafts with recipient and subject pre-filled.
   - **WhatsApp Web**: Opens WhatsApp chats with pre-filled text or recipient phone numbers.
   - **Desktop System Tools**: Native launcher integration for Calculator, Notepad, File Explorer, Terminal.
   - **Google Knowledge & Maps**: Direct localized map navigation and search queries.

5. **Sleek Minimalist Nature & AI UI**
   - Serene emerald twilight ambiance (zero harsh neon).
   - Google / Perplexity-style floating omnibar with dual Voice & Text input.

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Usage & Purpose |
|---|---|---|
| **Core Framework** | **React 18.3.1** | Component lifecycle, responsive state hooks, UI orchestration |
| **Language & Typings** | **TypeScript 5.7.3** | Strict type safety, clean data contracts, compile-time validation |
| **Build Tool & Bundler** | **Vite 6.1.0** | Ultra-fast HMR (Hot Module Replacement) and optimized production rollup |
| **Speech Recognition (STT)** | **Web Speech API (`SpeechRecognition`)** | Real-time multilingual voice transcription supporting `en-IN` & `hi-IN` phonetics |
| **Speech Synthesis (TTS)** | **SpeechSynthesis API (`SpeechSynthesisUtterance`)** | Natural voice confirmation responses with seamless listening loop resumption |
| **Audio Processing** | **Web Audio API (`AudioContext`, `AnalyserNode`)** | Real-time Fast Fourier Transform (FFT) frequency spectrum extraction from microphone |
| **Computer Graphics** | **HTML5 2D Canvas API** | Procedural vector rendering of the AI Bot chassis, visor reflection, and expressive LED animations |
| **Styling & Design System** | **Vanilla CSS3** | Custom design tokens, glassmorphism filters, responsive layouts, micro-animations |
| **Typography** | **Google Fonts (`Inter`, `Plus Jakarta Sans`)** | Modern executive SaaS typography |
| **Media APIs** | **YouTube IFrame API & Spotify Embed API** | Direct in-page media playback widgets and external deep-linking |
| **Icons & Assets** | **Custom Vector SVG & Lucide Icons** | Pixel-perfect vector graphics without external asset lag |

---

## 🎙️ Natural Voice & Text Commands

| Platform | Command Examples | Action Performed |
|---|---|---|
| **YouTube** | `"video open kro"` / `"play chikni chameli"` | Directly opens video watch stream & docks in-page player |
| **Spotify** | `"spotify pe chaleya play kr"` / `"play kesariya on spotify"` | Opens Spotify track & renders interactive Spotify player |
| **Gmail** | `"open gmail"` / `"gmail pe email compose karo to rohit"` | Opens pre-filled Gmail draft |
| **WhatsApp** | `"open whatsapp web"` | Launches WhatsApp Web |
| **Desktop** | `"open calculator"` / `"calculator kholo"` | Launches desktop calculator |
| **Search** | `"search latest AI news on google"` | Dispatches Google knowledge search |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / pnpm / yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/rajat414-codex/voxpilot-ai.git

# Navigate to project folder
cd voxpilot-ai

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will be live at `http://localhost:3000/`.

---

## 📄 License
MIT License &copy; 2026 Rajat Kamal. All rights reserved.
