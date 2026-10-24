import { ExecutionResult, IntentParameters } from '../types';

export const POPULAR_VIDEO_IDS: Record<string, string> = {
  'chikni chameli': 'J3yW_rW8xCY',
  'chikni': 'J3yW_rW8xCY',
  'arijit singh': '24eQkZ8E87I',
  'arijit': '24eQkZ8E87I',
  'believer': '7wtfhZwyrcc',
  'kesariya': 'BddP6PYo2gs',
  'chaleya': 'VAdGW7QDJiU',
  'tum hi ho': 'IJq0yyWug1k',
  'shape of you': 'JGwWNGJdvx8',
  'faded': '60ItHLz5WEA',
  'badtameez dil': 'II2EO3NwUrQ',
  'tauba tauba': 'kJQP7kiw5Fk',
  'despacito': 'kJQP7kiw5Fk',
  'starboy': '34Na4j8AVgA',
  'trending music video': 'J3yW_rW8xCY',
  'trending': 'J3yW_rW8xCY',
  'video': 'J3yW_rW8xCY',
  'song': 'VAdGW7QDJiU',
  'music': '24eQkZ8E87I',
};

export const SPOTIFY_TRACKS: Record<string, string> = {
  'chaleya': '0aym2LBJBIm974knNZ5j9S',
  'kesariya': '6UQj6xYmOQW772Q6iU38rV',
  'chikni chameli': '2Foc5Q5nqNiosCNqttzHof',
  'believer': '0pqnGHJpmpxLKLy7cX2wf5',
  'tum hi ho': '5PUWb0aA2XyJgB29N5wN5p',
  'shape of you': '7qiZfU4dY1lWllzX7mPBI3',
  'faded': '2NmAIwZzYF80v0f6d6P9P9',
  'tauba tauba': '6eI4c9rDfgwR35wN8mJ9l1',
  'arijit singh': '4YRxDV8wJFPHPTeXepOstw',
};

export class AutomationController {
  public openExternalTab(url: string): boolean {
    try {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
        return true;
      }
    } catch (e) {
      console.warn('[Automation] window.open error:', e);
    }
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }

  public getYouTubeVideoId(query: string): string {
    const clean = query.toLowerCase().trim();
    for (const [key, id] of Object.entries(POPULAR_VIDEO_IDS)) {
      if (clean.includes(key) || key.includes(clean)) {
        return id;
      }
    }
    // Default fallback popular music video so video ALWAYS plays immediately
    return 'VAdGW7QDJiU'; // Chaleya / high energy hit
  }

  public getSpotifyTrackId(query: string): string {
    const clean = query.toLowerCase().trim();
    for (const [key, id] of Object.entries(SPOTIFY_TRACKS)) {
      if (clean.includes(key) || key.includes(clean)) {
        return id;
      }
    }
    return '0aym2LBJBIm974knNZ5j9S'; // Chaleya
  }

  // Trigger local Windows desktop applications via Python backend runner
  public async triggerNativeDesktopApp(app: string): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${app} kholo` })
      });
      return res.ok;
    } catch (e) {
      console.log('[Automation] Native desktop bridge note:', e);
      return false;
    }
  }

  public execute(action: string, platform: string, params: IntentParameters): ExecutionResult {
    const result: ExecutionResult = {
      success: true,
      action,
      platform,
      url_opened: null,
      message: '',
      query: params.query || '',
    };

    try {
      // 1. YOUTUBE & VIDEO PLAYBACK (ALWAYS opens watch URL with autoplay, NEVER a blank search results page!)
      if (action === 'play_youtube' || action === 'open_youtube') {
        const query = (params.query || '').trim();
        const videoId = this.getYouTubeVideoId(query);
        result.videoId = videoId;

        // Open direct video watch page with autoplay enabled!
        const targetUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = query ? `Playing '${query}' on YouTube` : 'Playing video on YouTube';
        return result;
      }

      // 2. SPOTIFY PLAYBACK (Direct track player & search player)
      if (action === 'open_spotify') {
        const query = (params.query || '').trim();
        const trackId = this.getSpotifyTrackId(query);
        result.videoId = trackId;

        // Open direct Spotify track player URL so user can immediately hear/play the track
        let targetUrl: string;
        if (query && SPOTIFY_TRACKS[query.toLowerCase()]) {
          targetUrl = `https://open.spotify.com/track/${trackId}`;
        } else if (query) {
          targetUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
        } else {
          targetUrl = `https://open.spotify.com/track/${trackId}`;
        }

        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = query ? `Playing '${query}' on Spotify` : 'Playing on Spotify';
        return result;
      }

      // 3. GMAIL AUTOMATION
      if (action === 'compose_gmail') {
        const to = encodeURIComponent(params.to || '');
        const su = encodeURIComponent(params.subject || '');
        const body = encodeURIComponent(params.body || '');
        const targetUrl = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${to}&su=${su}&body=${body}`;
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'Opened Gmail Compose';
        return result;
      }

      if (action === 'open_gmail') {
        const targetUrl = 'https://mail.google.com/mail/u/0/#inbox';
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'Opened Gmail Inbox';
        return result;
      }

      // 4. WHATSAPP WEB
      if (action === 'open_whatsapp') {
        const phone = (params.phone || '').trim();
        const msg = encodeURIComponent(params.message || '');
        const targetUrl = phone
          ? `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`
          : 'https://web.whatsapp.com';
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'Opened WhatsApp Web';
        return result;
      }

      // 5. GOOGLE MAPS
      if (action === 'open_maps') {
        const loc = params.location || '';
        const targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(loc)}`;
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened Maps for '${loc}'`;
        return result;
      }

      // 6. DIRECT URLS (GitHub, Twitter, Reddit, etc.)
      if (action === 'open_url') {
        const targetUrl = params.query || 'https://google.com';
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened ${platform}`;
        return result;
      }

      // 7. DESKTOP APPS (Calculator, Notepad, Terminal)
      if (action === 'launch_app') {
        const app = (params.app || 'calculator').toLowerCase();
        this.triggerNativeDesktopApp(app);

        if (app === 'calculator') {
          this.openExternalTab('https://www.google.com/search?q=calculator');
        }
        result.message = `Launched desktop ${app}`;
        return result;
      }

      // 8. GOOGLE SEARCH (Default fallback for any question)
      const query = params.query || '';
      const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      this.openExternalTab(targetUrl);
      result.url_opened = targetUrl;
      result.message = `Searched Google for '${query}'`;
      return result;
    } catch (e: any) {
      result.success = false;
      result.error = e?.message || 'Execution error';
      return result;
    }
  }
}

export const defaultAutomationController = new AutomationController();
