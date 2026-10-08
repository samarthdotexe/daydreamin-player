import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Track } from "../features/player/types";
import { TrackRow } from "./TrackRow";

const track: Track = {
  id: "dream-1",
  provider: "youtube",
  title: "Dream a Little Dream",
  artist: "Ella Fitzgerald",
  artwork: "cover.jpg",
};

describe("TrackRow", () => {
  it("renders metadata and sends the exact track to every action", async () => {
    const actions = {
      onPlay: vi.fn(),
      onPlayNext: vi.fn(),
      onQueue: vi.fn(),
      onSave: vi.fn(),
    };
    const user = userEvent.setup();
    render(<TrackRow track={track} {...actions} />);

    expect(screen.getByText(track.title)).toBeInTheDocument();
    expect(screen.getByText(track.artist)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `Play now: ${track.title}` }));
    await user.click(screen.getByRole("button", { name: `Play next: ${track.title}` }));
    await user.click(screen.getByRole("button", { name: `Add to queue: ${track.title}` }));
    await user.click(screen.getByRole("button", { name: `Save: ${track.title}` }));

    expect(actions.onPlay).toHaveBeenCalledWith(track);
    expect(actions.onPlayNext).toHaveBeenCalledWith(track);
    expect(actions.onQueue).toHaveBeenCalledWith(track);
    expect(actions.onSave).toHaveBeenCalledWith(track);
  });
});
