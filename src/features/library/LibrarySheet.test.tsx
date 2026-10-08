import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Track } from "../player/types";
import type { LibraryRepository } from "../../services/firebase/library";
import { LibrarySheet } from "./LibrarySheet";

const track: Track = { id: "one", provider: "youtube", title: "Saved Song", artist: "Artist", artwork: "art.jpg" };

function repository(items: Track[] = []): LibraryRepository {
  return {
    subscribe: vi.fn((_userId, listener) => { listener(items); return vi.fn(); }),
    save: vi.fn(),
    remove: vi.fn(),
  };
}

describe("LibrarySheet", () => {
  it("invites an anonymous listener to sign in when a save is requested", () => {
    render(<LibrarySheet open user={null} requestedTrack={track} repository={repository()} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Saved library" })).toBeInTheDocument();
    expect(screen.getByText(/sign in to save/i)).toBeInTheDocument();
  });

  it("saves for authenticated listeners and renders their library", async () => {
    const library = repository([track]);
    render(<LibrarySheet open user={{ id: "u1", displayName: "Samarth" }} requestedTrack={track} repository={library} onClose={vi.fn()} />);

    expect(await screen.findByText("Saved Song")).toBeInTheDocument();
    expect(library.save).toHaveBeenCalledWith("u1", track);
  });

  it("removes a saved track from the authenticated library", async () => {
    const library = repository([track]);
    const user = userEvent.setup();
    render(<LibrarySheet open user={{ id: "u1", displayName: "Samarth" }} repository={library} onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Remove Saved Song" }));
    expect(library.remove).toHaveBeenCalledWith("u1", "youtube:one");
  });
});
