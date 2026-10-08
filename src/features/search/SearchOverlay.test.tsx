import { act, createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Track } from "../player/types";
import { QueryProvider } from "../../app/QueryProvider";
import { SearchOverlay } from "./SearchOverlay";

const searchCatalog = vi.fn();
vi.mock("../../services/catalog/catalogClient", () => ({
  searchCatalog: (...args: unknown[]) => searchCatalog(...args),
}));

const song: Track = {
  id: "song-1",
  provider: "youtube",
  title: "Midnight City",
  artist: "M83",
  artwork: "art.jpg",
};

function renderSearch(props: Partial<React.ComponentProps<typeof SearchOverlay>> = {}) {
  const triggerRef = createRef<HTMLButtonElement>();
  const onClose = vi.fn();
  const onPlay = vi.fn();
  render(
    <QueryProvider>
      <button ref={triggerRef}>Open search</button>
      <SearchOverlay
        open
        onClose={onClose}
        returnFocusRef={triggerRef}
        onPlay={onPlay}
        {...props}
      />
    </QueryProvider>,
  );
  return { triggerRef, onClose, onPlay };
}

describe("SearchOverlay", () => {
  beforeEach(() => {
    searchCatalog.mockReset();
    localStorage.clear();
  });

  afterEach(() => vi.useRealTimers());

  it("debounces requests by 300ms and suppresses blank queries", async () => {
    vi.useFakeTimers();
    searchCatalog.mockResolvedValue({ items: [] });
    renderSearch();
    const input = screen.getByRole("searchbox", { name: "Search any song" });

    fireEvent.change(input, { target: { value: "   " } });
    await act(async () => vi.advanceTimersByTime(400));
    expect(searchCatalog).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Midnight City" } });
    await act(async () => vi.advanceTimersByTime(299));
    expect(searchCatalog).not.toHaveBeenCalled();
    await act(async () => vi.advanceTimersByTime(1));
    expect(searchCatalog).toHaveBeenCalledWith("Midnight City", expect.any(AbortSignal));
  });

  it("supports keyboard navigation and selection", async () => {
    searchCatalog.mockResolvedValue({ items: [song] });
    const { onPlay } = renderSearch();
    const input = screen.getByRole("searchbox", { name: "Search any song" });
    fireEvent.change(input, { target: { value: "Midnight" } });
    await waitFor(() => expect(searchCatalog).toHaveBeenCalled());
    expect(await screen.findByText(song.title)).toBeInTheDocument();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onPlay).toHaveBeenCalledWith(song);
  });

  it("closes on Escape and restores focus to its trigger", () => {
    const { onClose, triggerRef } = renderSearch();
    const dialog = screen.getByRole("dialog", { name: "Search music" });
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(triggerRef.current);
  });

  it("caps recent searches at five", () => {
    localStorage.setItem(
      "daydreamin:recent-searches:v1",
      JSON.stringify(["one", "two", "three", "four", "five", "six"]),
    );
    renderSearch();

    expect(screen.getAllByRole("button", { name: /search for/i })).toHaveLength(5);
    expect(screen.queryByText("six")).not.toBeInTheDocument();
  });

  it("shows explicit loading, empty, offline, and quota states", async () => {
    vi.useFakeTimers();
    const pending = new Promise(() => undefined);
    searchCatalog.mockReturnValueOnce(pending);
    const view = renderSearch();
    const input = screen.getByRole("searchbox", { name: "Search any song" });
    fireEvent.change(input, { target: { value: "loading" } });
    await act(async () => vi.advanceTimersByTime(300));
    expect(screen.getByRole("status")).toHaveTextContent(/searching/i);

    view.onClose.mockClear();
  });

  it.each([
    [{ items: [] }, /no songs found/i],
    [Object.assign(new Error("offline"), { code: "offline" }), /offline/i],
    [Object.assign(new Error("quota"), { code: "quota_exceeded" }), /search limit/i],
  ])("renders the expected terminal search state", async (outcome, message) => {
    if (outcome instanceof Error) searchCatalog.mockRejectedValue(outcome);
    else searchCatalog.mockResolvedValue(outcome);
    renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "query" } });
    await waitFor(() => expect(searchCatalog).toHaveBeenCalled());

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
  });
});
