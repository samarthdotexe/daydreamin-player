export type TrackProvider = "youtube";

export interface Track {
  id: string;
  provider: TrackProvider;
  title: string;
  artist: string;
  artwork: string;
  durationSeconds?: number;
  publishedAt?: string;
}

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export type RepeatMode = "off" | "all" | "one";

export function getTrackKey(track: Pick<Track, "id" | "provider">): string {
  return `${track.provider}:${track.id}`;
}
