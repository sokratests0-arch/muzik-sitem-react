// Simple proxy server for Google Generative API
// Usage: set env GOOGLE_GEN_API_KEY and run `node server/index.js`

import express from 'express';
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5176;
const API_KEY = process.env.GOOGLE_GEN_API_KEY;

if (!API_KEY) {
  console.warn('Warning: GOOGLE_GEN_API_KEY not set. Proxy will return 400 for requests.');
}

app.post('/api/gen', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await resp.text();
    res.status(resp.status).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`));
