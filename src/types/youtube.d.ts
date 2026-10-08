declare namespace YT {
  interface Player {
    cueVideoById(videoId: string): void;
    loadVideoById(videoId: string): void;
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead?: boolean): void;
    setVolume(volume: number): void;
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
  }

  interface PlayerEvent { target: Player; }
  interface OnStateChangeEvent extends PlayerEvent { data: number; }
  interface OnErrorEvent extends PlayerEvent { data: number; }
  interface PlayerEvents {
    onReady(event: PlayerEvent): void;
    onStateChange(event: OnStateChangeEvent): void;
    onError(event: OnErrorEvent): void;
  }
  interface PlayerOptions {
    width?: number | string;
    height?: number | string;
    videoId?: string;
    playerVars?: Record<string, number | string>;
    events: PlayerEvents;
  }
  interface Namespace {
    Player: new (elementId: string, options: PlayerOptions) => Player;
  }
  const Player: Namespace["Player"];
}

interface Window {
  YT?: YT.Namespace;
  onYouTubeIframeAPIReady?: () => void;
}
