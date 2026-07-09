# GitOwl Playground

A public landing page + live demo: paste a unified diff, get GitOwl's real
AI-powered risk score and findings back — the same review engine GitOwl
posts as a PR comment, running here on a pasted snippet instead.

Deployed as a single Vercel project: the React frontend is served as a static
build, and `/api/review` is a Vercel Python serverless function that calls
`gitowl.reviewer.review_diff` directly. Semgrep is skipped here — pasted
snippets aren't a checked-out repo, and the function host doesn't have it
installed — so this is the AI-only review path (same as `gitowl review-diff
--no-semgrep`).

No database, no stored review history — every request is stateless.

## Local development
//tesing commit
### API

From the **repo root** (so the `gitowl` package resolves):

```bash
pip install -r playground/api/requirements.txt
cp playground/.env.example playground/.env   # fill in AI_API_KEY
uvicorn playground.api.review:app --reload --port 8123
```

### Frontend

```bash
cd playground/web
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8123` (see
`vite.config.ts`), so run the API first.

### Both together (closer to production)

```bash
npm install -g vercel   # once
cd playground
vercel dev
```

## Deploying

1. Import this repo into a new Vercel project, with **Root Directory** set to
   `playground`.
2. Set the environment variables from `.env.example` in the Vercel project
   settings (`AI_API_KEY` at minimum — it stays server-side, never sent to
   the browser).
3. Deploy. `vercel.json` builds the frontend and wires `/api/review` to the
   Python function automatically.
