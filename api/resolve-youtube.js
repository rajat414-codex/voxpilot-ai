export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query?.q || '').trim();
  if (!query) {
    return res.status(200).json({ videoId: null });
  }

  try {
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytResponse = await fetch(ytSearchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = await ytResponse.text();
    const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map((m) => m[1]);
    const videoId = matches.length > 0 ? matches[0] : null;

    return res.status(200).json({ videoId, query });
  } catch (err) {
    return res.status(200).json({ videoId: null, error: err?.message || 'Scrape error' });
  }
}
