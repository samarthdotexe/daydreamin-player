import { describe, expect, it, vi } from "vitest";

import { CatalogClientError, createCatalogClient } from "./catalogClient";

const page = {
  items: [{
    id: "video-1",
    provider: "youtube" as const,
    title: "Song",
    artist: "Artist",
    artwork: "art.jpg",
  }],
};

describe("catalog client", () => {
  it("maps an aborted fetch to the aborted code", async () => {
    const fetcher = vi.fn().mockRejectedValue(
      new DOMException("The operation was aborted", "AbortError"),
    );
    const client = createCatalogClient(fetcher);

    await expect(client.search("Song", AbortSignal.abort())).rejects.toMatchObject({
      code: "aborted",
    });
  });

  it("maps a network failure to offline", async () => {
    const client = createCatalogClient(vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(client.search("Song")).rejects.toMatchObject({ code: "offline" });
  });

  it("keeps prior successful data available when a refresh fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(page))
      .mockRejectedValueOnce(new TypeError("offline"));
    const client = createCatalogClient(fetcher);

    await expect(client.search("Song")).resolves.toEqual(page);

    const error = await client.search("Song").catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(CatalogClientError);
    expect(error).toMatchObject({ code: "offline", cachedPage: page });
    expect(client.peek("search:Song")).toEqual(page);
  });

  it("passes era requests through the same provider-neutral contract", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(page));
    const client = createCatalogClient(fetcher);

    await client.recommendations("1970s");

    expect(String(fetcher.mock.calls[0][0])).toBe(
      "/api/catalog?mode=recommendations&era=1970s",
    );
  });
});
