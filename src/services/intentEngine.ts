import { IntentResult } from '../types';

export class IntentEngine {
  private playVerbs = [
    'play', 'baja', 'bajao', 'chala', 'chalao', 'sunao', 'laga', 'lagao', 'start',
    'baja do', 'chala do', 'laga do', 'sunao na', 'play kar', 'play kr', 'play karo',
    'बजाओ', 'चलाओ', 'सुनाओ', 'लगाओ'
  ];

  private openVerbs = [
    'open', 'khol', 'kholo', 'launch', 'start', 'chalu', 'chalu karo', 'dikhao', 'dekhna',
    'khol do', 'open karo', 'open kr', 'open kro',
    'खोलो', 'खोल', 'चालू करो', 'दिखाओ'
  ];

  private fillerWords = [
    'and', 'aur', 'ke', 'ka', 'ki', 'ko', 'me', 'mein', 'par', 'pe', 'pls', 'please',
    'karo', 'kr', 'kro', 'kariye', 'kar do', 'kar dena', 'bhi', 'to'
  ];

  public cleanExtractedQuery(text: string): string {
    let q = text.trim();
    // Strip quotes if present
    q = q.replace(/^["']|["']$/g, '').trim();

    // Strip trailing or leading fillers
    for (const filler of this.fillerWords) {
      const regexStart = new RegExp(`^\\b${filler}\\b\\s*`, 'gi');
      const regexEnd = new RegExp(`\\s*\\b${filler}\\b$`, 'gi');
      q = q.replace(regexStart, '').replace(regexEnd, '').trim();
    }
    // Clean multiple spaces
    return q.replace(/\s+/g, ' ').replace(/^["']|["']$/g, '').trim();
  }

  public parseIntent(userText: string): IntentResult {
    const rawText = userText.trim();
    const lowerText = rawText.toLowerCase();

    // Clean common conversational greetings & bot invocations
    let cleanText = lowerText
      .replace(/^(bhai|are yaar|hey vox|vox|voxpilot|alexa|siri|jarvis|bot|sun|suno|kripya|please)\s+/i, '')
      .trim();

    // 1. SPOTIFY COMMANDS (e.g. 'spotify pe "song name" play kr', 'play kesariya on spotify')
    if (cleanText.includes('spotify')) {
      let query = cleanText;
      // Strip platform indicators
      query = query.replace(/\b(on\s+spotify|spotify\s+pe|spotify\s+par|spotify\s+me|spotify)\b/gi, '');

      // Strip verbs
      for (const verb of [...this.playVerbs, ...this.openVerbs]) {
        query = query.replace(new RegExp(`\\b${verb}\\b`, 'gi'), '');
      }

      // Strip song words
      query = query.replace(/\b(gaana|gaane|song|track|music)\b/gi, '');
      query = this.cleanExtractedQuery(query);

      return {
        action: 'open_spotify',
        platform: 'spotify',
        parameters: { query: query || 'Trending Songs' },
        response_text: `Playing ${query || 'music'} on Spotify.`,
        raw_command: rawText,
      };
    }

    // 2. YOUTUBE & VIDEO COMMANDS (e.g. 'video open kro', 'youtube pe chaleya play kr', 'play video')
    const isVideoSpecific = cleanText.includes('video') || cleanText.includes('youtube') || cleanText.includes('yt');
    const hasPlayVerb = ['chalao', 'bajao', 'sunao', 'play', 'chala do', 'baja do'].some((v) => cleanText.includes(v));

    if (isVideoSpecific || hasPlayVerb) {
      let query = cleanText;
      // Strip platform indicators
      query = query.replace(/\b(on\s+youtube|youtube\s+pe|youtube\s+par|youtube\s+me|youtube|yt)\b/gi, '');

      // Strip verbs
      for (const verb of [...this.playVerbs, ...this.openVerbs]) {
        query = query.replace(new RegExp(`\\b${verb}\\b`, 'gi'), '');
      }

      // Strip video / song words
      query = query.replace(/\b(video|gaana|gaane|song|track|music)\b/gi, '');
      query = this.cleanExtractedQuery(query);

      // If user literally said "video open kro" with no title, default to a trending video
      if (!query && isVideoSpecific) {
        query = 'Trending Music Video';
      }

      return {
        action: 'play_youtube',
        platform: 'youtube',
        parameters: { query: query || 'Trending Music' },
        response_text: `Playing ${query || 'video'} on YouTube.`,
        raw_command: rawText,
      };
    }

    // 3. GMAIL COMMANDS
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

    // 4. WHATSAPP WEB
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

    // 5. GOOGLE MAPS
    if (['map', 'maps', 'rasta', 'direction', 'location'].some((w) => cleanText.includes(w))) {
      let query = cleanText.replace(/\b(map|maps|kahan hai|rasta|location|dikhao)\b/gi, '');
      query = this.cleanExtractedQuery(query);
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

    // 8. GOOGLE SEARCH (Default fallback for any question/query)
    let search = cleanText
      .replace(/\b(on\s+google|google\s+pe|google\s+par|google|search|dhoondho|dhoondo|khojo|batao|karo|what is|who is)\b/gi, '');
    search = this.cleanExtractedQuery(search);

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
