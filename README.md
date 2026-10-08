# Daydreamin' Player

An immersive, responsive music time machine built with React, TypeScript, Motion, the official YouTube IFrame Player API, Cloudflare Pages Functions, and optional Firebase authentication/library persistence.

## Local development

Requirements: Node.js 22 or newer and npm 10 or newer.

```bash
npm ci
cp .env.example .env.local
cp .dev.vars.example .dev.vars
npm run dev
```

The visual shell and anonymous queue work without Firebase configuration. Search and recommendations require a server-side YouTube Data API key in `.dev.vars`; never create a `VITE_YOUTUBE_*` variable. Google sign-in and cloud saves require the browser-safe `VITE_FIREBASE_*` values documented in `.env.example`.

For a local end-to-end experience with the Pages Function, run the built site through Wrangler rather than Vite alone:

```bash
npm run build
npx wrangler pages dev dist
```

## Verification

```bash
npm test
npm run test:e2e
npm run build
```

Unit/component tests mock all providers. Playwright intercepts catalog and IFrame API traffic, so the default suite is deterministic and consumes no YouTube quota.

## Deployment

1. Deploy the Vite output (`dist`) and `functions` directory to Cloudflare Pages.
2. Add `YOUTUBE_API_KEY` as an encrypted Pages secret.
3. Add the six `VITE_FIREBASE_*` variables at build time when authentication is enabled.
4. Add the production domain to Firebase Authentication's authorized domains.
5. Deploy `firestore.rules` before enabling saved tracks.
6. Rotate any credential that was ever committed or shipped to a client bundle.

The catalog endpoint accepts only bounded searches/recommendation requests, maps provider failures to safe error codes, and never returns raw upstream errors or credentials. YouTube playback uses a visible official embed that meets the provider's minimum viewport requirement.
