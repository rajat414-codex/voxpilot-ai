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

    // Clean common conversational fillers
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
      query = query.replace(/\b(on\s+youtube|youtube\s+pe|youtube\s+par|youtube\s+me|youtube)\b/gi, '');

      for (const verb of [...this.playVerbs, ...this.openVerbs]) {
        const regex = new RegExp(`\\b${verb}\\b`, 'gi');
        query = query.replace(regex, '');
      }

      query = query.replace(/\b(and|aur|ke|ka|ki|gaane|song|video|music|chahiye|pls|please|karo)\b/gi, '');
      query = query.replace(/\s+/g, ' ').trim();

      if (!query && isYouTubeSpecific) {
        return {
          action: 'open_youtube',
          platform: 'youtube',
          parameters: { query: '' },
          response_text: 'Opening YouTube.',
          raw_command: rawText,
        };
      } else if (query) {
        return {
          action: 'play_youtube',
          platform: 'youtube',
          parameters: { query },
          response_text: `Playing ${query} on YouTube.`,
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
          response_text: `Opening Gmail draft${recipient ? ` for ${recipient}` : ''}.`,
          raw_command: rawText,
        };
      } else {
        return {
          action: 'open_gmail',
          platform: 'gmail',
          parameters: {},
          response_text: 'Opening Gmail inbox.',
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
        response_text: 'Opening WhatsApp Web.',
        raw_command: rawText,
      };
    }

    // 4. SPOTIFY
    if (cleanText.includes('spotify')) {
      let query = cleanText.replace(/\b(on\s+spotify|spotify\s+pe|spotify|play|chalao|bajao)\b/gi, '').trim();
      return {
        action: 'open_spotify',
        platform: 'spotify',
        parameters: { query },
        response_text: `Opening Spotify for ${query || 'music'}.`,
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
        response_text: `Opening Google Maps for ${query || 'location'}.`,
        raw_command: rawText,
      };
    }

    // 6. SYSTEM DESKTOP APPS
    const appMap: Record<string, string[]> = {
      calculator: ['calculator', 'calc', 'hisaab'],
      notepad: ['notepad', 'text editor', 'notes'],
      explorer: ['file manager', 'explorer', 'my computer', 'files', 'folder'],
      cmd: ['terminal', 'command prompt', 'cmd', 'powershell'],
      chrome: ['chrome', 'google chrome'],
      edge: ['edge', 'microsoft edge'],
      settings: ['settings', 'control panel'],
    };

    for (const [appId, triggers] of Object.entries(appMap)) {
      if (triggers.some((t) => cleanText.includes(t))) {
        return {
          action: 'launch_app',
          platform: 'desktop',
          parameters: { app: appId },
          response_text: `Launching ${appId.charAt(0).toUpperCase() + appId.slice(1)}.`,
          raw_command: rawText,
        };
      }
    }

    // 7. COMMON WEBSITES (GitHub, Twitter, Reddit, Netflix, etc.)
    const webServices: Record<string, string> = {
      github: 'https://github.com',
      twitter: 'https://twitter.com',
      x: 'https://x.com',
      reddit: 'https://reddit.com',
      netflix: 'https://netflix.com',
      amazon: 'https://amazon.com',
      linkedin: 'https://linkedin.com',
      instagram: 'https://instagram.com',
      chatgpt: 'https://chatgpt.com',
    };

    for (const [service, url] of Object.entries(webServices)) {
      if (cleanText.includes(service)) {
        return {
          action: 'open_url',
          platform: service,
          parameters: { query: url },
          response_text: `Opening ${service.charAt(0).toUpperCase() + service.slice(1)}.`,
          raw_command: rawText,
        };
      }
    }

    // 8. GOOGLE SEARCH / GENERAL QUERY FALLBACK
    let search = cleanText
      .replace(/\b(on\s+google|google\s+pe|google\s+par|google|search|dhoondho|dhoondo|khojo|batao|karo|what is|who is)\b/gi, '')
      .trim();

    return {
      action: 'google_search',
      platform: 'google',
      parameters: { query: search || cleanText },
      response_text: `Searching Google for ${search || cleanText}.`,
      raw_command: rawText,
    };
  }
}

export const defaultIntentEngine = new IntentEngine();
