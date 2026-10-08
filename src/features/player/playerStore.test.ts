import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlayerStore } from "./playerStore";
import type { Track } from "./types";

const one: Track = {
  id: "one",
  provider: "youtube",
  title: "One",
  artist: "First Artist",
  artwork: "https://example.com/one.jpg",
};

const two: Track = {
  id: "two",
  provider: "youtube",
  title: "Two",
  artist: "Second Artist",
  artwork: "https://example.com/two.jpg",
};

const three: Track = {
  id: "three",
  provider: "youtube",
  title: "Three",
  artist: "Third Artist",
  artwork: "https://example.com/three.jpg",
};

describe("player store", () => {
  beforeEach(() => {
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("plays a new track immediately without duplicating a stable provider ID", () => {
    const { enqueue, playNow } = usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    playNow({ ...one, title: "Updated One" });

    const state = usePlayerStore.getState();
    expect(state.queue).toHaveLength(2);
    expect(state.queue[0].title).toBe("Updated One");
    expect(state.currentIndex).toBe(0);
    expect(state.status).toBe("loading");
  });

  it("inserts a track directly after the current track", () => {
    const { enqueue, playNext, selectQueueIndex } = usePlayerStore.getState();
    enqueue(one);
    enqueue(three);
    selectQueueIndex(0);
    playNext(two);

    expect(usePlayerStore.getState().queue.map((track) => track.id)).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("keeps the next track selected when the current track is removed", () => {
    const { enqueue, removeFromQueue, selectQueueIndex } = usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    enqueue(three);
    selectQueueIndex(1);
    removeFromQueue("youtube:two");

    const state = usePlayerStore.getState();
    expect(state.queue.map((track) => track.id)).toEqual(["one", "three"]);
    expect(state.currentIndex).toBe(1);
    expect(state.queue[state.currentIndex].id).toBe("three");
  });

  it("wraps next and previous navigation when repeat-all is active", () => {
    const { cycleRepeat, enqueue, next, previous, selectQueueIndex } =
      usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    selectQueueIndex(1);
    cycleRepeat();
    next();
    expect(usePlayerStore.getState().currentIndex).toBe(0);
    previous(0);
    expect(usePlayerStore.getState().currentIndex).toBe(1);
  });

  it("keeps the current track when repeat-one advances", () => {
    const { cycleRepeat, enqueue, next, selectQueueIndex } = usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    selectQueueIndex(0);
    cycleRepeat();
    cycleRepeat();
    next();

    expect(usePlayerStore.getState().currentIndex).toBe(0);
  });

  it("uses a different deterministic track while shuffle is active", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const { enqueue, next, selectQueueIndex, toggleShuffle } =
      usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    enqueue(three);
    selectQueueIndex(0);
    toggleShuffle();
    next();

    expect(usePlayerStore.getState().currentIndex).toBe(2);
  });

  it("restarts the current track instead of navigating after three seconds", () => {
    const { enqueue, previous, selectQueueIndex, setProgress } =
      usePlayerStore.getState();
    enqueue(one);
    enqueue(two);
    selectQueueIndex(1);
    setProgress(12, 180);
    previous(12);

    const state = usePlayerStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.currentTime).toBe(0);
  });

  it("cycles repeat mode through all, one, and off", () => {
    const { cycleRepeat } = usePlayerStore.getState();
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("all");
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("one");
    cycleRepeat();
    expect(usePlayerStore.getState().repeat).toBe("off");
  });
});
