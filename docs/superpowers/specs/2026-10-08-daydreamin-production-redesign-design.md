# Daydreamin' Production Redesign

**Date:** 2026-10-08  
**Status:** Ready for written-spec review

## Product intent

Daydreamin' will become a production-quality, responsive music discovery player inspired by the attached “time player” reference. The experience should feel like an interactive music time machine rather than a conventional dashboard: users move between decades, the scene transforms around them, and era-appropriate music recommendations become immediately available. A persistent universal search remains available so users can find and play any YouTube track regardless of the selected era.

The redesign preserves the useful parts of the existing product—YouTube playback, authentication, and saved playlists—but replaces the current single-card interface and tightly coupled browser script with a typed, component-based application and a protected API boundary.

## Success criteria

1. The desktop experience communicates the time-machine concept at first glance through a full-viewport collage, working turntable, and decade timeline.
2. Switching decades changes the art direction and refreshes relevant music suggestions without interrupting a currently playing song unless the user selects a new one.
3. Universal search and the current queue are reachable from every era and use one consistent interaction model.
4. Playback uses the official YouTube IFrame Player API and exposes the required player surface in a themed now-playing area.
5. The interface works comfortably on phones, tablets, laptops, and large desktop displays.
6. Animations remain smooth under normal mobile and desktop conditions, avoid layout thrashing, and respect `prefers-reduced-motion`.
7. API credentials are not embedded in client source. Search and recommendation requests are validated, rate-limited where the deployment platform permits it, cached, and served through a serverless gateway.
8. Critical catalog, queue, playback-state, era-switching, search, and responsive flows have automated coverage.

## Scope

### Included

- Four initial eras: 1940s, 1970s, 2000s, and 2020s.
- Era-specific scenes, typography, palette, props, record labels, and recommendation queries.
- A draggable/clickable decade timeline: vertical on desktop and horizontal on mobile.
- A functional animated turntable with play/pause coupling, vinyl rotation, tonearm movement, and subtle reactive ambience.
- YouTube decade recommendations, universal YouTube search, official embedded playback, queue management, and common transport controls.
- Google sign-in, favorites/saved tracks, and user playlists backed by Firebase.
- Loading, empty, offline, unavailable-video, quota-exhausted, and authentication-error states.
- Keyboard operation, visible focus treatment, semantic controls, motion reduction, and suitable contrast.
- A maintainable build, test, and deployment setup.

### Excluded from the first production milestone

- Hidden extraction of audio from YouTube or downloading YouTube media.
- Spotify/Apple Music account linking.
- Native mobile applications.
- Collaborative playlists, social feeds, comments, lyrics synchronization, equalizers, and offline downloads.
- AI-generated recommendations beyond structured decade-aware catalog queries.

These exclusions keep the first release legally safer and focused on the experience demonstrated in the reference.

## Experience design

### Primary composition

The app fills the viewport with an era-specific tabletop collage. The visual hierarchy is:

1. A quiet brand lockup and universal-search trigger.
2. A large turntable as the primary playback object.
3. A timeline selector that remains visually stable while its labels, track, and active thumb animate between eras.
4. Era artifacts—magazines, cassettes, headphones, phones, photographs, tickets, stationery, and other period cues—arranged as layered scene elements.
5. A persistent, glass-like now-playing dock that contains the official YouTube surface, track metadata, progress, volume, queue access, favorite action, and transport controls.

The collage is decorative and must never block access to core controls. Decorative imagery will use empty alternative text and ignore pointer events unless it is intentionally interactive.

### Era behavior

Selecting a decade updates an `EraId` in application state. The outgoing scene softens and recedes; shared anchors such as the turntable, timeline, and player dock remain stable; incoming props reveal in staggered depth order. The new era triggers a cached recommendation request built from explicit, configurable search phrases such as “1940s jazz standards” or “2000s iconic pop songs.” Results populate a recommendation tray without automatically starting playback.

The playing track is independent of the selected era. This prevents accidental playback interruption while the user explores. Selecting a recommendation or search result adds it to the queue and begins playback.

### Search and discovery

Universal search opens as a responsive overlay or command palette rather than navigating away from the scene. It provides:

- debounced query input;
- recent searches stored locally;
- grouped results with artwork, title, channel, and duration when available;
- clear loading, no-results, quota, and network-error states;
- keyboard navigation and an explicit close action;
- actions to play now, add next, add to queue, or save.

On mobile the same surface becomes a bottom sheet. Search, recommendations, saved music, and queue share the same track-row component and action model.

### Responsive behavior

Desktop uses the wide tableau shown in the reference: turntable left/center, era timeline to the side, props filling the remaining field, and a bottom player dock. Mobile crops the experience intentionally rather than scaling the desktop composition. The turntable becomes the hero, the era control becomes horizontal, secondary props are reduced, and the player dock becomes a compact mini-player that expands into a full-screen now-playing sheet.

Breakpoints are layout decisions, not device assumptions. The experience must remain usable at 320 CSS pixels wide and at 200% browser zoom.

## Motion design

Motion is part of the product language and will be implemented as a coordinated system rather than isolated hover effects.

### Motion principles

- Use transform and opacity for continuous animation whenever possible.
- Use spring motion for directly manipulated elements such as the timeline thumb, sheets, and tonearm.
- Use short eased transitions for informational state changes such as result loading and control feedback.
- Preserve spatial continuity: shared controls do not disappear and re-enter during era transitions.
- Keep large scene changes interruptible so a rapid second era selection does not queue stale animations.
- Never animate playback progress through React renders; update it through an isolated subscription or animation frame.

### Choreography

- **Era change:** background color wash, 120–180 ms outgoing softening, then a 500–750 ms spring-based reposition/reveal with shallow stagger among props.
- **Timeline:** the active handle tracks dragging at pointer rate and settles to a decade using a low-bounce spring. Labels interpolate emphasis rather than reflowing.
- **Vinyl:** rotation uses a compositor animation. Start/stop eases simulate inertia; seeking or era changes do not reset the visual angle.
- **Tonearm:** moves between resting and playing angles around a fixed transform origin, with a restrained spring and no exaggerated bounce.
- **Search:** desktop overlay scales/fades from the search trigger; mobile sheet rises with velocity-aware spring behavior.
- **Track changes:** artwork and metadata use shared-layout transitions while controls remain stable.
- **Microinteractions:** buttons compress slightly on press, focus rings fade in without delay, saved-state confirmation uses a concise icon morph, and queue rows respond through color/translation only.

### Performance and accessibility budgets

- Target 60 frames per second during common transitions on a representative mid-range phone and laptop.
- Avoid animating layout properties across large subtrees.
- Cap simultaneously animated decorative layers and lower parallax intensity on small screens.
- Lazy-load non-current era imagery and prefetch only the adjacent era.
- Use responsive image formats and explicit dimensions to prevent layout shifts.
- Under `prefers-reduced-motion: reduce`, remove parallax, rotation, stagger, and travel; retain brief opacity changes so state remains understandable.
- Pause decorative animation when the document is hidden and when the relevant scene is outside the viewport.

## Technical architecture

### Client

The existing static files will be migrated to a Vite React TypeScript application. The client will be organized by feature rather than by file type:

```text
src/
  app/              app shell, routing, providers, error boundary
  components/       reusable controls and track presentation
  features/
    eras/            era definitions, scene layers, timeline
    player/          player adapter, transport, queue, progress
    search/          universal search state and UI
    library/         favorites and playlists
    auth/            Firebase authentication boundary
  services/          catalog gateway and Firebase adapters
  styles/            tokens, reset, typography, global motion rules
  test/              shared test utilities
```

State boundaries:

- Server/catalog state is managed through TanStack Query for caching, request cancellation, retry policy, and quota-friendly stale times.
- Ephemeral interface and player state use a small Zustand store with selectors to avoid broad rerenders.
- Firebase authentication and playlist subscriptions live behind typed adapters rather than being called directly from presentation components.
- Era definitions are data-driven so an additional decade can be added without changing player or search logic.

### Catalog gateway

A serverless endpoint will accept normalized search or recommendation requests and call YouTube Data API v3. Responsibilities include:

- allow-listed request shapes and bounded result counts;
- environment-based credentials;
- request normalization and cache keys;
- short-term response caching;
- consistent client-facing error codes;
- basic abuse controls supported by the selected host;
- omission of raw upstream errors and secrets from responses.

The initial endpoint contract is provider-neutral:

```ts
interface CatalogProvider {
  search(query: string, cursor?: string): Promise<CatalogPage>;
  recommendations(era: EraId, cursor?: string): Promise<CatalogPage>;
}
```

This permits a future licensed/free catalog provider without rebuilding the interface.

### Playback

The official YouTube IFrame Player API is wrapped by a `YouTubePlayerAdapter` that exposes application-specific events and commands. React components do not directly call global `YT` APIs. The adapter owns readiness, state translation, progress polling, unavailable-video handling, and teardown.

The app queue contains normalized `Track` records independent of the provider. Search results, era recommendations, and saved tracks all produce the same `Track` shape. Playback state and selected era remain separate.

### Persistence and authentication

Firebase Authentication continues to provide Google sign-in. Firestore stores user playlist records using stable provider IDs and normalized metadata. Firestore security rules must restrict each user to their own documents. Anonymous visitors can search, browse eras, maintain a session-local queue, and play music; sign-in is required only for cloud persistence.

The current hard-coded YouTube credential will be removed from client code and rotated before public deployment. Firebase browser configuration may remain client-visible as designed, while authorization is enforced by Firebase rules.

## Error handling

Failures should preserve the scene and the user’s existing queue:

- Search/network errors appear within the result surface with a retry action.
- Recommendation failures leave the selected era active and show curated local fallback copy rather than reverting the era.
- Quota exhaustion has a distinct message and disables additional remote queries for the current cooldown window.
- An unavailable video is skipped only after notifying the user; the queue remains intact.
- Player initialization failure exposes a retry control and diagnostic-safe message.
- Firebase errors do not block anonymous playback.
- The app shell has a final error boundary with a reload action.

Errors are logged through a replaceable client logger with sensitive values removed. Production monitoring is an integration point, not a hard dependency for the first milestone.

## Testing strategy

- **Unit tests:** era definitions, query construction, normalized catalog responses, queue operations, repeat/shuffle behavior, time formatting, and error mapping.
- **Component tests:** timeline keyboard/pointer interaction, search state, track actions, player controls, reduced-motion behavior, authentication states, and resilient empty/error displays.
- **Adapter tests:** YouTube API readiness/state mapping and Firebase repository behavior with controlled fakes at the adapter boundary.
- **End-to-end tests:** switch era and load recommendations, search and play, maintain playback while changing eras, manage a queue, save after authentication, recover from unavailable video, and exercise the mobile now-playing sheet.
- **Visual checks:** representative desktop and mobile screenshots for all four eras and reduced-motion mode.
- **Performance checks:** browser performance trace of era switching and search-sheet opening, plus automated checks for layout shift and major accessibility violations.

External calls are mocked in deterministic automated tests; a separate opt-in integration check verifies real provider configuration without running in the default test suite.

## Migration and delivery

Implementation will proceed in vertical slices:

1. Establish the typed application, test harness, tokens, and responsive shell.
2. Implement era data, timeline interaction, and reference-matched scenes using local placeholder artwork where licensed final assets are unavailable.
3. Build the normalized queue/player state and YouTube adapter.
4. Add the serverless catalog gateway, era recommendations, and universal search.
5. Add Firebase authentication and playlist persistence behind adapters and security rules.
6. Complete responsive motion, accessibility, error states, performance refinement, and deployment configuration.

Each slice must be independently testable. Existing functionality will not be copied wholesale into the new architecture; behavior is reintroduced through tests and typed boundaries. The existing site remains recoverable through version control while the new application is built.

## Acceptance checklist

- All four eras have distinct responsive scenes and working recommendations.
- The decade selector supports pointer, touch, and keyboard operation.
- Universal search can play or queue any returned YouTube track.
- Era switching does not stop the current track.
- Vinyl, tonearm, scene, overlay, and track-change animations follow the defined motion behavior.
- Reduced-motion mode removes continuous and spatially disruptive animation.
- No YouTube API key is shipped in the client bundle.
- Anonymous playback and authenticated persistence both work.
- Automated unit, component, end-to-end, accessibility, and production-build checks pass.
- Desktop and mobile visual reviews match the reference’s immersive, tactile quality without copying its branding or proprietary artwork.
