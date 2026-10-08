# Daydreamin' Production Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Daydreamin' as a responsive music time-machine with decade scenes, smooth tactile motion, YouTube recommendations/search/playback, queues, and Firebase-backed saved music.

**Architecture:** A Vite React TypeScript client owns era presentation, normalized playback state, and responsive interaction. A Cloudflare Pages Function protects YouTube Data API credentials behind a provider-neutral catalog contract, while the official YouTube IFrame API handles playback and Firebase adapters handle authentication and saved tracks.

**Tech Stack:** React, TypeScript, Vite, Motion for React, Zustand, TanStack Query, Firebase Auth/Firestore, Cloudflare Pages Functions, Vitest, Testing Library, Playwright, axe-core.

**Spec:** `docs/superpowers/specs/2026-10-08-daydreamin-production-redesign-design.md`

## Global Constraints

- Initial eras are exactly `1940s`, `1970s`, `2000s`, and `2020s`.
- Era changes never interrupt the currently playing track.
- YouTube playback uses the official visible IFrame Player API; no media extraction or download code is permitted.
- No YouTube Data API credential may appear in client source or the built client bundle.
- Continuous animation uses compositor-friendly transforms/opacity and targets 60 FPS on representative mid-range devices.
- The experience remains usable at 320 CSS pixels wide and 200% browser zoom.
- `prefers-reduced-motion: reduce` removes parallax, continuous rotation, stagger, and spatial travel while retaining brief state-signaling opacity changes.
- Anonymous browsing/search/playback works; authentication is required only for cloud persistence.
- Decorative images use empty alternative text and cannot intercept pointer input.
- The local checkout began without repository metadata; preserve the legacy root files until their Vite replacements are verified, and never commit the exposed legacy YouTube credential.

## Review Focus

- Rapid repeated era selection: only the final era remains active and only its recommendation response is rendered; pinned in Task 4.
- Empty, extremely long, or malformed search input: the gateway rejects it predictably without calling YouTube; pinned in Task 6.
- YouTube API unavailable or a queued video becomes unplayable: controls remain usable, the queue stays intact, and the user gets an actionable message; pinned in Task 8.
- Quota exhaustion or offline browsing: the current scene and queue remain intact and retry/fallback UI is available; pinned in Tasks 6 and 7.
- Reduced motion, keyboard-only use, 320-pixel viewport, and 200% zoom: core discovery and playback controls remain reachable; pinned in Tasks 4 and 10.

---

### Task 1: Typed Application Foundation

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/App.test.tsx`
- Create: `src/test/setup.ts`
- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`
- Modify: `index.html`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the approved design specification and the existing Firebase-hosted root.
- Produces: `App(): JSX.Element`, standard `npm run dev`, `npm run test`, `npm run build`, and `npm run test:e2e` commands used by all later tasks.

- [ ] **Step 1: Install the application and test toolchain**

Create the Vite/React TypeScript package metadata and install React, Motion, Zustand, TanStack Query, Firebase, Lucide React, Vitest, Testing Library, jsdom, Playwright, and axe-core. Configuration files contain tooling only; runtime behavior starts test-first in Step 2.

- [ ] **Step 2: Write the failing application-shell test**

Add `renders the Daydreamin brand, decade navigation landmark, and player landmark` to `src/app/App.test.tsx`, asserting those three accessible landmarks/names.

- [ ] **Step 3: Verify the shell test fails for missing `App` behavior**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because the application shell and named landmarks do not exist.

- [ ] **Step 4: Implement the minimal accessible shell**

Implement `App(): JSX.Element` in `src/app/App.tsx`, mount it from `src/main.tsx`, add the three semantic landmarks, and establish only the base reset/tokens needed to render the shell.

- [ ] **Step 5: Verify test and production build**

Run: `npm test -- src/app/App.test.tsx && npm run build`

Expected: one passing test and a successful Vite production build.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json vite.config.ts vitest.config.ts playwright.config.ts index.html .gitignore src
git commit -m "build: establish typed React application"
```

### Task 2: Era Domain and Scene Assets

**Files:**
- Create: `src/features/eras/types.ts`
- Create: `src/features/eras/eras.ts`
- Create: `src/features/eras/eras.test.ts`
- Create: `public/assets/eras/1940s-scene.webp`
- Create: `public/assets/eras/1970s-scene.webp`
- Create: `public/assets/eras/2000s-scene.webp`
- Create: `public/assets/eras/2020s-scene.webp`
- Create: `public/assets/texture/noise.webp`

**Interfaces:**
- Consumes: no runtime interfaces from earlier tasks.
- Produces: `type EraId = "1940s" | "1970s" | "2000s" | "2020s"`, `interface EraDefinition`, `ERAS`, `getEra(id: EraId): EraDefinition`, and `getAdjacentEra(id: EraId, direction: -1 | 1): EraId`.

- [ ] **Step 1: Write failing era-definition tests**

Test that `ERAS` has the four ordered IDs, every era has a unique title/palette/scene URL and non-empty recommendation queries, and adjacency clamps at the endpoints.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/features/eras/eras.test.ts`

Expected: FAIL because `types.ts` and `eras.ts` do not exist.

- [ ] **Step 3: Implement typed era definitions**

Define `EraDefinition` with `id`, `label`, `displayYear`, `tagline`, `palette`, `sceneUrl`, `recordLabel`, and `recommendationQueries`. Implement the exact four entries and adjacency helper.

- [ ] **Step 4: Generate original era artwork**

Use the image-generation workflow to create four original tabletop collage backgrounds inspired by each period without copying the reference creator’s branding or proprietary artwork. Convert optimized outputs to WebP with fixed dimensions and create a subtle reusable noise texture.

- [ ] **Step 5: Verify definitions and asset budgets**

Run: `npm test -- src/features/eras/eras.test.ts && find public/assets -type f -size +1200k -print`

Expected: tests pass and the size check prints no files.

- [ ] **Step 6: Commit**

```bash
git add src/features/eras public/assets
git commit -m "feat: define eras and original scene artwork"
```

### Task 3: Queue and Playback State

**Files:**
- Create: `src/features/player/types.ts`
- Create: `src/features/player/playerStore.ts`
- Create: `src/features/player/playerStore.test.ts`
- Create: `src/features/player/time.ts`
- Create: `src/features/player/time.test.ts`

**Interfaces:**
- Consumes: no external player implementation.
- Produces: normalized `Track`, `PlaybackStatus`, and `RepeatMode` types; `usePlayerStore`; actions `playNow(track)`, `enqueue(track)`, `playNext(track)`, `removeFromQueue(trackId)`, `selectQueueIndex(index)`, `next()`, `previous(currentTime)`, `toggleShuffle()`, `cycleRepeat()`, `setStatus(status)`, and `setProgress(currentTime, duration)`; `formatTime(seconds): string`.

- [ ] **Step 1: Write failing queue-state tests**

Cover play-now insertion, de-duplication by `provider:id`, add-next ordering, removing the current item, next/previous wrap behavior, repeat-one/repeat-all, deterministic shuffled navigation, restarting after three seconds, and queue preservation when unrelated era state changes.

- [ ] **Step 2: Write failing time-format tests**

Cover `0 -> "0:00"`, `65 -> "1:05"`, non-finite input, and negative input.

- [ ] **Step 3: Verify the tests fail**

Run: `npm test -- src/features/player/playerStore.test.ts src/features/player/time.test.ts`

Expected: FAIL because the store and formatter do not exist.

- [ ] **Step 4: Implement the minimal normalized store and formatter**

Use Zustand with small action/state slices and stable string track keys. Keep selected era outside this store so era changes cannot mutate playback.

- [ ] **Step 5: Verify the player-domain tests**

Run: `npm test -- src/features/player/playerStore.test.ts src/features/player/time.test.ts`

Expected: all queue and formatter tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/features/player
git commit -m "feat: add normalized playback queue state"
```

### Task 4: Era Scene and Accessible Timeline

**Files:**
- Create: `src/features/eras/eraStore.ts`
- Create: `src/features/eras/eraStore.test.ts`
- Create: `src/features/eras/EraScene.tsx`
- Create: `src/features/eras/EraScene.module.css`
- Create: `src/features/eras/EraTimeline.tsx`
- Create: `src/features/eras/EraTimeline.test.tsx`
- Create: `src/features/eras/EraTimeline.module.css`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `EraId`, `ERAS`, and `getAdjacentEra` from Task 2.
- Produces: `useEraStore` with `activeEra`, `setEra(id)`, `stepEra(direction)` and monotonically increasing `selectionVersion`; `EraTimeline`; `EraScene`.

- [ ] **Step 1: Write failing era-store and rapid-selection tests**

Assert ordered keyboard stepping, endpoint clamping, and that three immediate calls to `setEra` leave only the final ID with the latest `selectionVersion`.

- [ ] **Step 2: Write failing timeline interaction tests**

Assert radiogroup semantics, selected-state announcements, click selection, Arrow/Home/End keyboard input, and a reduced-motion attribute when the media query matches.

- [ ] **Step 3: Verify the tests fail**

Run: `npm test -- src/features/eras/eraStore.test.ts src/features/eras/EraTimeline.test.tsx`

Expected: FAIL because the store and timeline are missing.

- [ ] **Step 4: Implement the state, timeline, and scene shell**

Render a vertical desktop timeline and horizontal mobile timeline from one DOM structure. Use Motion layout transforms for the active thumb, interruptible transitions keyed by `selectionVersion`, and CSS custom properties from the active era palette.

- [ ] **Step 5: Verify interaction tests and no playback coupling**

Run: `npm test -- src/features/eras src/features/player/playerStore.test.ts`

Expected: all era tests pass and existing player tests remain green.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/features/eras
git commit -m "feat: add animated decade scene navigation"
```

### Task 5: Tactile Turntable Motion

**Files:**
- Create: `src/features/player/Turntable.tsx`
- Create: `src/features/player/Turntable.test.tsx`
- Create: `src/features/player/Turntable.module.css`
- Create: `src/features/player/useReducedMotionPolicy.ts`
- Create: `src/features/player/useReducedMotionPolicy.test.ts`
- Modify: `src/features/eras/EraScene.tsx`

**Interfaces:**
- Consumes: active `EraDefinition`, `PlaybackStatus`, and `usePlayerStore` from earlier tasks.
- Produces: `Turntable({ era, status, onTogglePlayback }): JSX.Element` and `useReducedMotionPolicy(): { reduce: boolean; allowContinuous: boolean }`.

- [ ] **Step 1: Write failing turntable behavior tests**

Assert accessible play/pause activation, playing/resting tonearm states, era record-label updates without playback changes, and disabled continuous rotation in reduced-motion mode.

- [ ] **Step 2: Verify the tests fail**

Run: `npm test -- src/features/player/Turntable.test.tsx src/features/player/useReducedMotionPolicy.test.ts`

Expected: FAIL because the turntable and motion policy are missing.

- [ ] **Step 3: Implement turntable structure and motion states**

Build platter, vinyl, label, spindle, tonearm, controls, and highlights with semantic HTML/CSS. Use compositor rotation with eased inertia, a fixed transform origin for the tonearm, Motion springs for direct manipulation, and no high-frequency React state updates.

- [ ] **Step 4: Verify behavior and inspect runtime animation properties**

Run: `npm test -- src/features/player/Turntable.test.tsx src/features/player/useReducedMotionPolicy.test.ts && npm run build`

Expected: tests pass and the production build succeeds without warnings.

- [ ] **Step 5: Commit**

```bash
git add src/features/player src/features/eras/EraScene.tsx
git commit -m "feat: add tactile animated turntable"
```

### Task 6: Protected YouTube Catalog Gateway

**Files:**
- Create: `functions/api/catalog.ts`
- Create: `functions/lib/catalog.ts`
- Create: `functions/lib/catalog.test.ts`
- Create: `functions/lib/types.ts`
- Create: `src/services/catalog/types.ts`
- Create: `src/services/catalog/catalogClient.ts`
- Create: `src/services/catalog/catalogClient.test.ts`
- Create: `.dev.vars.example`
- Create: `wrangler.toml`

**Interfaces:**
- Consumes: `EraId` and era recommendation queries.
- Produces: `CatalogPage`, `CatalogErrorCode`, `CatalogProvider`, `searchCatalog(query, signal?)`, and `getEraRecommendations(era, signal?)`; Cloudflare handler `onRequestGet(context)` at `/api/catalog`.

- [ ] **Step 1: Write failing gateway validation tests**

Assert missing/blank queries, queries over 120 characters, invalid modes, unknown eras, and result limits over 20 return `400` without invoking upstream fetch.

- [ ] **Step 2: Write failing normalization and failure tests**

Assert successful YouTube responses normalize to `Track`; quota maps to `quota_exceeded`; network failure maps to `upstream_unavailable`; responses include cache headers; API keys never appear in bodies.

- [ ] **Step 3: Write failing client cancellation/offline tests**

Assert an aborted request produces `aborted`, offline/network errors produce `offline`, and previous successful data is not discarded by the client cache contract.

- [ ] **Step 4: Verify all catalog tests fail**

Run: `npm test -- functions/lib/catalog.test.ts src/services/catalog/catalogClient.test.ts`

Expected: FAIL because gateway and client modules are missing.

- [ ] **Step 5: Implement validation, YouTube mapping, errors, and client**

Create a pure `handleCatalogRequest(request, env, fetcher): Promise<Response>` in `functions/lib/catalog.ts`; keep the Cloudflare entry point thin. Use `YOUTUBE_API_KEY` only from `context.env`, bounded YouTube Data API parameters, and provider-neutral response types.

- [ ] **Step 6: Verify catalog tests and secret boundary**

Run: `npm test -- functions/lib/catalog.test.ts src/services/catalog/catalogClient.test.ts && npm run build && ! rg 'AIza|YOUTUBE_API_KEY' dist`

Expected: tests/build pass and the built-client secret scan returns success with no matches.

- [ ] **Step 7: Commit**

```bash
git add functions src/services/catalog .dev.vars.example wrangler.toml
git commit -m "feat: add protected YouTube catalog gateway"
```

### Task 7: Recommendations and Universal Search

**Files:**
- Create: `src/app/QueryProvider.tsx`
- Create: `src/components/TrackRow.tsx`
- Create: `src/components/TrackRow.test.tsx`
- Create: `src/features/eras/RecommendationTray.tsx`
- Create: `src/features/eras/RecommendationTray.test.tsx`
- Create: `src/features/search/SearchOverlay.tsx`
- Create: `src/features/search/SearchOverlay.test.tsx`
- Create: `src/features/search/useRecentSearches.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: catalog functions from Task 6, active era/version from Task 4, and player actions from Task 3.
- Produces: shared `TrackRow`, `RecommendationTray`, `SearchOverlay`, debounced query behavior, and recent-search persistence under `daydreamin:recent-searches:v1`.

- [ ] **Step 1: Write failing shared track-row tests**

Assert title/channel rendering and accessible `Play now`, `Play next`, `Add to queue`, and `Save` actions invoke the exact supplied track.

- [ ] **Step 2: Write failing recommendation concurrency/error tests**

Assert stale responses from a prior `selectionVersion` never render, quota/offline errors keep existing recommendations visible, and retry requests only the current era.

- [ ] **Step 3: Write failing search tests**

Assert 300 ms debouncing, keyboard result navigation, Escape close/focus restoration, blank-query suppression, recent-search cap of five, and explicit loading/empty/offline/quota states.

- [ ] **Step 4: Verify the tests fail**

Run: `npm test -- src/components/TrackRow.test.tsx src/features/eras/RecommendationTray.test.tsx src/features/search/SearchOverlay.test.tsx`

Expected: FAIL because discovery components are missing.

- [ ] **Step 5: Implement Query provider and unified discovery UI**

Use TanStack Query keys `['recommendations', era]` and `['search', normalizedQuery]`, cancellation signals, stale-data retention, and shared rows/actions. Render desktop dialog and mobile bottom sheet from the same semantic dialog content.

- [ ] **Step 6: Verify discovery tests**

Run: `npm test -- src/components src/features/search src/features/eras/RecommendationTray.test.tsx`

Expected: all discovery tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app src/components src/features/search src/features/eras/RecommendationTray.tsx src/features/eras/RecommendationTray.test.tsx
git commit -m "feat: add era recommendations and universal search"
```

### Task 8: Official YouTube Playback and Player Dock

**Files:**
- Create: `src/features/player/YouTubePlayerAdapter.ts`
- Create: `src/features/player/YouTubePlayerAdapter.test.ts`
- Create: `src/features/player/YouTubePlayer.tsx`
- Create: `src/features/player/PlayerDock.tsx`
- Create: `src/features/player/PlayerDock.test.tsx`
- Create: `src/features/player/PlayerDock.module.css`
- Create: `src/types/youtube.d.ts`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: normalized queue/store from Task 3.
- Produces: `PlayerAdapter` commands `load`, `play`, `pause`, `seekTo`, `setVolume`, `destroy`; typed player events; official visible `YouTubePlayer`; responsive `PlayerDock`.

- [ ] **Step 1: Write failing adapter readiness/state tests**

Assert the IFrame API script loads once, commands issued before readiness are safely queued, provider states map to application statuses, progress polling stops while paused/hidden, and teardown removes timers/listeners.

- [ ] **Step 2: Write failing unavailable-video recovery tests**

Assert an unavailable current video surfaces `Track unavailable`, preserves every queue entry, offers `Try next`, and does not enter an automatic infinite-skip loop.

- [ ] **Step 3: Write failing dock-control tests**

Assert visible embed region, play/pause, previous/next, seek, volume, elapsed/duration labels, queue access, and mobile expansion behavior.

- [ ] **Step 4: Verify the tests fail**

Run: `npm test -- src/features/player/YouTubePlayerAdapter.test.ts src/features/player/PlayerDock.test.tsx`

Expected: FAIL because adapter and dock are missing.

- [ ] **Step 5: Implement adapter, official player surface, and responsive dock**

Keep global `YT` interaction inside the adapter. Update progress through an isolated store subscription/requestAnimationFrame boundary and expose the official player at a compliant size in the now-playing surface.

- [ ] **Step 6: Verify player tests and build**

Run: `npm test -- src/features/player && npm run build`

Expected: all player tests pass and the production build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/App.tsx src/features/player src/types/youtube.d.ts
git commit -m "feat: integrate official YouTube playback"
```

### Task 9: Firebase Authentication and Saved Library

**Files:**
- Create: `src/services/firebase/config.ts`
- Create: `src/services/firebase/auth.ts`
- Create: `src/services/firebase/library.ts`
- Create: `src/services/firebase/library.test.ts`
- Create: `src/features/auth/AuthMenu.tsx`
- Create: `src/features/auth/AuthMenu.test.tsx`
- Create: `src/features/library/LibrarySheet.tsx`
- Create: `src/features/library/LibrarySheet.test.tsx`
- Create: `firestore.rules`
- Create: `.env.example`
- Modify: `firebase.json`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: normalized `Track` and shared `TrackRow`.
- Produces: `AuthUser`, `AuthService`, `LibraryRepository` with `subscribe(userId, listener)`, `save(userId, track)`, and `remove(userId, trackKey)`; `AuthMenu`; `LibrarySheet`.

- [ ] **Step 1: Write failing repository tests**

Assert tracks serialize without undefined values, duplicates use stable track keys, listeners unsubscribe, and persistence calls are rejected without a user ID.

- [ ] **Step 2: Write failing auth/library UI tests**

Assert anonymous users can dismiss sign-in and continue playback, save requests invite sign-in, authenticated users see their name/library, and Firebase failure does not remove the player.

- [ ] **Step 3: Verify the tests fail**

Run: `npm test -- src/services/firebase/library.test.ts src/features/auth/AuthMenu.test.tsx src/features/library/LibrarySheet.test.tsx`

Expected: FAIL because adapters and UI are missing.

- [ ] **Step 4: Implement Firebase adapters, UI, and owner-only rules**

Read browser-safe Firebase configuration from `VITE_FIREBASE_*` variables. Keep all SDK imports inside the service layer and define Firestore rules that allow `/users/{userId}/playlist/{trackId}` only when `request.auth.uid == userId`.

- [ ] **Step 5: Verify tests and rules configuration**

Run: `npm test -- src/services/firebase src/features/auth src/features/library && npm run build`

Expected: auth/library tests and production build pass.

- [ ] **Step 6: Commit**

```bash
git add src/services/firebase src/features/auth src/features/library firestore.rules .env.example firebase.json src/app/App.tsx
git commit -m "feat: restore authentication and saved library"
```

### Task 10: Responsive Polish, Accessibility, and End-to-End Verification

**Files:**
- Create: `src/styles/app.css`
- Create: `src/app/ErrorBoundary.tsx`
- Create: `src/app/ErrorBoundary.test.tsx`
- Create: `tests/e2e/time-machine.spec.ts`
- Create: `tests/e2e/mobile.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/fixtures/catalog.json`
- Create: `public/_headers`
- Modify: `src/app/App.tsx`
- Modify: `firebase.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: all preceding user-facing features.
- Produces: finished responsive composition, error boundary, deployment headers/configuration, visual/e2e coverage, and operator documentation.

- [ ] **Step 1: Write failing error-boundary test**

Assert a child render failure shows a safe Daydreamin recovery screen with `Reload experience` while avoiding raw stack/error details.

- [ ] **Step 2: Write failing desktop and mobile journeys**

Desktop: select `1970s`, receive matching mocked recommendations, play a result, switch to `2000s`, and verify playback remains active. Mobile at 320×700: open horizontal era control, search, play, expand/collapse now-playing, and reach every transport control.

- [ ] **Step 3: Write failing accessibility/reduced-motion journey**

At 200% zoom and keyboard-only input, traverse era selection, search, recommendation actions, and player controls; assert no serious axe violations. With reduced motion, assert scene layers do not translate and vinyl has no continuous animation.

- [ ] **Step 4: Verify end-to-end tests fail for missing polish**

Run: `npm test -- src/app/ErrorBoundary.test.tsx && npm run test:e2e`

Expected: unit and/or browser tests fail on unfinished responsive, error, or accessibility behavior.

- [ ] **Step 5: Implement final composition and production safeguards**

Complete responsive art direction, focus/focus-trap behavior, safe-area support, loading skeletons, error boundary, Content-Security-Policy and permissions headers compatible with YouTube/Firebase, asset preloading for only the active and adjacent era, and documented local/deployment environment variables.

- [ ] **Step 6: Run the full verification matrix**

Run: `npm test && npm run test:e2e && npm run build && ! rg 'AIza|YOUTUBE_API_KEY' dist`

Expected: all unit/component/e2e tests pass, build exits 0, and secret scan finds nothing.

- [ ] **Step 7: Perform motion and visual review**

Open the production build at desktop and 320-pixel mobile widths. Capture all four eras, record a timeline drag/search open/track change, and confirm no visible layout jumps, clipped controls, animation backlog, or unintended motion under reduced-motion settings.

- [ ] **Step 8: Commit**

```bash
git add src tests public/_headers firebase.json README.md
git commit -m "feat: finish responsive production experience"
```

### Task 11: Final Security and Release Audit

**Files:**
- Modify only files implicated by audit findings.

**Interfaces:**
- Consumes: the complete application and acceptance checklist.
- Produces: verified release candidate with no known acceptance gaps.

- [ ] **Step 1: Audit requirements line by line**

Map every acceptance checklist item in the specification to a passing automated test or a recorded manual check. Log and fix any gap before continuing.

- [ ] **Step 2: Run dependency and source audits**

Run: `npm audit --omit=dev && rg -n 'AIza|apiKey\s*[:=]|YOUTUBE_API_KEY|console\.log' src functions dist`

Expected: no actionable production vulnerability, leaked YouTube key, or stray runtime logging. Firebase browser configuration is allowed only through documented environment variables.

- [ ] **Step 3: Run final verification from a clean install**

Run: `npm ci && npm test && npm run test:e2e && npm run build`

Expected: every command exits 0 with no test failures.

- [ ] **Step 4: Inspect the final diff and repository status**

Run: `git diff --check && git status --short && git log --oneline --decorate -12`

Expected: no whitespace errors, only intentional files, and a coherent incremental commit history.

- [ ] **Step 5: Commit audit-only fixes if any**

```bash
git add <audited-files>
git commit -m "fix: address release audit findings"
```
