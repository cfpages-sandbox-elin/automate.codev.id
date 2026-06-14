# NCA Toolkit Web UI - Cloudflare Pages migration notes

This source package is safe to push to GitHub. It intentionally excludes:

- `node_modules/`
- `.next/`
- `.env.local`
- `.git/`
- local logs and caches

## Current app shape

The app was built as a Next.js App Router UI for `https://automate.codev.id`.

Current server deployment uses:

- Next.js app source: `/home/ubuntu/nca-toolkit-web`
- Local-only server bind: `127.0.0.1:8090`
- Oracle backend toolkit API: `127.0.0.1:8088`
- Nginx public proxy: `/etc/nginx/sites-enabled/automate.codev.id.conf`
- Systemd service: `/etc/systemd/system/nca-toolkit-web.service`

## Cloudflare Pages recommendation

Cloudflare Pages is a good fit for the browser UI because it can remove the always-on Next.js frontend process from the Oracle server. The Oracle server can stay focused on the heavy backend work: FFmpeg, media jobs, Playwright, Whisper, and R2 upload helpers.

Important: Pages Functions cannot call `127.0.0.1:8088` on the Oracle server. That address only exists from inside the Oracle server. To move the UI to Cloudflare Pages, add a narrow public backend endpoint on the Oracle server, for example:

- `https://automate-api.codev.id`
- or `https://backend.automate.codev.id`

That endpoint should proxy only safe toolkit actions, not the entire raw API, and it should require a server-to-server secret header from Cloudflare Pages Functions.

## Suggested Cloudflare Pages environment variables

Set these in Cloudflare Pages, not in GitHub:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
ORACLE_BACKEND_BASE_URL=https://automate-api.codev.id
ORACLE_BACKEND_PROXY_SECRET=generate-a-new-long-random-secret
```

Do not put the toolkit API key or R2 secrets in the browser. If a Pages Function needs to talk to Oracle, it should send `ORACLE_BACKEND_PROXY_SECRET`; the Oracle backend then injects the real toolkit API key locally.

## Current build commands

For local/server Next.js build:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

For Cloudflare Pages, the exact build command depends on the adapter. Two options:

1. Try Cloudflare's Next.js Pages preset first.
2. If Next.js 16 support is rough, convert this lightweight UI to Vite/React + Cloudflare Pages Functions. That may be simpler and cheaper for this app because most heavy work is backend-only.

## Best architecture for saving server resources

Recommended target:

Browser -> Cloudflare Pages UI -> Cloudflare Pages Function -> Oracle narrow backend proxy -> localhost toolkit API -> R2

Do not expose:

- `127.0.0.1:8088` directly
- `/v1/code/execute/python`
- raw toolkit API passthrough without endpoint allowlisting

## First backend endpoints to expose safely later

Start with a tiny allowlist:

- `GET /health`
- `POST /toolkit/smoke-test`
- `POST /media/metadata`
- `POST /media/to-mp3`
- `POST /media/transcribe`

Each endpoint should validate input, rate-limit if practical, and call the local toolkit API with the real API key server-side.
