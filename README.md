<div align="center">

# 🎵 Daydreamin'
### *A futuristic, cloud-synced music streaming player*

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![YouTube](https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)

<br/>

> *"Music gives colour to the air of the moment."* — Karl Lagerfeld

<br/>

**Daydreamin'** is a full-stack web music player built from scratch — a futuristic, glassmorphism-styled streaming app that lets you search, play, and save songs from two live music sources, all synced to the cloud with personal playlists protected by Google authentication.

<br/>

[🌐 Live Demo](https://daydreamin-aries-player.web.app) · [🐛 Report a Bug](https://github.com/yourusername/daydreamin-player/issues) · [💡 Request a Feature](https://github.com/yourusername/daydreamin-player/issues)

</div>

---

## 📸 Preview

```
┌─────────────────────────────────────────────────────────┐
│  🎵 Daydreamin' | Music Player                          │
│  ─────────────────────────────────────────────────────  │
│  [ Jamendo ]  [ YouTube ]          👤 Signed in as...   │
│                                                         │
│         🔍 Search Across Daydreamin. . .                │
│                                                         │
│              ✦ ◉ Album Art ◉ ✦                         │
│           (spinning • glowing • dreamy)                 │
│                                                         │
│              Song Title                                 │
│           ARTIST NAME                                   │
│        [ + Add to Playlist ]                            │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░  progress bar               │
│  🔊 ──────●──────────                                   │
│      ⏮    ▶/⏸    ⏭                                     │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- 🎧 **Dual Streaming Sources** — Stream royalty-free tracks from Jamendo and any song from YouTube, all in one unified interface
- 🌈 **Futuristic UI** — Dark radial gradient background, glassmorphism cards, neon cyan glow accents, spinning animated album art with a glowing ring
- 📊 **Live Audio Visualizer** — Real-time frequency bar visualizer powered by the Web Audio API, anchored to the album art
- 🔐 **Google Sign-In** — One-click authentication so every user gets their own private account
- ☁️ **Personal Cloud Playlist** — Save any track (Jamendo or YouTube) to your personal Firestore playlist, visible only to you
- ⚡ **Real-time Sync** — Playlist updates instantly across all your devices via Firestore's `onSnapshot` listener — no refresh needed
- 📱 **Fully Responsive** — Adapts from a desktop side-by-side layout to a stacked, single-column mobile layout
- 🔊 **Full Playback Controls** — Play/Pause, Previous/Next, seek bar, and a styled volume slider for both players
- 🗑️ **Playlist Management** — Add and remove tracks from your personal playlist with one click
- 🏷️ **Source Badges** — Playlist entries are visually tagged with a 💿 disc icon for Jamendo and a 🔴 YouTube icon so you always know where a track came from

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| **Styling** | Custom CSS — glassmorphism, radial gradients, keyframe animations |
| **Authentication** | Firebase Authentication (Google Sign-In) |
| **Database** | Firebase Firestore (real-time NoSQL) |
| **Hosting** | Firebase Hosting |
| **Music Source 1** | Jamendo API v3 (free, legal, CC-licensed full-length tracks) |
| **Music Source 2** | YouTube Data API v3 + YouTube IFrame Player API |
| **Audio Visualizer** | Web Audio API — `AudioContext`, `AnalyserNode`, `Uint8Array`, HTML5 Canvas |
| **Icons** | Font Awesome 6 |
| **Fonts** | Space Grotesk (Google Fonts) |

---

## 🗺️ The Journey — How We Built This Step by Step

This project didn't start as what it is today. Here's the honest, full story of how it evolved from a static HTML/CSS shell into a deployed, authenticated, cloud-synced music player.

---

### 🏗️ Stage 1 — The Foundation (HTML + CSS)
The project began with two hand-crafted files: `index.html` and `style.css`.

The HTML laid out the skeleton — a music card with a circular album art container, a canvas element for the visualizer, progress bar, volume slider, navigation buttons, and a sidebar playlist panel. The CSS brought it to life with a `radial-gradient` dark background, `backdrop-filter: blur()` glassmorphism cards, CSS `@keyframes` for the spinning album art and gradient glow ring, and a neon cyan (`#00f2fe`) accent colour running consistently through every interactive element.

At this stage it was purely visual — beautiful, but completely static.

---

### ⚡ Stage 2 — Wiring the JavaScript (Core Player Logic)
The first version of `script.js` connected all the DOM elements to real behaviour:

- A **queue array** held the current list of playable track objects, with index-based prev/next navigation and modulo wrapping for circular traversal
- The **HTML5 `<audio>` element** handled actual audio decoding and playback — `play()`, `pause()`, `currentTime`, `duration`
- `timeupdate` events drove the progress bar width as a percentage of elapsed time
- A click handler on the progress container calculated seek position from the click's X offset relative to the bar's `getBoundingClientRect()`
- The **Web Audio API** was set up with an `AudioContext` and `AnalyserNode` connected between the audio source and destination, feeding a `Uint8Array` of frequency data to a `requestAnimationFrame` draw loop on the canvas visualizer
- Volume was wired to a styled range input, with the icon switching between `fa-volume-mute`, `fa-volume-down`, and `fa-volume-up` based on the level

---

### 🔥 Stage 3 — Firebase Integration (Cloud Playlist)
Firebase was integrated next. The app was already connected to a Firestore project, so the first step was wiring the "Add to Playlist" button to write track documents to a shared `playlist` collection, and using `onSnapshot` with `orderBy("createdAt", "desc")` to listen for changes in real time — meaning every addition or deletion reflects instantly across every connected browser without a single manual refresh.

Firestore security rules were added to validate incoming documents — ensuring every saved track has the required fields, a valid source value, and a non-empty title — blocking garbage writes without requiring authentication at this stage.

---

### 🔍 Stage 4 — Jamendo API (Live Music Search)
Rather than hardcoding songs, the player was connected to the **Jamendo API** — a library of Creative Commons and royalty-free music with full-length streaming support and a free developer tier.

A search box was added to the card. On submit, a `fetch()` call hits the Jamendo `/v3.0/tracks/` endpoint with the search term, and the results are rendered as a dropdown overlay. Clicking any result loads it into the queue and immediately begins playback. No subscriptions, no rights issues, fully legal for a non-commercial student project.

---

### 📺 Stage 5 — YouTube Tab (Official Embed)
The most-requested feature was being able to play real commercial tracks — Heroes Tonight, Top Fella, Karan Aujla — that simply don't exist in Jamendo's catalog.

The solution was a **dual-tab interface**: a "Jamendo" tab preserving the full circular art + visualizer experience, and a new "YouTube" tab with a styled 16:9 video frame powered by the **YouTube IFrame Player API**.

The YouTube Data API v3 provides search results (10 per query, filtered to music category). The IFrame API controls playback, progress, volume, and prev/next — all mirroring the Jamendo controls visually.

A critical bug discovered during this phase: building a `YT.Player` instance while its container div is `display:none` produces a broken, zero-size player that silently fails to load videos. The fix was lazy initialisation — the player is only created the moment the YouTube tab is first clicked and the container has real dimensions. A `ytPendingIndex` variable handles the race condition where a user clicks a search result before the player has fully mounted, queuing the track and auto-playing it the instant `onReady` fires.

---

### 🐛 Stage 6 — Bug Fixes (Three Real Issues)
Three real bugs were tracked down and fixed:

**1. Visualizer overlapping the search bar** — The canvas had a hardcoded `position: absolute; top: 110px` relative to the whole card. Adding the tab bar above the player pushed everything down while the canvas stayed pinned at 110px, causing overlap. Fixed by wrapping the canvas and album art in a shared `.art-stage` container and positioning the canvas relative to that wrapper using `transform: translate(-50%, -50%)` — permanently anchored regardless of what gets added above.

**2. YouTube pane unstyled** — The CSS rules for the search input and volume slider targeted only `#search-input` and `#volume-slider` by ID. The YouTube pane's equivalents (`#yt-search-input`, `#yt-volume-slider`) weren't covered, so they rendered as plain browser-default elements. Fixed by extending each selector to cover both IDs.

**3. YouTube tracks not playing after search** — Title and artist would populate (from the search API) but the video never started (from the embed API). The player was being constructed while the pane was hidden, giving it no real dimensions, resulting in a permanently broken player object. Fixed by the lazy-init pattern described above, combined with the `ytPlayerReady` flag ensuring `loadVideoById` and `playVideo` are only called once the player has genuinely finished mounting.

---

### 🔐 Stage 7 — Personal Playlists with Google Auth
The shared playlist was the original design, but it had an obvious problem: anyone with the link could see, add to, or delete from everybody else's list.

**Firebase Authentication** was added with Google Sign-In as the provider. The Firestore data structure was restructured from a flat `playlist/{trackId}` collection to a hierarchical `users/{uid}/playlist/{trackId}` subcollection, scoping every playlist entirely to its owner's user ID.

The UI gained a frosted-glass auth bar pinned to the top of the viewport — showing a "Sign in with Google" button when signed out, and the user's avatar, display name, and a sign-out button when signed in. The playlist panel shows a prompt instead of tracks until the user is authenticated. Firestore security rules were rewritten to enforce server-side ownership checks (`request.auth.uid == userId`) so the isolation is enforced at the database level, not just the UI.

The `onSnapshot` listener is now started and stopped in the `onAuthStateChanged` callback, so switching accounts immediately tears down the old listener and starts a fresh one scoped to the new user — no stale data ever leaks between accounts.

---

### 📱 Stage 8 — Mobile Responsiveness
The fixed-width cards (`360px` player, `420px` playlist) caused horizontal scrolling on phones. A `@media (max-width: 820px)` breakpoint was added that:

- Switches the `.main-wrapper` from `flex-direction: row` to `flex-direction: column`
- Makes both cards fluid-width (`width: 100%`) with a `max-width` cap
- Scales the album art and visualizer down slightly
- A second breakpoint at `360px` handles very small phones
- `body { height: 100vh }` was changed to `min-height: 100vh` so the stacked layout can scroll vertically rather than clipping

---

### 🚀 Stage 9 — Deployment (Firebase Hosting)
The site was deployed to Firebase Hosting via the Firebase CLI, after resolving a Windows 11 PowerShell execution policy issue (`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`) that was blocking npm scripts from running.

The `firebase init hosting` setup configured `.` as the public directory (files at project root, no build step), declined single-page-app rewrites and GitHub Actions auto-deploy. `firebase deploy --only firestore:rules,hosting` pushed both the Firestore rules and the static site in one command.

The YouTube API key was restricted in Google Cloud Console to the live domain via HTTP referrer restrictions (Websites → `https://daydreamin-aries-player.web.app/*`) to prevent quota theft.

---

## 📁 Project Structure

```
daydreamin-player/
│
├── index.html          # App shell, DOM structure, auth bar, both player panes
├── style.css           # All styling — glassmorphism, animations, responsive layout
├── script.js           # All logic — auth, Jamendo, YouTube, Firestore, visualizer
├── firestore.rules     # Firestore security rules — per-user playlist isolation
└── README.md           # You are here 👋
```

---

## 🚀 Getting Started

### Prerequisites
- A free [Firebase](https://firebase.google.com) project with Firestore and Authentication enabled
- A free [Jamendo Developer](https://devportal.jamendo.com/) account for the API client ID
- A free [Google Cloud](https://console.cloud.google.com/) project with the **YouTube Data API v3** enabled

### Setup

**1. Clone the repo**
```bash
git clone https://github.com/yourusername/daydreamin-player.git
cd daydreamin-player
```

**2. Add your API keys** in `script.js`:
```javascript
const JAMENDO_CLIENT_ID = "your_jamendo_client_id_here";
const YOUTUBE_API_KEY   = "your_youtube_api_key_here";
```

**3. Replace the Firebase config** in `script.js` with your own project's config (from Firebase Console → Project Settings):
```javascript
const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    ...
};
```

**4. Enable Google Sign-In** in Firebase Console → Authentication → Sign-in method → Google → Enable

**5. Deploy Firestore rules**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

**6. Run locally**

Use VS Code's [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension or:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` — **not** via `file://`, as the YouTube IFrame API requires a real HTTP origin.

**7. Deploy to Firebase Hosting** *(optional)*
```bash
firebase init hosting
firebase deploy --only hosting
```

---

## 🔑 API Reference

| API | Purpose | Free Tier |
|---|---|---|
| [Jamendo API v3](https://developer.jamendo.com/v3.0) | Search + stream CC-licensed full tracks | ✅ Unlimited non-commercial |
| [YouTube Data API v3](https://developers.google.com/youtube/v3) | Search music videos | ✅ 10,000 units/day |
| [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) | Official embedded video playback | ✅ Free |
| [Firebase Firestore](https://firebase.google.com/docs/firestore) | Real-time personal playlist storage | ✅ Spark plan free tier |
| [Firebase Auth](https://firebase.google.com/docs/auth) | Google Sign-In | ✅ Always free |
| [Firebase Hosting](https://firebase.google.com/docs/hosting) | Static site deployment | ✅ Spark plan free tier |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│   index.html + style.css + script.js (ES Modules)          │
│                                                             │
│   ┌──────────────┐      ┌──────────────────────────────┐   │
│   │ Jamendo Pane │      │       YouTube Pane           │   │
│   │              │      │                              │   │
│   │ fetch() ──►  │      │  YT Data API (search)        │   │
│   │ Jamendo API  │      │  YT IFrame API (playback)    │   │
│   │              │      │                              │   │
│   │ <audio> tag  │      │  YT.Player instance          │   │
│   │ Web Audio API│      │  (lazy-init on tab click)    │   │
│   │ Canvas viz   │      │                              │   │
│   └──────────────┘      └──────────────────────────────┘   │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │               Firebase SDK (modular)                │  │
│   │                                                     │  │
│   │  getAuth() ──► GoogleAuthProvider ──► signIn popup  │  │
│   │  onAuthStateChanged ──► start/stop onSnapshot       │  │
│   │  users/{uid}/playlist ──► addDoc / deleteDoc        │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Firebase Cloud   │
                    │                   │
                    │  Authentication   │
                    │  Firestore DB     │
                    │  Hosting CDN      │
                    └───────────────────┘
```

---

## 🔒 Security

- Firestore rules enforce **server-side ownership** — a user can only read, create, or delete documents inside their own `users/{uid}/playlist/` subcollection. No UI trick can bypass this.
- `allow update: if false` prevents any in-place modification of saved track documents.
- `allow create` validates the document shape before writing — required fields, valid source values, non-empty title — blocking malformed or spam documents.
- YouTube and Jamendo API keys should be **restricted by HTTP referrer** in their respective consoles before sharing the live URL publicly.

---

## ⚠️ Important Notes

- **Non-commercial use only.** Jamendo's free API tier is licensed for non-commercial use. YouTube's IFrame API allows ad-supported embedding but does not permit charging users for access to embedded content or blocking YouTube's own ads. This project is built for personal and educational use.
- **YouTube quota.** The free YouTube Data API tier allows 10,000 units/day (~100 searches). For a small friend group this is ample; for wider public use you'd need to apply for a quota increase via Google Cloud Console.
- **Embedding restrictions.** Some YouTube videos have embedding disabled by their uploaders (error codes 101/150 in the console). This is a per-video rights decision by the uploader and cannot be worked around.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 🙏 Acknowledgements

- [Jamendo](https://www.jamendo.com/) for providing free, legal, full-length music streaming for independent artists
- [Firebase](https://firebase.google.com/) for the entire backend — auth, database, and hosting — all on the free tier
- [Font Awesome](https://fontawesome.com/) for the icons
- [Google Fonts](https://fonts.google.com/) — Space Grotesk for the clean, modern typography
- Everyone who listened to the demo in class 🎶

---

<div align="center">

Made with 🎵 and a lot of ☕

**Daydreamin'** — *because great music deserves a great player.*

</div>
