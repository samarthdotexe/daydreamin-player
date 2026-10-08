import type { PlaybackStatus } from "./types";

export type PlayerEvent =
  | { type: "status"; status: PlaybackStatus }
  | { type: "progress"; currentTime: number; duration: number }
  | { type: "unavailable"; code: number };

export interface PlayerAdapter {
  load(videoId: string): void;
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface AdapterDependencies {
  loadApi?: () => Promise<YT.Namespace>;
}

let apiPromise: Promise<YT.Namespace> | null = null;

export function loadYouTubeIframeApi(): Promise<YT.Namespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YT.Namespace>((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube IFrame API loaded without a player constructor."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("YouTube IFrame API could not be loaded."));
    document.head.append(script);
  });

  return apiPromise;
}

export function resetYouTubeApiLoaderForTests(): void {
  apiPromise = null;
}

export function mapYouTubeState(state: number): PlaybackStatus {
  switch (state) {
    case 0: return "ended";
    case 1: return "playing";
    case 2: return "paused";
    case 3: return "loading";
    case 5: return "ready";
    default: return "idle";
  }
}

export class YouTubePlayerAdapter implements PlayerAdapter {
  private player: YT.Player | null = null;
  private ready = false;
  private destroyed = false;
  private commandQueue: Array<() => void> = [];
  private progressTimer: number | null = null;
  private unavailableReported = false;
  private playing = false;
  private readonly loadApi: () => Promise<YT.Namespace>;

  constructor(
    private readonly elementId: string,
    private readonly emit: (event: PlayerEvent) => void,
    dependencies: AdapterDependencies = {},
  ) {
    this.loadApi = dependencies.loadApi ?? loadYouTubeIframeApi;
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  async mount(): Promise<void> {
    const api = await this.loadApi();
    if (this.destroyed) return;
    this.player = new api.Player(this.elementId, {
      width: "100%",
      height: "100%",
      playerVars: { playsinline: 1, controls: 1, rel: 0 },
      events: {
        onReady: ({ target }) => {
          this.player = target;
          this.ready = true;
          const commands = this.commandQueue.splice(0);
          commands.forEach((command) => command());
        },
        onStateChange: ({ data }) => {
          const status = mapYouTubeState(data);
          this.playing = status === "playing";
          this.emit({ type: "status", status });
          if (status === "playing" && !document.hidden) this.startProgress();
          else this.stopProgress();
        },
        onError: ({ data }) => {
          this.stopProgress();
          if (!this.unavailableReported) {
            this.unavailableReported = true;
            this.emit({ type: "unavailable", code: data });
          }
        },
      },
    });
  }

  private run(command: (player: YT.Player) => void): void {
    const invoke = () => { if (this.player && !this.destroyed) command(this.player); };
    if (this.ready) invoke();
    else this.commandQueue.push(invoke);
  }

  load(videoId: string): void {
    this.unavailableReported = false;
    this.run((player) => player.loadVideoById(videoId));
  }
  play(): void { this.run((player) => player.playVideo()); }
  pause(): void { this.run((player) => player.pauseVideo()); }
  seekTo(seconds: number): void { this.run((player) => player.seekTo(seconds, true)); }
  setVolume(volume: number): void { this.run((player) => player.setVolume(Math.min(100, Math.max(0, volume)))); }

  private startProgress(): void {
    if (this.progressTimer !== null || document.hidden) return;
    this.progressTimer = window.setInterval(() => {
      if (!this.player || document.hidden) return;
      this.emit({
        type: "progress",
        currentTime: this.player.getCurrentTime(),
        duration: this.player.getDuration(),
      });
    }, 500);
  }

  private stopProgress(): void {
    if (this.progressTimer === null) return;
    window.clearInterval(this.progressTimer);
    this.progressTimer = null;
  }

  private handleVisibility = () => {
    if (document.hidden) this.stopProgress();
    else if (this.playing) this.startProgress();
  };

  destroy(): void {
    this.destroyed = true;
    this.stopProgress();
    this.commandQueue = [];
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.player?.destroy();
    this.player = null;
  }
}
