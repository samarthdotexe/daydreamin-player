import { describe, expect, it, vi } from "vitest";

import { handleCatalogRequest } from "./catalog";

const env = { YOUTUBE_API_KEY: "AIza-test-secret-never-return" };

function request(params = "mode=search&q=blue+moon&limit=8") {
  return new Request(`https://daydreamin.test/api/catalog?${params}`);
}

describe("catalog gateway validation", () => {
  it.each([
    ["missing query", "mode=search", "invalid_query"],
    ["blank query", "mode=search&q=+++", "invalid_query"],
    ["long query", `mode=search&q=${"a".repeat(121)}`, "invalid_query"],
    ["invalid mode", "mode=surprise&q=blue", "invalid_mode"],
    ["unknown era", "mode=recommendations&era=1980s", "invalid_era"],
    ["excessive limit", "mode=search&q=blue&limit=21", "invalid_limit"],
  ])("rejects %s without calling YouTube", async (_label, params, code) => {
    const fetcher = vi.fn();
    const response = await handleCatalogRequest(request(params), env, fetcher);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code } });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("catalog gateway responses", () => {
  it("normalizes YouTube search results and emits cache policy", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        nextPageToken: "NEXT",
        items: [{
          id: { videoId: "video-1" },
          snippet: {
            title: "Dream a Little Dream",
            channelTitle: "Ella Fitzgerald - Topic",
            publishedAt: "2019-01-01T00:00:00Z",
            thumbnails: { medium: { url: "https://img.youtube.com/video-1.jpg" } },
          },
        }],
      }),
    );

    const response = await handleCatalogRequest(request(), env, fetcher);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=900");
    expect(body).toEqual({
      items: [{
        id: "video-1",
        provider: "youtube",
        title: "Dream a Little Dream",
        artist: "Ella Fitzgerald",
        artwork: "https://img.youtube.com/video-1.jpg",
        publishedAt: "2019-01-01T00:00:00Z",
      }],
      nextCursor: "NEXT",
    });
    expect(String(fetcher.mock.calls[0][0])).toContain("maxResults=8");
  });

  it("maps quota failures without exposing the credential or upstream body", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(`quota error for ${env.YOUTUBE_API_KEY}`, { status: 403 }),
    );

    const response = await handleCatalogRequest(request(), env, fetcher);
    const body = await response.text();

    expect(response.status).toBe(429);
    expect(JSON.parse(body)).toMatchObject({ error: { code: "quota_exceeded" } });
    expect(body).not.toContain(env.YOUTUBE_API_KEY);
  });

  it("maps network failures to a safe upstream error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("socket and secret details"));

    const response = await handleCatalogRequest(request(), env, fetcher);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: {
        code: "upstream_unavailable",
        message: "The music catalog is temporarily unavailable.",
      },
    });
  });
});
