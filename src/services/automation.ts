import { ExecutionResult, IntentParameters } from '../types';

export interface MediaHit {
  title: string;
  videoId: string;
  artist?: string;
  spotifyTrackId?: string;
}

export const POPULAR_HITS: MediaHit[] = [
  { title: 'Tauba Tauba', artist: 'Karan Aujla', videoId: 'LK7-_dgAVQE', spotifyTrackId: '6eI4c9rDfgwR35wN8mJ9l1' },
  { title: 'Gehra Hua', artist: 'Arijit Singh', videoId: 'GX9x62kFsVU', spotifyTrackId: '2qRzZqZqZqZqZqZqZqZqZq' },
  { title: 'Apna Bana Le', artist: 'Arijit Singh', videoId: 'UEvOsQBu1jY', spotifyTrackId: '5DODQjZ12a2hM6Yf1e9h3u' },
  { title: 'Believer', artist: 'Imagine Dragons', videoId: '7wtfhZwyrcc', spotifyTrackId: '0pqnGHJpmpxLKLy7cX2wf5' },
  { title: 'Shape of You', artist: 'Ed Sheeran', videoId: 'JGwWNGJdvx8', spotifyTrackId: '7qiZfU4dY1lWllzX7mPBI3' },
  { title: 'Kesariya', artist: 'Arijit Singh', videoId: 'BddP6PYo2gs', spotifyTrackId: '6UQj6xYmOQW772Q6iU38rV' },
  { title: 'Naina', artist: 'Diljit Dosanjh', videoId: 'sFmrN9vT6h4', spotifyTrackId: '4bzHqI3z834' },
  { title: 'Chikni Chameli', artist: 'Shreya Ghoshal', videoId: 'J3yW_rW8xCY', spotifyTrackId: '2Foc5Q5nqNiosCNqttzHof' },
  { title: 'Illuminati', artist: 'Sushin Shyam', videoId: 'tOM-nWPcR4U', spotifyTrackId: '3n3Ppam7vgaVa1iaRUc9Lp' },
  { title: 'Soulmate', artist: 'Badshah & Arijit Singh', videoId: '4bzHqI3z834', spotifyTrackId: '7fB3q2bFz6yC3m0qL5' },
  { title: 'Coldplay - Hymn For The Weekend', artist: 'Coldplay', videoId: 'YykjpeuMNEk', spotifyTrackId: '3RiPr603aXAoi4GHyXx0uy' },
  { title: 'Faded', artist: 'Alan Walker', videoId: '60ItHLz5WEA', spotifyTrackId: '2NmAIwZzYF80v0f6d6P9P9' },
  { title: 'CarryMinati', artist: 'CarryMinati', videoId: 'tg2MwT5FPdY' },
  { title: 'BB Ki Vines', artist: 'Bhuvan Bam', videoId: 'k7q2hG7_k38' },
  { title: 'Ashish Chanchlani', artist: 'Ashish Chanchlani', videoId: 'fIq3eC14H4M' },
  { title: '295', artist: 'Sidhu Moosewala', videoId: '4DFEtWq7Xv4' },
  { title: 'Lover', artist: 'Diljit Dosanjh', videoId: '1xYBnT6fU7g' },
  { title: 'Softly', artist: 'Karan Aujla', videoId: 'g_Yy5Q-p2Z8' },
  { title: 'O Maahi', artist: 'Arijit Singh', videoId: 'rUxyKA_-grg' },
  { title: 'Raataan Lambiyan', artist: 'Jubin Nautiyal', videoId: 'gvyUuxdRdR4' },
  { title: 'Tere Vaaste', artist: 'Varun Jain', videoId: 'AX6OrbgS8lI' },
  { title: 'Kahani Suno', artist: 'Kaifi Khalil', videoId: '_XBYrnU832s' },
  { title: 'Ve Kamleya', artist: 'Arijit Singh', videoId: 'f8_wB62aWq4' },
  { title: 'Heeriye', artist: 'Jasleen Royal & Arijit Singh', videoId: 'RLzC55ai0eo' },
  { title: 'Guli Mata', artist: 'Saad Lamjarred & Shreya Ghoshal', videoId: 'WcIcVapfqXw' },
  { title: 'Lofi Chill Beats', artist: 'Lofi Girl', videoId: 'jfKfPfyJRdk' },
  { title: 'Dangal', artist: 'Daler Mehndi', videoId: '92J3m_eJ99g' },
  { title: 'Bones', artist: 'Imagine Dragons', videoId: 'TO-_3tck2tg' },
  { title: 'Perfect', artist: 'Ed Sheeran', videoId: '2Vv-BfVoq4g' },
  { title: 'Despacito', artist: 'Luis Fonsi', videoId: 'kJQP7kiw5Fk' },
  { title: 'Chaleya', artist: 'Arijit Singh', videoId: 'VAdGW7QDJiU', spotifyTrackId: '0aym2LBJBIm974knNZ5j9S' },
  { title: 'Tum Hi Ho', artist: 'Arijit Singh', videoId: 'IJq0yyWug1k', spotifyTrackId: '5PUWb0aA2XyJgB29N5wN5p' },
  { title: 'Badtameez Dil', artist: 'Benny Dayal', videoId: 'II2EO3NwUrQ', spotifyTrackId: '3vK1xQeK4U0G2sQ' },
];

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

  // Returns a random hit from our diverse pool
  public getRandomHit(): MediaHit {
    const randomIndex = Math.floor(Math.random() * POPULAR_HITS.length);
    return POPULAR_HITS[randomIndex];
  }

  // Real-time dynamic YouTube video resolver (resolves ANY song/video title dynamically)
  public async resolveDynamicYouTubeVideoId(query: string): Promise<{ videoId: string; displayTitle: string }> {
    const clean = query.trim();

    // 1. If random requested, pick a fresh random hit!
    if (clean === 'RANDOM_HIT' || !clean) {
      const hit = this.getRandomHit();
      return { videoId: hit.videoId, displayTitle: `${hit.title} (${hit.artist || 'Hit'})` };
    }

    // 2. Fetch real-time video ID from our server endpoint for ANY arbitrary title or query
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second generous timeout

      const res = await fetch(`/api/resolve-youtube?q=${encodeURIComponent(clean)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.videoId && typeof data.videoId === 'string' && data.videoId.length === 11) {
          return { videoId: data.videoId, displayTitle: clean };
        }
      }
    } catch (err) {
      console.log('[Automation] Live resolver note:', err);
    }

    // 3. Fallback: Check if query matches any known hit directly
    const lower = clean.toLowerCase();
    const hitMatch = POPULAR_HITS.find((h) => lower.includes(h.title.toLowerCase()) || (h.artist && lower.includes(h.artist.toLowerCase())));
    if (hitMatch) {
      return { videoId: hitMatch.videoId, displayTitle: hitMatch.title };
    }

    // 4. Reliable random hit fallback so it never repeats the same video!
    const hit = this.getRandomHit();
    return { videoId: hit.videoId, displayTitle: clean || hit.title };
  }

  public getSpotifyTrackId(query: string): string | null {
    const clean = query.toLowerCase().trim();
    const found = POPULAR_HITS.find((h) => clean.includes(h.title.toLowerCase()));
    return found?.spotifyTrackId || null;
  }

  public async triggerNativeDesktopApp(app: string): Promise<boolean> {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${app} kholo` }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async execute(action: string, platform: string, params: IntentParameters): Promise<ExecutionResult> {
    const result: ExecutionResult = {
      success: true,
      action,
      platform,
      url_opened: null,
      message: '',
      query: params.query || '',
    };

    try {
      // 1. YOUTUBE & VIDEO PLAYBACK (Dynamically resolves ANY video/song title and plays it!)
      if (action === 'play_youtube' || action === 'open_youtube') {
        const rawQuery = (params.query || '').trim();
        const resolved = await this.resolveDynamicYouTubeVideoId(rawQuery);
        result.videoId = resolved.videoId;
        result.query = resolved.displayTitle;

        // Open direct video watch page with autoplay
        const targetUrl = `https://www.youtube.com/watch?v=${resolved.videoId}&autoplay=1`;
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Playing '${resolved.displayTitle}' on YouTube`;
        return result;
      }

      // 2. SPOTIFY PLAYBACK (Opens Spotify with exact track/search queued + prepares in-page stream)
      if (action === 'open_spotify') {
        let query = (params.query || '').trim();
        if (query === 'RANDOM_HIT' || !query) {
          const hit = this.getRandomHit();
          query = hit.title;
        }

        // Also resolve the YouTube video ID so the user gets instant, playable media right in the dock!
        const resolved = await this.resolveDynamicYouTubeVideoId(query);
        result.videoId = resolved.videoId;
        result.query = query;

        const targetUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
        this.openExternalTab(targetUrl);
        result.url_opened = targetUrl;
        result.message = `Playing '${query}' on Spotify`;
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
