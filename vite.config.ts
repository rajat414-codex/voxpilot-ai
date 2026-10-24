import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'youtube-realtime-resolver',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/resolve-youtube')) {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const query = urlObj.searchParams.get('q') || '';
            if (!query) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ videoId: null }));
              return;
            }

            try {
              const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
              const ytResponse = await fetch(ytSearchUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9',
                },
              });
              const html = await ytResponse.text();
              const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
              const videoId = matches.length > 0 ? matches[0] : null;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ videoId, query }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ videoId: null, error: err?.message || 'Scrape error' }));
            }
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
