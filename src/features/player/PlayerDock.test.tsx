import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Track } from "./types";
import type { PlayerAdapter } from "./YouTubePlayerAdapter";
import { PlayerDock } from "./PlayerDock";
import { usePlayerStore } from "./playerStore";

const first: Track = { id: "one", provider: "youtube", title: "First Song", artist: "Artist One", artwork: "one.jpg" };
const second: Track = { id: "two", provider: "youtube", title: "Second Song", artist: "Artist Two", artwork: "two.jpg" };

function adapter(): PlayerAdapter {
  return {
    load: vi.fn(), play: vi.fn(), pause: vi.fn(), seekTo: vi.fn(), setVolume: vi.fn(), destroy: vi.fn(),
  };
}

describe("PlayerDock", () => {
  beforeEach(() => {
    usePlayerStore.setState(usePlayerStore.getInitialState(), true);
    usePlayerStore.setState({
      queue: [first, second], currentIndex: 0, status: "paused", currentTime: 65, duration: 185,
    });
  });

  it("shows the official player surface, metadata, time, and transport controls", async () => {
    const player = adapter();
    const user = userEvent.setup();
    render(<PlayerDock player={player} />);

    expect(screen.getByRole("region", { name: "YouTube video player" })).toBeVisible();
    expect(screen.getByText("First Song")).toBeInTheDocument();
    expect(screen.getByText("1:05 / 3:05")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play" }));
    await user.click(screen.getByRole("button", { name: "Next track" }));
    await user.click(screen.getByRole("button", { name: "Previous track" }));
    expect(player.play).toHaveBeenCalledOnce();
  });

  it("seeks, changes volume, opens the queue, and expands on mobile", async () => {
    const player = adapter();
    const user = userEvent.setup();
    render(<PlayerDock player={player} />);

    fireEvent.change(screen.getByRole("slider", { name: "Seek" }), { target: { value: "90" } });
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: "35" } });
    expect(player.seekTo).toHaveBeenCalledWith(90);
    expect(player.setVolume).toHaveBeenCalledWith(35);

    await user.click(screen.getByRole("button", { name: "Show queue" }));
    expect(screen.getByRole("dialog", { name: "Playback queue" })).toHaveTextContent("Second Song");

    const expand = screen.getByRole("button", { name: "Expand player" });
    await user.click(expand);
    expect(expand).toHaveAttribute("aria-expanded", "true");
  });

  it("surfaces unavailable video recovery without mutating or auto-skipping the queue", async () => {
    const user = userEvent.setup();
    usePlayerStore.setState({ status: "error", error: "Track unavailable" });
    render(<PlayerDock player={adapter()} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Track unavailable");
    expect(usePlayerStore.getState().queue).toEqual([first, second]);
    expect(usePlayerStore.getState().currentIndex).toBe(0);

    await user.click(screen.getByRole("button", { name: "Try next" }));
    expect(usePlayerStore.getState().currentIndex).toBe(1);
    expect(usePlayerStore.getState().queue).toEqual([first, second]);
  });
});
