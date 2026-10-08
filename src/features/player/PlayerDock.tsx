import { BookmarkPlus, ChevronUp, ListMusic, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward, Trash2, Volume2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { formatTime } from "./time";
import { usePlayerStore } from "./playerStore";
import { YouTubePlayer } from "./YouTubePlayer";
import type { PlayerAdapter, PlayerEvent } from "./YouTubePlayerAdapter";
import { getTrackKey, type Track } from "./types";
import styles from "./PlayerDock.module.css";

interface PlayerDockProps { player?: PlayerAdapter; onSave?: (track: Track) => void; }

export function applyPlaybackEvent(event: PlayerEvent, adapter: PlayerAdapter | null): void {
  const state = usePlayerStore.getState();
  if (event.type === "progress") state.setProgress(event.currentTime, event.duration);
  else if (event.type === "unavailable") state.setError("Track unavailable");
  else if (state.queue.length === 0 || state.currentIndex < 0) state.setStatus("idle");
  else if (event.status === "ready" && state.status === "paused") return;
  else if (event.status === "ended") {
    if (state.repeat === "one") {
      adapter?.seekTo(0);
      state.setProgress(0, state.duration);
      state.setStatus("playing");
      adapter?.play();
    } else state.next();
  } else state.setStatus(event.status);
}

export function PlayerDock({ player, onSave }: PlayerDockProps) {
  const reduceMotion = useReducedMotion();
  const [adapter, setAdapter] = useState<PlayerAdapter | null>(player ?? null);
  const adapterRef = useRef<PlayerAdapter | null>(player ?? null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const error = usePlayerStore((state) => state.error);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const repeat = usePlayerStore((state) => state.repeat);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const selectQueueIndex = usePlayerStore((state) => state.selectQueueIndex);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setError = usePlayerStore((state) => state.setError);
  const track = queue[currentIndex];
  const isPlaying = status === "playing" || status === "loading";

  useEffect(() => { adapterRef.current = adapter; }, [adapter]);

  useEffect(() => {
    const media = window.matchMedia?.("(max-width: 800px)");
    if (!media) return;
    const revealVideo = () => {
      if (media.matches && track && isPlaying) setExpanded(true);
    };
    revealVideo();
    media.addEventListener("change", revealVideo);
    return () => media.removeEventListener("change", revealVideo);
  }, [isPlaying, track]);

  useEffect(() => {
    if (!adapter) return;
    if (status === "playing") adapter.play();
    if (status === "paused") adapter.pause();
  }, [adapter, status]);

  useEffect(() => {
    adapter?.setVolume(volume);
  }, [adapter, volume]);

  const handlePlayerEvent = useCallback((event: PlayerEvent) => {
    applyPlaybackEvent(event, adapterRef.current);
  }, []);

  function togglePlayback() {
    if (!track) return;
    if (isPlaying) {
      setStatus("paused");
    } else {
      setStatus("playing");
    }
  }

  function tryNext() {
    setError(null);
    next();
  }

  function goPrevious() {
    const before = usePlayerStore.getState().currentIndex;
    previous(currentTime);
    const after = usePlayerStore.getState();
    if (after.currentIndex === before && after.currentTime === 0) adapter?.seekTo(0);
  }

  function toggleExpanded() {
    if (expanded && isPlaying) setStatus("paused");
    setExpanded((value) => !value);
  }

  function openQueue() {
    if (expanded && window.matchMedia?.("(max-width: 800px)").matches) {
      if (isPlaying) setStatus("paused");
      setExpanded(false);
    }
    setQueueOpen(true);
  }

  function removeQueueItem(item: Track, index: number) {
    const removingCurrent = index === usePlayerStore.getState().currentIndex;
    if (removingCurrent && queue.length === 1) adapter?.pause();
    removeFromQueue(getTrackKey(item));
  }

  return (
    <motion.div
      className={styles.dock}
      data-expanded={String(expanded)}
      initial={false}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 29 }}
    >
      <YouTubePlayer
        track={track}
        externalAdapter={player}
        autoplay={status !== "paused" && status !== "idle"}
        onAdapter={setAdapter}
        onEvent={handlePlayerEvent}
      />

      <div className={styles.trackInfo}>
        {track?.artwork ? <img src={track.artwork} alt="" /> : <span className={styles.artPlaceholder} />}
        <div><strong>{track?.title ?? "Nothing playing"}</strong><span>{track?.artist ?? "Choose a recommendation or search"}</span></div>
      </div>

      <div className={styles.transport}>
        <button type="button" onClick={goPrevious} aria-label="Previous track"><SkipBack /></button>
        <button className={styles.primary} type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"} disabled={!track}>
          {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <button type="button" onClick={next} aria-label="Next track"><SkipForward /></button>
      </div>

      <div className={styles.progress}>
        <input
          type="range"
          min="0"
          max={Math.max(duration, 1)}
          value={Math.min(currentTime, Math.max(duration, 1))}
          onChange={(event) => { const value = Number(event.target.value); adapter?.seekTo(value); setProgress(value, duration); }}
          aria-label="Seek"
        />
        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div className={styles.utilities}>
        <button type="button" onClick={toggleShuffle} aria-label="Shuffle" aria-pressed={shuffle}><Shuffle size={17} /></button>
        <button type="button" onClick={cycleRepeat} aria-label={`Repeat: ${repeat}`} aria-pressed={repeat !== "off"}><Repeat2 size={17} /></button>
        <button type="button" onClick={() => track && onSave?.(track)} aria-label="Save current track" disabled={!track || !onSave}><BookmarkPlus size={17} /></button>
        <label className={styles.volume}><Volume2 size={17} /><input type="range" min="0" max="100" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); adapter?.setVolume(value); }} aria-label="Volume" /></label>
        <button type="button" onClick={openQueue} aria-label="Show queue"><ListMusic /></button>
        <button className={styles.expand} type="button" onClick={toggleExpanded} aria-label={expanded ? "Collapse player" : "Expand player"} aria-expanded={expanded}><ChevronUp /></button>
      </div>

      {error && <div className={styles.playerError} role="alert"><span>{error}</span><button type="button" onClick={tryNext}>Try next</button></div>}

      <AnimatePresence>
        {queueOpen && (
          <motion.aside
            className={styles.queue}
            role="dialog"
            aria-label="Playback queue"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
          >
            <header><h2>Up next</h2><button type="button" onClick={() => setQueueOpen(false)} aria-label="Close queue"><X /></button></header>
            <ol>{queue.map((item, index) => <li key={`${item.provider}:${item.id}`} data-current={String(index === currentIndex)}><button type="button" onClick={() => selectQueueIndex(index)}><span>{item.title}</span><small>{item.artist}</small></button><button className={styles.remove} type="button" onClick={() => removeQueueItem(item, index)} aria-label={`Remove ${item.title} from queue`}><Trash2 size={16} /></button></li>)}</ol>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
