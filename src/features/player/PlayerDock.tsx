import { ChevronUp, ListMusic, Pause, Play, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { formatTime } from "./time";
import { usePlayerStore } from "./playerStore";
import { YouTubePlayer } from "./YouTubePlayer";
import type { PlayerAdapter, PlayerEvent } from "./YouTubePlayerAdapter";
import styles from "./PlayerDock.module.css";

interface PlayerDockProps { player?: PlayerAdapter; }

export function PlayerDock({ player }: PlayerDockProps) {
  const reduceMotion = useReducedMotion();
  const [adapter, setAdapter] = useState<PlayerAdapter | null>(player ?? null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const queue = usePlayerStore((state) => state.queue);
  const currentIndex = usePlayerStore((state) => state.currentIndex);
  const status = usePlayerStore((state) => state.status);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const error = usePlayerStore((state) => state.error);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const selectQueueIndex = usePlayerStore((state) => state.selectQueueIndex);
  const setStatus = usePlayerStore((state) => state.setStatus);
  const setProgress = usePlayerStore((state) => state.setProgress);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setError = usePlayerStore((state) => state.setError);
  const track = queue[currentIndex];
  const isPlaying = status === "playing" || status === "loading";

  useEffect(() => {
    if (!adapter) return;
    if (status === "playing") adapter.play();
    if (status === "paused") adapter.pause();
  }, [adapter, status]);

  useEffect(() => {
    adapter?.setVolume(volume);
  }, [adapter, volume]);

  const handlePlayerEvent = useCallback((event: PlayerEvent) => {
    if (event.type === "status") setStatus(event.status);
    else if (event.type === "progress") setProgress(event.currentTime, event.duration);
    else setError("Track unavailable");
  }, [setError, setProgress, setStatus]);

  function togglePlayback() {
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
        onAdapter={setAdapter}
        onEvent={handlePlayerEvent}
      />

      <div className={styles.trackInfo}>
        {track?.artwork ? <img src={track.artwork} alt="" /> : <span className={styles.artPlaceholder} />}
        <div><strong>{track?.title ?? "Nothing playing"}</strong><span>{track?.artist ?? "Choose a recommendation or search"}</span></div>
      </div>

      <div className={styles.transport}>
        <button type="button" onClick={() => previous(currentTime)} aria-label="Previous track"><SkipBack /></button>
        <button className={styles.primary} type="button" onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"}>
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
        <label className={styles.volume}><Volume2 size={17} /><input type="range" min="0" max="100" value={volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); adapter?.setVolume(value); }} aria-label="Volume" /></label>
        <button type="button" onClick={() => setQueueOpen(true)} aria-label="Show queue"><ListMusic /></button>
        <button className={styles.expand} type="button" onClick={() => setExpanded((value) => !value)} aria-label="Expand player" aria-expanded={expanded}><ChevronUp /></button>
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
            <ol>{queue.map((item, index) => <li key={`${item.provider}:${item.id}`} data-current={String(index === currentIndex)}><button type="button" onClick={() => selectQueueIndex(index)}><span>{item.title}</span><small>{item.artist}</small></button></li>)}</ol>
          </motion.aside>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
