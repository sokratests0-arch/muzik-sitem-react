Simple proxy server for Google Generative API

Usage:
- Set environment variable `GOOGLE_GEN_API_KEY` (your server-side API key).
- Run `node server/index.js` or `npm run start:server` from project root.

The server exposes POST `/api/gen` with JSON body `{ "prompt": "..." }`.
It forwards the request to the Google Generative API using the server key.

Notes:
- Do NOT commit your `GOOGLE_GEN_API_KEY` to version control. Put it in your environment or in a local `.env` file not tracked by git.
