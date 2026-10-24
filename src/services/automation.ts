import { ExecutionResult, IntentParameters } from '../types';

// Curated top video IDs for zero-latency direct autoplay matching Python scraping
const KNOWN_YOUTUBE_VIDEOS: Record<string, string> = {
  'chikni chameli': 'J3yW_rW8xCY',
  'arijit singh': '24eQkZ8E87I',
  'believer': '7wtfhZwyrcc',
  'kesariya': 'BddP6PYo2gs',
  'chaleya': 'VAdGW7QDJiU',
  'tum hi ho': 'IJq0yyWug1k',
};

export class AutomationController {
  private tryOpenUrl(url: string): boolean {
    try {
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      return !!win;
    } catch {
      return false;
    }
  }

  public getYouTubeVideoId(query: string): string | null {
    const clean = query.toLowerCase().trim();
    for (const [key, id] of Object.entries(KNOWN_YOUTUBE_VIDEOS)) {
      if (clean.includes(key)) {
        return id;
      }
    }
    return null;
  }

  public execute(action: string, platform: string, params: IntentParameters): ExecutionResult {
    const result: ExecutionResult = {
      success: true,
      action,
      platform,
      url_opened: null,
      message: '',
    };

    try {
      // 1. YOUTUBE AUTOMATION
      if (action === 'play_youtube') {
        const query = (params.query || '').trim();
        if (!query) {
          const targetUrl = 'https://www.youtube.com';
          this.tryOpenUrl(targetUrl);
          result.url_opened = targetUrl;
          result.message = 'YouTube opened.';
          return result;
        }

        const videoId = this.getYouTubeVideoId(query);
        if (videoId) {
          const targetUrl = `https://www.youtube.com/watch?v=${videoId}&autoplay=1`;
          this.tryOpenUrl(targetUrl);
          result.url_opened = targetUrl;
          result.message = `Playing '${query}' directly on YouTube (Video ID: ${videoId})`;
        } else {
          const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
          this.tryOpenUrl(targetUrl);
          result.url_opened = targetUrl;
          result.message = `Searching and playing '${query}' on YouTube`;
        }
        return result;
      }

      if (action === 'open_youtube') {
        const targetUrl = 'https://www.youtube.com';
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'YouTube opened in browser.';
        return result;
      }

      // 2. GMAIL AUTOMATION
      if (action === 'compose_gmail') {
        const to = encodeURIComponent(params.to || '');
        const su = encodeURIComponent(params.subject || '');
        const body = encodeURIComponent(params.body || 'Sent via VoxPilot Voice AI.');
        const targetUrl = `https://mail.google.com/mail/u/0/?fs=1&tf=cm&to=${to}&su=${su}&body=${body}`;
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened Gmail draft with pre-filled recipient and subject.`;
        return result;
      }

      if (action === 'open_gmail') {
        const targetUrl = 'https://mail.google.com/mail/u/0/#inbox';
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'Opened Gmail Inbox.';
        return result;
      }

      // 3. WHATSAPP WEB AUTOMATION
      if (action === 'open_whatsapp') {
        const phone = (params.phone || '').trim();
        const msg = encodeURIComponent(params.message || '');
        const targetUrl = phone
          ? `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`
          : 'https://web.whatsapp.com';
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = phone
          ? `Opening WhatsApp chat with ${phone}`
          : 'Opened WhatsApp Web.';
        return result;
      }

      // 4. GOOGLE SEARCH & MAPS
      if (action === 'google_search') {
        const query = params.query || '';
        const targetUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Searched Google for '${query}'`;
        return result;
      }

      if (action === 'open_maps') {
        const loc = params.location || '';
        const targetUrl = `https://www.google.com/maps/search/${encodeURIComponent(loc)}`;
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened Google Maps for '${loc}'`;
        return result;
      }

      // 5. SPOTIFY
      if (action === 'open_spotify') {
        const query = params.query || '';
        const targetUrl = query
          ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
          : 'https://open.spotify.com';
        this.tryOpenUrl(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened Spotify for '${query}'`;
        return result;
      }

      // 6. SYSTEM APP LAUNCHER
      if (action === 'launch_app') {
        const app = (params.app || 'calculator').toLowerCase();
        result.message = `Launched desktop app: ${app.charAt(0).toUpperCase() + app.slice(1)}`;
        result.simulated = true;
        return result;
      }

      result.success = false;
      result.message = `Unknown action: ${action}`;
      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.success = false;
      result.error = errorMsg;
      result.message = `Automation error: ${errorMsg}`;
      return result;
    }
  }
}

export const defaultAutomationController = new AutomationController();
