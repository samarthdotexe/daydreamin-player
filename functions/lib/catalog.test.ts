import { describe, expect, it, vi } from "vitest";

import { handleCatalogRequest } from "./catalog";

const env = { YOUTUBE_API_KEY: "test-secret-never-return" };

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
  it("returns 429 before contacting YouTube when the rate limit is exhausted", async () => {
    const fetcher = vi.fn();
    const limit = vi.fn().mockResolvedValue({ success: false });
    const response = await handleCatalogRequest(
      new Request(request().url, { headers: { "x-daydreamin-session": "1234567890abcdef", "cf-connecting-ip": "203.0.113.10" } }),
      { ...env, CATALOG_RATE_LIMITER: { limit } },
      fetcher,
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: { code: "rate_limited" } });
    expect(limit).toHaveBeenCalledWith({ key: "203.0.113.10" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes a rate-limiter service failure", async () => {
    const fetcher = vi.fn();
    const response = await handleCatalogRequest(request(), {
      ...env,
      CATALOG_RATE_LIMITER: { limit: vi.fn().mockRejectedValue(new Error("binding unavailable")) },
    }, fetcher);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: "upstream_unavailable" } });
    expect(fetcher).not.toHaveBeenCalled();
  });

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

  it("decodes escaped YouTube metadata", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ items: [{
      id: { videoId: "escaped" },
      snippet: { title: "Rock &amp; Roll &#39;Forever&#39;", channelTitle: "A &amp; B - Topic" },
    }] }));
    const response = await handleCatalogRequest(request(), env, fetcher);
    expect(await response.json()).toMatchObject({
      items: [{ title: "Rock & Roll 'Forever'", artist: "A & B" }],
    });
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
