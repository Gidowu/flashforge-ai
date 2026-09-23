# FlashForge AI

Paste your notes, get instant flashcards. A small full-stack app: React (Vite) frontend,
Node/Express backend, SQLite persistence for saved sets, and an AI generation step that
calls Claude when an API key is present — with a deterministic heuristic fallback so the
app always works, even with zero configuration.

## Why it's built this way

- **Graceful AI degradation** — `server/generate.js` tries Claude first
  (`ANTHROPIC_API_KEY`) and falls back to a rule-based flashcard generator (splits
  "Term: definition" lines, clozes a keyword out of plain sentences) if no key is set or
  the request fails. The UI always shows which mode produced the cards.
- **Real persistence** — saved sets are stored in SQLite (`server/db.js`), not
  `localStorage`, so they survive across devices/sessions.
- **One process in production** — `npm run build` compiles the React app to `dist/`,
  and the same Express server serves both the static frontend and the `/api/*` routes.

## Run locally

```bash
npm install
npm run dev       # Vite dev server (5173) + Express API (5000) with hot reload
```

## Run in production mode (what Replit runs)

```bash
npm install
npm run build
npm start         # serves the built frontend + API on PORT (default 5000)
```

## Enable real AI generation

Set an environment variable (Replit: use the Secrets tab):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without it, the app runs in demo mode using the heuristic generator — fully functional,
just less magical.

## API

| Method | Path              | Body                          | Notes                          |
|--------|-------------------|--------------------------------|---------------------------------|
| POST   | `/api/generate`   | `{ notes, count }`             | Returns `{ mode, cards }`       |
| GET    | `/api/sets`       | —                               | List saved sets                 |
| POST   | `/api/sets`       | `{ title, mode, cards }`       | Save a set                      |
| GET    | `/api/sets/:id`   | —                               | Fetch one set with its cards    |
| DELETE | `/api/sets/:id`   | —                               | Delete a set                    |
