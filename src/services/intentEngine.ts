import { IntentResult } from '../types';

export class IntentEngine {
  private playVerbs = [
    'play', 'baja', 'bajao', 'chala', 'chalao', 'sunao', 'laga', 'lagao', 'start',
    'बजाओ', 'चलाओ', 'सुनाओ', 'लगाओ'
  ];

  private openVerbs = [
    'open', 'khol', 'kholo', 'launch', 'start', 'chalu', 'chalu karo', 'dikhao', 'dekhna',
    'खोलो', 'खोल', 'चालू करो', 'दिखाओ'
  ];

  public parseIntent(userText: string): IntentResult {
    const rawText = userText.trim();
    const lowerText = rawText.toLowerCase();

    // Clean common Hindi filler words
    const cleanText = lowerText
      .replace(/^(bhai|are yaar|hey vox|vox|alexa|siri|jarvis|sun|suno|kripya|please)\s+/i, '')
      .trim();

    // 1. YOUTUBE COMMANDS
    if (
      cleanText.includes('youtube') ||
      cleanText.includes('yt') ||
      ['chalao', 'bajao', 'sunao', 'play'].some((v) => cleanText.includes(v))
    ) {
      const isYouTubeSpecific = cleanText.includes('youtube') || cleanText.split(/\s+/).includes('yt');

      let query = cleanText;
      // Strip platform keywords
      query = query.replace(/\b(on\s+youtube|youtube\s+pe|youtube\s+par|youtube\s+me|youtube)\b/gi, '');

      // Strip verbs
      for (const verb of [...this.playVerbs, ...this.openVerbs]) {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        query = query.replace(regex, '');
      }

      // Strip prepositions & fillers
      query = query.replace(/\b(and|aur|ke|ka|ki|gaane|song|video|music|chahiye|pls|please|karo)\b/gi, '');
      query = query.replace(/\s+/g, ' ').trim();

      if (!query && isYouTubeSpecific) {
        return {
          action: 'open_youtube',
          platform: 'youtube',
          parameters: { query: '' },
          response_text: 'YouTube khol raha hoon...',
          raw_command: rawText,
        };
      } else if (query) {
        return {
          action: 'play_youtube',
          platform: 'youtube',
          parameters: { query },
          response_text: `YouTube par '${query}' chala raha hoon! Maza lijiye...`,
          raw_command: rawText,
        };
      }
    }

    // 2. GMAIL / EMAIL COMMANDS
    if (['gmail', 'email', 'mail', 'inbox'].some((w) => cleanText.includes(w))) {
      const isCompose = ['compose', 'send', 'bhejo', 'likho', 'draft', 'new mail', 'naya mail'].some((w) =>
        cleanText.includes(w)
      );

      const toMatch = cleanText.match(/\b(to|ko)\s+([a-zA-Z0-9._%+-]+(?:@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})?|[a-zA-Z]+)/i);
      const subjectMatch = cleanText.match(/\b(about|subject|vishay|topic|regarding)\s+([^.]+)/i);

      const recipient = toMatch ? toMatch[2] : '';
      const subject = subjectMatch ? subjectMatch[2].trim() : '';

      if (isCompose || recipient || subject) {
        return {
          action: 'compose_gmail',
          platform: 'gmail',
          parameters: { to: recipient, subject, body: '' },
          response_text: `Gmail compose khol raha hoon${recipient ? ` ${recipient} ke liye...` : '...'}`,
          raw_command: rawText,
        };
      } else {
        return {
          action: 'open_gmail',
          platform: 'gmail',
          parameters: {},
          response_text: 'Gmail inbox khol raha hoon...',
          raw_command: rawText,
        };
      }
    }

    // 3. WHATSAPP WEB
    if (['whatsapp', 'whats app', 'wa'].some((w) => cleanText.includes(w))) {
      const phoneMatch = cleanText.match(/\b(\d{10,12})\b/);
      const phone = phoneMatch ? phoneMatch[1] : '';
      const msgMatch = cleanText.match(/\b(message|msg|bolna|kaho)\s+([^.]+)/i);
      const message = msgMatch ? msgMatch[2].trim() : '';

      return {
        action: 'open_whatsapp',
        platform: 'whatsapp',
        parameters: { phone, message },
        response_text: 'WhatsApp Web open kar raha hoon...',
        raw_command: rawText,
      };
    }

    // 4. GOOGLE SEARCH & KNOWLEDGE
    if (['google', 'search', 'dhoondo', 'dhoondho', 'khojo', 'kaisa hai', 'weather', 'mausam'].some((w) => cleanText.includes(w))) {
      let query = cleanText;
      query = query.replace(/\b(on\s+google|google\s+pe|google\s+par|google|search|dhoondho|dhoondo|khojo|batao|karo)\b/gi, '');
      query = query.replace(/\s+/g, ' ').trim();

      return {
        action: 'google_search',
        platform: 'google',
        parameters: { query: query || 'Latest News' },
        response_text: `Google par '${query || 'Latest News'}' search kar raha hoon...`,
        raw_command: rawText,
      };
    }

    // 5. GOOGLE MAPS
    if (['map', 'maps', 'rasta', 'direction', 'location'].some((w) => cleanText.includes(w))) {
      const query = cleanText.replace(/\b(map|maps|kahan hai|rasta|location|dikhao)\b/gi, '').trim();
      return {
        action: 'open_maps',
        platform: 'google_maps',
        parameters: { location: query },
        response_text: `Google Maps par '${query}' search kar raha hoon...`,
        raw_command: rawText,
      };
    }

    // 6. SYSTEM DESKTOP APPS
    const appMap: Record<string, string[]> = {
      calculator: ['calculator', 'calc', 'hisaab'],
      notepad: ['notepad', 'text editor', 'likhne wala'],
      explorer: ['file manager', 'explorer', 'my computer', 'files', 'folder'],
      cmd: ['terminal', 'command prompt', 'cmd', 'powershell'],
      chrome: ['chrome', 'google chrome'],
      edge: ['edge', 'microsoft edge'],
      settings: ['settings', 'control panel', 'setting'],
    };

    for (const [appId, triggers] of Object.entries(appMap)) {
      if (triggers.some((t) => cleanText.includes(t))) {
        return {
          action: 'launch_app',
          platform: 'desktop',
          parameters: { app: appId },
          response_text: `Aapke PC par ${appId.charAt(0).toUpperCase() + appId.slice(1)} open kar raha hoon...`,
          raw_command: rawText,
        };
      }
    }

    // 7. SPOTIFY / MUSIC
    if (cleanText.includes('spotify')) {
      const query = cleanText.replace(/\b(on\s+spotify|spotify\s+pe|spotify|play|chalao|bajao)\b/gi, '').trim();
      return {
        action: 'open_spotify',
        platform: 'spotify',
        parameters: { query },
        response_text: `Spotify par '${query}' play kar raha hoon...`,
        raw_command: rawText,
      };
    }

    // 8. DEFAULT FALLBACK -> GOOGLE SEARCH
    return {
      action: 'google_search',
      platform: 'google',
      parameters: { query: cleanText },
      response_text: `Aapke sawaal '${cleanText}' ke liye search kar raha hoon...`,
      raw_command: rawText,
    };
  }
}

export const defaultIntentEngine = new IntentEngine();
