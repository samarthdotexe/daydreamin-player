import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ---------------------------------------------------------
   1. FIREBASE INIT
--------------------------------------------------------- */
const firebaseConfig = {
    apiKey: "AIzaSyC26R0_MW5frdoAR9L-SPyNPxjmW0H-smE",
    authDomain: "daydreamin-aries-player.firebaseapp.com",
    projectId: "daydreamin-aries-player",
    storageBucket: "daydreamin-aries-player.firebasestorage.app",
    messagingSenderId: "1083939773311",
    appId: "1:1083939773311:web:3ce88681723bc7a048d84a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("⚡ Standard Cloud Instance Initialized");

const playlistCol = collection(db, "playlist");

/* ---------------------------------------------------------
   2. JAMENDO API CONFIG
--------------------------------------------------------- */
const JAMENDO_CLIENT_ID = "a9af72ac";
const JAMENDO_SEARCH_URL = "https://api.jamendo.com/v3.0/tracks/";

/* ---------------------------------------------------------
   3. DOM REFERENCES
--------------------------------------------------------- */
const musicContainer = document.getElementById("music-container");
const cover = document.getElementById("cover");
const titleEl = document.getElementById("title");
const artistEl = document.getElementById("artist");
const audio = document.getElementById("audio");

const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");

const volumeSlider = document.getElementById("volume-slider");
const volumeIcon = document.getElementById("volume-icon");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const searchResultsEl = document.getElementById("search-results");

const saveTrackBtn = document.getElementById("save-track-btn");
const playlistTracksEl = document.getElementById("playlist-tracks");

const visualizerCanvas = document.getElementById("visualizer");
const vizCtx = visualizerCanvas.getContext("2d");

/* ---------------------------------------------------------
   4. STATE
--------------------------------------------------------- */
let queue = [];
let queueIndex = 0;
let currentTrack = null;
let isPlaying = false;
let savedPlaylist = [];
/* ---------------------------------------------------------
   5. LOAD / PLAY TRACK
--------------------------------------------------------- */
function loadTrack(track) {
    currentTrack = track;
    titleEl.textContent = track.title || "Unknown Title";
    artistEl.textContent = track.artist || "Unknown Artist";
    cover.src = track.image || "image1.jpg";
    audio.src = track.audioUrl;
    progressBar.style.width = "0%";
}

function playTrack() {
    if (!currentTrack) return;
    audio.play().catch(err => console.warn("Playback blocked:", err));
    isPlaying = true;
    musicContainer.classList.add("play");
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    startVisualizer();
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    musicContainer.classList.remove("play");
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
}

function togglePlay() {
    if (!currentTrack) return;
    isPlaying ? pauseTrack() : playTrack();
}

function playFromQueue(index) {
    if (!queue.length) return;
    queueIndex = (index + queue.length) % queue.length;
    loadTrack(queue[queueIndex]);
    playTrack();
}

function nextTrack() {
    if (!queue.length) return;
    playFromQueue(queueIndex + 1);
}

function prevTrack() {
    if (!queue.length) return;

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }
    playFromQueue(queueIndex - 1);
}

playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
audio.addEventListener("ended", nextTrack);

/* ---------------------------------------------------------
   6. PROGRESS BAR
--------------------------------------------------------- */
audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${pct}%`;
});

progressContainer.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    audio.currentTime = (clickX / rect.width) * audio.duration;
});

/* ---------------------------------------------------------
   7. VOLUME
--------------------------------------------------------- */
audio.volume = volumeSlider.value / 100;

volumeSlider.addEventListener("input", () => {
    const v = volumeSlider.value / 100;
    audio.volume = v;
    updateVolumeIcon(v);
});

function updateVolumeIcon(v) {
    volumeIcon.className = "fas " + (
        v === 0 ? "fa-volume-mute" :
            v < 0.5 ? "fa-volume-down" :
                "fa-volume-up"
    );
}

/* ---------------------------------------------------------
   8. WEB AUDIO VISUALIZER
--------------------------------------------------------- */
let audioCtx, analyser, sourceNode, freqData;

function setupAudioGraph() {
    if (audioCtx) return; // only do this once
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    freqData = new Uint8Array(analyser.frequencyBinCount);

    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function startVisualizer() {
    setupAudioGraph();
    if (audioCtx.state === "suspended") audioCtx.resume();
    drawVisualizer();
}

function drawVisualizer() {
    if (!isPlaying) return;
    requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(freqData);
    vizCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

    const barWidth = visualizerCanvas.width / freqData.length;
    for (let i = 0; i < freqData.length; i++) {
        const barHeight = (freqData[i] / 255) * visualizerCanvas.height;
        vizCtx.fillStyle = "rgba(0, 242, 254, 0.6)";
        vizCtx.fillRect(i * barWidth, visualizerCanvas.height - barHeight, barWidth - 1, barHeight);
    }
}

/* ---------------------------------------------------------
   9. SEARCH (Jamendo)
--------------------------------------------------------- */
async function searchTracks(term) {
    if (!term.trim()) return;

    searchResultsEl.innerHTML = `<div style="padding:10px;color:#a0a0b5;font-size:12px;">Searching...</div>`;
    searchResultsEl.classList.remove("hidden");

    const url = `${JAMENDO_SEARCH_URL}?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=10&namesearch=${encodeURIComponent(term)}&audioformat=mp32`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.results || !data.results.length) {
            searchResultsEl.innerHTML = `<div style="padding:10px;color:#a0a0b5;font-size:12px;">No results found.</div>`;
            return;
        }

        queue = data.results.map(t => ({
            id: t.id,
            title: t.name,
            artist: t.artist_name,
            image: t.album_image || t.image,
            audioUrl: t.audio
        }));

        renderSearchResults(queue);
    } catch (err) {
        console.error("Jamendo search failed:", err);
        searchResultsEl.innerHTML = `<div style="padding:10px;color:#ff6b6b;font-size:12px;">Search failed. Check your Jamendo client_id.</div>`;
    }
}

function renderSearchResults(tracks) {
    searchResultsEl.innerHTML = "";
    tracks.forEach((track, idx) => {
        const item = document.createElement("div");
        item.style.cssText = `
            display:flex; align-items:center; gap:10px;
            padding:8px; border-radius:6px; cursor:pointer;
            transition: background 0.2s;
        `;
        item.innerHTML = `
            <img src="${track.image}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;" />
            <div style="flex:1; overflow:hidden;">
                <div style="color:#fff; font-size:12px; font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${track.title}</div>
                <div style="color:#a0a0b5; font-size:11px;">${track.artist}</div>
            </div>
        `;
        item.addEventListener("mouseenter", () => item.style.background = "rgba(0,242,254,0.1)");
        item.addEventListener("mouseleave", () => item.style.background = "transparent");
        item.addEventListener("click", () => {
            playFromQueue(idx);
            searchResultsEl.classList.add("hidden");
            searchInput.value = "";
        });
        searchResultsEl.appendChild(item);
    });
}

searchBtn.addEventListener("click", () => searchTracks(searchInput.value));
searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchTracks(searchInput.value);
});

// hide dropdown when clicking elsewhere
document.addEventListener("click", (e) => {
    if (!searchResultsEl.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
        searchResultsEl.classList.add("hidden");
    }
});

/* ---------------------------------------------------------
   10. CLOUD PLAYLIST (Firestore)
--------------------------------------------------------- */
saveTrackBtn.addEventListener("click", async () => {
    if (!currentTrack) return;
    try {
        await addDoc(playlistCol, {
            source: "jamendo",
            title: currentTrack.title,
            artist: currentTrack.artist,
            image: currentTrack.image,
            audioUrl: currentTrack.audioUrl,
            sourceId: currentTrack.id,
            createdAt: serverTimestamp()
        });
        saveTrackBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
            saveTrackBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Playlist';
        }, 1500);
    } catch (err) {
        console.error("Failed to save track:", err);
    }
});

function renderPlaylist(tracks) {
    if (!tracks.length) {
        playlistTracksEl.innerHTML = `<li class="empty-playlist-msg">No songs saved yet. Add some tracks!</li>`;
        return;
    }

    playlistTracksEl.innerHTML = "";
    tracks.forEach((track, idx) => {
        const li = document.createElement("li");
        li.className = "playlist-item";
        const badge = track.source === "youtube"
            ? '<i class="fab fa-youtube" style="color:#ff4444;font-size:10px;margin-right:5px;"></i>'
            : '<i class="fas fa-compact-disc" style="color:#00f2fe;font-size:10px;margin-right:5px;"></i>';
        li.innerHTML = `
            <img src="${track.image}" alt="${track.title}">
            <div class="playlist-item-info">
                <p class="playlist-item-title">${badge}${track.title}</p>
                <p class="playlist-item-artist">${track.artist}</p>
            </div>
            <button class="action-btn" title="Remove" data-id="${track.docId}" style="font-size:14px;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        li.addEventListener("click", (e) => {
            if (e.target.closest("button")) return; // ignore delete clicks
            playSavedTrack(tracks, idx);
        });
        li.querySelector("button").addEventListener("click", async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            try {
                await deleteDoc(doc(db, "playlist", id));
            } catch (err) {
                console.error("Failed to delete track:", err);
            }
        });
        playlistTracksEl.appendChild(li);
    });
}


function playSavedTrack(tracks, idx) {
    const track = tracks[idx];

    if (track.source === "youtube") {
        switchSource("youtube");
        ytQueue = tracks
            .filter(t => t.source === "youtube")
            .map(t => ({ videoId: t.sourceId, title: t.title, channel: t.artist, thumb: t.image }));
        const newIndex = ytQueue.findIndex(t => t.videoId === track.sourceId);
        loadYtTrack(newIndex >= 0 ? newIndex : 0);
        if (ytPlayerReady && typeof ytPlayer.playVideo === "function") ytPlayer.playVideo();
    } else {
        switchSource("jamendo");
        queue = tracks
            .filter(t => t.source !== "youtube")
            .map(t => ({ id: t.sourceId, title: t.title, artist: t.artist, image: t.image, audioUrl: t.audioUrl }));
        const newIndex = queue.findIndex(t => t.id === track.sourceId);
        playFromQueue(newIndex >= 0 ? newIndex : 0);
    }
}


const playlistQuery = query(playlistCol, orderBy("createdAt", "desc"));
onSnapshot(playlistQuery, (snapshot) => {
    savedPlaylist = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    renderPlaylist(savedPlaylist);
});

/* ---------------------------------------------------------
   11. SOURCE TABS (Jamendo <-> YouTube)
--------------------------------------------------------- */
const tabJamendo = document.getElementById("tab-jamendo");
const tabYoutube = document.getElementById("tab-youtube");
const jamendoPane = document.getElementById("jamendo-pane");
const youtubePane = document.getElementById("youtube-pane");

function switchSource(source) {
    const toYoutube = source === "youtube";
    tabJamendo.classList.toggle("active", !toYoutube);
    tabYoutube.classList.toggle("active", toYoutube);
    jamendoPane.classList.toggle("hidden", toYoutube);
    youtubePane.classList.toggle("hidden", !toYoutube);

    if (toYoutube) {
        pauseTrack();
        initYtPlayer();
    } else if (ytPlayer && typeof ytPlayer.pauseVideo === "function") {
        ytPlayer.pauseVideo();
    }
}

tabJamendo.addEventListener("click", () => switchSource("jamendo"));
tabYoutube.addEventListener("click", () => switchSource("youtube"));

/* ---------------------------------------------------------
   12. YOUTUBE — DATA API SEARCH + IFRAME PLAYER
--------------------------------------------------------- */
const YOUTUBE_API_KEY = "AIzaSyBVm-syG4PJ5m0vr7Cl_q3Ohh6kxRZMgws";
const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const ytSearchInput = document.getElementById("yt-search-input");
const ytSearchBtn = document.getElementById("yt-search-btn");
const ytResultsEl = document.getElementById("yt-search-results");
const ytTitleEl = document.getElementById("yt-title");
const ytArtistEl = document.getElementById("yt-artist");
const ytPlayBtn = document.getElementById("yt-play-btn");
const ytPrevBtn = document.getElementById("yt-prev-btn");
const ytNextBtn = document.getElementById("yt-next-btn");
const ytProgressContainer = document.getElementById("yt-progress-container");
const ytProgressBar = document.getElementById("yt-progress-bar");
const ytVolumeSlider = document.getElementById("yt-volume-slider");
const ytVolumeIcon = document.getElementById("yt-volume-icon");
const ytSaveTrackBtn = document.getElementById("yt-save-track-btn");

let ytPlayer = null;
let ytQueue = [];
let ytQueueIndex = 0;
let ytIsPlaying = false;
let ytProgressTimer = null;
let ytApiReady = false;
let ytPlayerReady = false;
let ytPendingIndex = null;

window.onYouTubeIframeAPIReady = function () {
    ytApiReady = true;
    if (!youtubePane.classList.contains("hidden")) {
        initYtPlayer();
    }
};

function initYtPlayer() {
    if (ytPlayer || !ytApiReady) return;
    ytPlayer = new YT.Player("yt-player", {
        height: "100%",
        width: "100%",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
            onReady: () => {
                ytPlayerReady = true;
                ytPlayer.setVolume(ytVolumeSlider.value);

                if (ytPendingIndex !== null) {
                    const idx = ytPendingIndex;
                    ytPendingIndex = null;
                    loadYtTrack(idx);
                    ytPlayer.playVideo();
                } else if (ytQueue.length) {
                    loadYtTrack(ytQueueIndex);
                }
            },
            onError: (e) => {
                console.error("YouTube player error code:", e.data);
            },
            onStateChange: onYtStateChange
        }
    });
}

function onYtStateChange(e) {
    if (e.data === YT.PlayerState.PLAYING) {
        ytIsPlaying = true;
        ytPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startYtProgressTimer();
    } else if (e.data === YT.PlayerState.PAUSED) {
        ytIsPlaying = false;
        ytPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopYtProgressTimer();
    } else if (e.data === YT.PlayerState.ENDED) {
        ytIsPlaying = false;
        ytPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
        stopYtProgressTimer();
        ytNextTrack();
    }
}

function startYtProgressTimer() {
    stopYtProgressTimer();
    ytProgressTimer = setInterval(() => {
        if (!ytPlayer || typeof ytPlayer.getDuration !== "function") return;
        const dur = ytPlayer.getDuration();
        const cur = ytPlayer.getCurrentTime();
        if (dur > 0) ytProgressBar.style.width = `${(cur / dur) * 100}%`;
    }, 300);
}

function stopYtProgressTimer() {
    if (ytProgressTimer) clearInterval(ytProgressTimer);
}

ytProgressContainer.addEventListener("click", (e) => {
    if (!ytPlayer || typeof ytPlayer.getDuration !== "function") return;
    const dur = ytPlayer.getDuration();
    if (!dur) return;
    const rect = ytProgressContainer.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    ytPlayer.seekTo(dur * pct, true);
});

ytVolumeSlider.addEventListener("input", () => {
    const v = Number(ytVolumeSlider.value);
    if (ytPlayer && typeof ytPlayer.setVolume === "function") ytPlayer.setVolume(v);
    ytVolumeIcon.className = "fas " + (
        v === 0 ? "fa-volume-mute" :
            v < 50 ? "fa-volume-down" :
                "fa-volume-up"
    );
});

function loadYtTrack(index) {
    if (!ytQueue.length) return;
    ytQueueIndex = (index + ytQueue.length) % ytQueue.length;
    const track = ytQueue[ytQueueIndex];
    ytTitleEl.textContent = track.title;
    ytArtistEl.textContent = track.channel;
    ytProgressBar.style.width = "0%";

    if (ytPlayer && ytPlayerReady && typeof ytPlayer.loadVideoById === "function") {
        ytPlayer.loadVideoById(track.videoId);
    } else {

        ytPendingIndex = ytQueueIndex;
        initYtPlayer();
        console.warn("YouTube player not ready yet — will auto-play once it finishes loading.");
    }
}

function ytTogglePlay() {
    if (!ytPlayer) return;
    if (ytIsPlaying) ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
}

function ytNextTrack() {
    if (!ytQueue.length) return;
    loadYtTrack(ytQueueIndex + 1);
}

function ytPrevTrack() {
    if (!ytQueue.length) return;
    if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getCurrentTime() > 3) {
        ytPlayer.seekTo(0, true);
        return;
    }
    loadYtTrack(ytQueueIndex - 1);
}

ytPlayBtn.addEventListener("click", ytTogglePlay);
ytNextBtn.addEventListener("click", ytNextTrack);
ytPrevBtn.addEventListener("click", ytPrevTrack);

ytSaveTrackBtn.addEventListener("click", async () => {
    if (!ytQueue.length || !ytQueue[ytQueueIndex]) return;
    const track = ytQueue[ytQueueIndex];
    try {
        await addDoc(playlistCol, {
            source: "youtube",
            title: track.title,
            artist: track.channel,
            image: track.thumb,
            audioUrl: "", // not used for YouTube entries
            sourceId: track.videoId,
            createdAt: serverTimestamp()
        });
        ytSaveTrackBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
            ytSaveTrackBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Playlist';
        }, 1500);
    } catch (err) {
        console.error("Failed to save YouTube track:", err);
    }
});

async function searchYoutube(term) {
    if (!term.trim()) return;

    ytResultsEl.innerHTML = `<div style="padding:10px;color:#a0a0b5;font-size:12px;">Searching...</div>`;
    ytResultsEl.classList.remove("hidden");

    const url = `${YOUTUBE_SEARCH_URL}?part=snippet&type=video&videoCategoryId=10&maxResults=10&q=${encodeURIComponent(term)}&key=${YOUTUBE_API_KEY}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.items || !data.items.length) {
            ytResultsEl.innerHTML = `<div style="padding:10px;color:#a0a0b5;font-size:12px;">No results found.</div>`;
            return;
        }

        ytQueue = data.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails?.default?.url
        }));

        renderYtResults(ytQueue);
    } catch (err) {
        console.error("YouTube search failed:", err);
        ytResultsEl.innerHTML = `<div style="padding:10px;color:#ff6b6b;font-size:12px;">Search failed. Check your YouTube API key.</div>`;
    }
}

function renderYtResults(tracks) {
    ytResultsEl.innerHTML = "";
    tracks.forEach((track, idx) => {
        const item = document.createElement("div");
        item.style.cssText = `
            display:flex; align-items:center; gap:10px;
            padding:8px; border-radius:6px; cursor:pointer;
            transition: background 0.2s;
        `;
        item.innerHTML = `
            <img src="${track.thumb}" style="width:32px;height:32px;border-radius:4px;object-fit:cover;" />
            <div style="flex:1; overflow:hidden;">
                <div style="color:#fff; font-size:12px; font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${track.title}</div>
                <div style="color:#a0a0b5; font-size:11px;">${track.channel}</div>
            </div>
        `;
        item.addEventListener("mouseenter", () => item.style.background = "rgba(0,242,254,0.1)");
        item.addEventListener("mouseleave", () => item.style.background = "transparent");
        item.addEventListener("click", () => {
            loadYtTrack(idx);
            if (ytPlayerReady && typeof ytPlayer.playVideo === "function") ytPlayer.playVideo();
            ytResultsEl.classList.add("hidden");
            ytSearchInput.value = "";
        });
        ytResultsEl.appendChild(item);
    });
}

ytSearchBtn.addEventListener("click", () => searchYoutube(ytSearchInput.value));
ytSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchYoutube(ytSearchInput.value);
});

document.addEventListener("click", (e) => {
    if (!ytResultsEl.contains(e.target) && e.target !== ytSearchInput && e.target !== ytSearchBtn) {
        ytResultsEl.classList.add("hidden");
    }
});

/* ---------------------------------------------------------
   13. INITIAL STATE
--------------------------------------------------------- */
updateVolumeIcon(audio.volume);
