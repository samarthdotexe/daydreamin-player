import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  YouTubePlayerAdapter,
  loadYouTubeIframeApi,
  mapYouTubeState,
  resetYouTubeApiLoaderForTests,
} from "./YouTubePlayerAdapter";

function fakePlayer() {
  return {
    cueVideoById: vi.fn(),
    loadVideoById: vi.fn(),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    seekTo: vi.fn(),
    setVolume: vi.fn(),
    getCurrentTime: vi.fn(() => 12),
    getDuration: vi.fn(() => 180),
    destroy: vi.fn(),
  };
}

describe("YouTubePlayerAdapter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetYouTubeApiLoaderForTests();
    document.head.innerHTML = "";
    Reflect.deleteProperty(window, "YT");
    Reflect.deleteProperty(window, "onYouTubeIframeAPIReady");
  });

  it("loads the IFrame API script only once", async () => {
    const first = loadYouTubeIframeApi();
    const second = loadYouTubeIframeApi();

    expect(document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]')).toHaveLength(1);
    window.YT = { Player: vi.fn() as unknown as typeof YT.Player };
    window.onYouTubeIframeAPIReady?.();

    await expect(first).resolves.toBe(window.YT);
    await expect(second).resolves.toBe(window.YT);
  });

  it("queues commands until the player is ready", async () => {
    const player = fakePlayer();
    let events!: YT.PlayerEvents;
    const Player = vi.fn(function (_id: string, options: YT.PlayerOptions) {
      events = options.events;
      return player;
    });
    const adapter = new YouTubePlayerAdapter("player", vi.fn(), {
      loadApi: async () => ({ Player: Player as unknown as typeof YT.Player }),
    });

    adapter.load("video-1");
    adapter.play();
    await adapter.mount();
    expect(player.loadVideoById).not.toHaveBeenCalled();

    events.onReady({ target: player as unknown as YT.Player });
    expect(player.loadVideoById).toHaveBeenCalledWith("video-1");
    expect(player.playVideo).toHaveBeenCalledOnce();
  });

  it.each([
    [-1, "idle"], [0, "ended"], [1, "playing"], [2, "paused"], [3, "loading"], [5, "ready"],
  ] as const)("maps provider state %s to %s", (providerState, expected) => {
    expect(mapYouTubeState(providerState)).toBe(expected);
  });

  it("polls progress only while playing and visible", async () => {
    const player = fakePlayer();
    let events!: YT.PlayerEvents;
    const listener = vi.fn();
    const adapter = new YouTubePlayerAdapter("player", listener, {
      loadApi: async () => ({
        Player: vi.fn(function (_id: string, options: YT.PlayerOptions) {
          events = options.events;
          return player;
        }) as unknown as typeof YT.Player,
      }),
    });
    await adapter.mount();
    events.onReady({ target: player as unknown as YT.Player });
    events.onStateChange({ data: 1, target: player as unknown as YT.Player });

    await vi.advanceTimersByTimeAsync(1000);
    expect(listener).toHaveBeenCalledWith({ type: "progress", currentTime: 12, duration: 180 });
    const progressCount = listener.mock.calls.length;

    events.onStateChange({ data: 2, target: player as unknown as YT.Player });
    await vi.advanceTimersByTimeAsync(1000);
    expect(listener.mock.calls.length).toBe(progressCount + 1);
  });

  it("resumes progress polling when a playing document becomes visible again", async () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const player = fakePlayer();
    let events!: YT.PlayerEvents;
    const listener = vi.fn();
    const adapter = new YouTubePlayerAdapter("player", listener, {
      loadApi: async () => ({
        Player: vi.fn(function (_id: string, options: YT.PlayerOptions) {
          events = options.events;
          return player;
        }) as unknown as typeof YT.Player,
      }),
    });
    await adapter.mount();
    events.onReady({ target: player as unknown as YT.Player });
    events.onStateChange({ data: 1, target: player as unknown as YT.Player });
    hidden = true;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(listener.mock.calls.filter(([event]) => event.type === "progress")).toHaveLength(0);

    hidden = false;
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(500);
    expect(listener).toHaveBeenCalledWith({ type: "progress", currentTime: 12, duration: 180 });
    adapter.destroy();
  });

  it("reports one unavailable error and tears down timers and listeners", async () => {
    const player = fakePlayer();
    let events!: YT.PlayerEvents;
    const listener = vi.fn();
    const removeListener = vi.spyOn(document, "removeEventListener");
    const adapter = new YouTubePlayerAdapter("player", listener, {
      loadApi: async () => ({
        Player: vi.fn(function (_id: string, options: YT.PlayerOptions) {
          events = options.events;
          return player;
        }) as unknown as typeof YT.Player,
      }),
    });
    await adapter.mount();
    events.onReady({ target: player as unknown as YT.Player });
    events.onError({ data: 100, target: player as unknown as YT.Player });
    events.onError({ data: 100, target: player as unknown as YT.Player });

    expect(listener.mock.calls.filter(([event]) => event.type === "unavailable")).toHaveLength(1);
    adapter.destroy();

    expect(player.destroy).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });
});
