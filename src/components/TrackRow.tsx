import { Bookmark, ListEnd, ListPlus, Play } from "lucide-react";

import type { Track } from "../features/player/types";
import styles from "./TrackRow.module.css";

interface TrackRowProps {
  track: Track;
  onPlay: (track: Track) => void;
  onPlayNext: (track: Track) => void;
  onQueue: (track: Track) => void;
  onSave: (track: Track) => void;
  compact?: boolean;
}

export function TrackRow({
  track,
  onPlay,
  onPlayNext,
  onQueue,
  onSave,
  compact = false,
}: TrackRowProps) {
  return (
    <article className={styles.row} data-compact={String(compact)}>
      <button
        className={styles.artworkButton}
        type="button"
        onClick={() => onPlay(track)}
        aria-label={`Play now: ${track.title}`}
      >
        {track.artwork ? <img src={track.artwork} alt="" loading="lazy" /> : <Play aria-hidden="true" />}
        <span className={styles.playGlyph}><Play size={16} fill="currentColor" /></span>
      </button>
      <div className={styles.metadata}>
        <h3>{track.title}</h3>
        <p>{track.artist}</p>
      </div>
      <div className={styles.actions} aria-label={`Actions for ${track.title}`}>
        <button type="button" onClick={() => onPlayNext(track)} aria-label={`Play next: ${track.title}`}>
          <ListEnd size={17} />
        </button>
        <button type="button" onClick={() => onQueue(track)} aria-label={`Add to queue: ${track.title}`}>
          <ListPlus size={17} />
        </button>
        <button type="button" onClick={() => onSave(track)} aria-label={`Save: ${track.title}`}>
          <Bookmark size={17} />
        </button>
      </div>
    </article>
  );
}
