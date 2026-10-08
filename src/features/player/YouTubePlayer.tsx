import { useEffect, useId, useRef } from "react";

import type { Track } from "./types";
import {
  YouTubePlayerAdapter,
  type PlayerAdapter,
  type PlayerEvent,
} from "./YouTubePlayerAdapter";
import styles from "./PlayerDock.module.css";

interface YouTubePlayerProps {
  track?: Track;
  externalAdapter?: PlayerAdapter;
  autoplay?: boolean;
  onAdapter?: (adapter: PlayerAdapter) => void;
  onEvent?: (event: PlayerEvent) => void;
}

export function YouTubePlayer({
  track,
  externalAdapter,
  autoplay = true,
  onAdapter,
  onEvent = () => undefined,
}: YouTubePlayerProps) {
  const reactId = useId();
  const elementId = `youtube-player-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ownedAdapter = useRef<PlayerAdapter | null>(null);
  const autoplayRef = useRef(autoplay);
  autoplayRef.current = autoplay;

  useEffect(() => {
    if (externalAdapter) {
      onAdapter?.(externalAdapter);
      return;
    }
    const adapter = new YouTubePlayerAdapter(elementId, onEvent);
    ownedAdapter.current = adapter;
    onAdapter?.(adapter);
    void adapter.mount().catch(() => onEvent({ type: "unavailable", code: 0 }));
    return () => {
      ownedAdapter.current = null;
      adapter.destroy();
    };
  }, [elementId, externalAdapter, onAdapter, onEvent]);

  useEffect(() => {
    const adapter = externalAdapter ?? ownedAdapter.current;
    if (track && adapter) adapter.load(track.id, autoplayRef.current);
  }, [externalAdapter, track]);

  return (
    <div className={styles.videoSurface} role="region" aria-label="YouTube video player" data-active={String(Boolean(track))}>
      <div id={elementId} />
      {!track && <p>Choose a song to begin</p>}
    </div>
  );
}
