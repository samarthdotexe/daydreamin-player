import { describe, expect, it, vi } from "vitest";

import type { Track } from "../../features/player/types";
import { createLibraryRepository, serializeTrack, type LibraryDriver } from "./library";

const track: Track = {
  id: "abc123",
  provider: "youtube",
  title: "Dreams",
  artist: "Fleetwood Mac",
  artwork: "cover.jpg",
  durationSeconds: undefined,
};

function driver(): LibraryDriver {
  return { subscribe: vi.fn(() => vi.fn()), set: vi.fn(), remove: vi.fn() };
}

describe("library repository", () => {
  it("serializes tracks without undefined values", () => {
    expect(serializeTrack(track)).toEqual({
      id: "abc123",
      provider: "youtube",
      title: "Dreams",
      artist: "Fleetwood Mac",
      artwork: "cover.jpg",
    });
    expect(JSON.stringify(serializeTrack(track))).not.toContain("undefined");
  });

  it("uses a stable provider track key so saves overwrite duplicates", async () => {
    const storage = driver();
    const repository = createLibraryRepository(storage);

    await repository.save("user-1", track);
    await repository.save("user-1", { ...track, title: "Dreams (Remastered)" });

    expect(storage.set).toHaveBeenNthCalledWith(
      1,
      "users/user-1/playlist/youtube:abc123",
      expect.objectContaining({ title: "Dreams" }),
    );
    expect(storage.set).toHaveBeenNthCalledWith(
      2,
      "users/user-1/playlist/youtube:abc123",
      expect.objectContaining({ title: "Dreams (Remastered)" }),
    );
  });

  it("returns the underlying listener unsubscribe", () => {
    const unsubscribe = vi.fn();
    const storage = driver();
    vi.mocked(storage.subscribe).mockReturnValue(unsubscribe);
    const listener = vi.fn();

    const stop = createLibraryRepository(storage).subscribe("user-1", listener);
    stop();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("rejects save and removal without an authenticated user ID", async () => {
    const repository = createLibraryRepository(driver());

    await expect(repository.save("", track)).rejects.toThrow(/sign in/i);
    await expect(repository.remove("", "youtube:abc123")).rejects.toThrow(/sign in/i);
  });
});
