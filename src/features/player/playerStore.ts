import { create } from "zustand";

import { getTrackKey } from "./types";
import type { PlaybackStatus, RepeatMode, Track } from "./types";

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  shuffle: boolean;
  repeat: RepeatMode;
  playNow: (track: Track) => void;
  enqueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (trackKey: string) => void;
  selectQueueIndex: (index: number) => void;
  next: () => void;
  previous: (currentTime: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setStatus: (status: PlaybackStatus) => void;
  setProgress: (currentTime: number, duration: number) => void;
  setVolume: (volume: number) => void;
  setError: (error: string | null) => void;
}

const repeatOrder: readonly RepeatMode[] = ["off", "all", "one"];

function replaceTrack(queue: Track[], track: Track): [Track[], number] {
  const key = getTrackKey(track);
  const existingIndex = queue.findIndex((item) => getTrackKey(item) === key);

  if (existingIndex === -1) {
    return [[...queue, track], queue.length];
  }

  const nextQueue = [...queue];
  nextQueue[existingIndex] = track;
  return [nextQueue, existingIndex];
}

export const usePlayerStore = create<PlayerState>((set) => ({
  queue: [],
  currentIndex: -1,
  status: "idle",
  currentTime: 0,
  duration: 0,
  volume: 80,
  error: null,
  shuffle: false,
  repeat: "off",

  playNow: (track) =>
    set((state) => {
      const [queue, currentIndex] = replaceTrack(state.queue, track);
      return {
        queue,
        currentIndex,
        status: "loading",
        currentTime: 0,
        duration: 0,
        error: null,
      };
    }),

  enqueue: (track) =>
    set((state) => {
      const key = getTrackKey(track);
      if (state.queue.some((item) => getTrackKey(item) === key)) {
        return state;
      }
      return { queue: [...state.queue, track] };
    }),

  playNext: (track) =>
    set((state) => {
      const currentTrack = state.queue[state.currentIndex];
      const currentKey = currentTrack ? getTrackKey(currentTrack) : null;
      const nextQueue = state.queue.filter(
        (item) => getTrackKey(item) !== getTrackKey(track),
      );
      const currentIndex = currentKey
        ? nextQueue.findIndex((item) => getTrackKey(item) === currentKey)
        : -1;
      const insertionIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
      nextQueue.splice(insertionIndex, 0, track);

      return {
        queue: nextQueue,
        currentIndex,
      };
    }),

  removeFromQueue: (trackKey) =>
    set((state) => {
      const removedIndex = state.queue.findIndex(
        (track) => getTrackKey(track) === trackKey,
      );
      if (removedIndex === -1) {
        return state;
      }

      const queue = state.queue.filter((_, index) => index !== removedIndex);
      if (queue.length === 0) {
        return {
          queue,
          currentIndex: -1,
          status: "idle",
          currentTime: 0,
          duration: 0,
          error: null,
        };
      }

      const currentIndex =
        removedIndex < state.currentIndex
          ? state.currentIndex - 1
          : removedIndex === state.currentIndex
            ? Math.min(removedIndex, queue.length - 1)
            : state.currentIndex;

      return { queue, currentIndex };
    }),

  selectQueueIndex: (index) =>
    set((state) => {
      if (index < 0 || index >= state.queue.length) {
        return state;
      }
      return {
        currentIndex: index,
        status: "loading",
        currentTime: 0,
        duration: 0,
        error: null,
      };
    }),

  next: () =>
    set((state) => {
      if (state.queue.length === 0 || state.currentIndex < 0) {
        return state;
      }
      if (state.repeat === "one") {
        return { currentTime: 0 };
      }
      if (state.shuffle && state.queue.length > 1) {
        const candidate = Math.floor(Math.random() * (state.queue.length - 1));
        return {
          currentIndex: candidate >= state.currentIndex ? candidate + 1 : candidate,
          currentTime: 0,
          duration: 0,
          status: "loading",
        };
      }
      if (state.currentIndex === state.queue.length - 1) {
        return state.repeat === "all"
          ? { currentIndex: 0, currentTime: 0, duration: 0, status: "loading" }
          : { currentTime: 0, status: "ended" };
      }
      return {
        currentIndex: state.currentIndex + 1,
        currentTime: 0,
        duration: 0,
        status: "loading",
      };
    }),

  previous: (currentTime) =>
    set((state) => {
      if (state.queue.length === 0 || state.currentIndex < 0) {
        return state;
      }
      if (currentTime > 3) {
        return { currentTime: 0 };
      }
      if (state.currentIndex === 0) {
        return state.repeat === "all"
          ? {
              currentIndex: state.queue.length - 1,
              currentTime: 0,
              duration: 0,
              status: "loading",
            }
          : { currentTime: 0 };
      }
      return {
        currentIndex: state.currentIndex - 1,
        currentTime: 0,
        duration: 0,
        status: "loading",
      };
    }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  cycleRepeat: () =>
    set((state) => {
      const index = repeatOrder.indexOf(state.repeat);
      return { repeat: repeatOrder[(index + 1) % repeatOrder.length] };
    }),

  setStatus: (status) => set({ status }),

  setProgress: (currentTime, duration) =>
    set({
      currentTime: Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0,
      duration: Number.isFinite(duration) ? Math.max(0, duration) : 0,
    }),

  setVolume: (volume) => set({ volume: Math.min(100, Math.max(0, volume)) }),

  setError: (error) => set({ error, ...(error ? { status: "error" as const } : {}) }),
}));

export type { PlayerState };
