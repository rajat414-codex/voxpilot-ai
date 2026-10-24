import { ExecutionResult, IntentParameters } from '../types';

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
    // Fallback via synthetic anchor click
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
    };

    try {
      // 1. YOUTUBE AUTOMATION
      if (action === 'play_youtube') {
        const query = (params.query || '').trim();
        const targetUrl = query
          ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
          : 'https://www.youtube.com';

        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = query ? `Playing '${query}' on YouTube` : 'Opened YouTube';
        return result;
      }

      if (action === 'open_youtube') {
        const targetUrl = 'https://www.youtube.com';
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = 'Opened YouTube';
        return result;
      }

      // 2. GMAIL AUTOMATION
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

      // 3. WHATSAPP WEB
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

      // 4. SPOTIFY
      if (action === 'open_spotify') {
        const query = params.query || '';
        const targetUrl = query
          ? `https://open.spotify.com/search/${encodeURIComponent(query)}`
          : 'https://open.spotify.com';
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Opened Spotify for '${query}'`;
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

        // Also provide instant web tool fallback if desired
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
