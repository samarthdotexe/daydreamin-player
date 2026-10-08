import { ERAS } from "../../src/features/eras/eras";
import type { EraId } from "../../src/features/eras/types";
import type { Track } from "../../src/features/player/types";
import type {
  CatalogEnvironment,
  CatalogErrorBody,
  CatalogErrorCode,
  CatalogPage,
} from "./types";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
  nextPageToken?: string;
}

const eraIds = new Set<string>(ERAS.map((era) => era.id));
const CACHE_HEADER = "public, max-age=60, s-maxage=900, stale-while-revalidate=86400";

function json(body: CatalogPage | CatalogErrorBody, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": status === 200 ? CACHE_HEADER : "no-store",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function fail(code: CatalogErrorCode, message: string, status = 400): Response {
  return json({ error: { code, message } }, status);
}

function normalizeArtist(channelTitle = "Unknown artist"): string {
  return channelTitle.replace(/\s+-\s+Topic$/i, "").trim() || "Unknown artist";
}

function bestThumbnail(thumbnails: YouTubeSearchItem["snippet"] extends infer _ ? Record<string, { url?: string }> | undefined : never): string {
  return thumbnails?.maxres?.url
    ?? thumbnails?.standard?.url
    ?? thumbnails?.high?.url
    ?? thumbnails?.medium?.url
    ?? thumbnails?.default?.url
    ?? "";
}

function normalizeItem(item: YouTubeSearchItem): Track | null {
  const id = item.id?.videoId;
  const snippet = item.snippet;
  if (!id || !snippet?.title) return null;

  return {
    id,
    provider: "youtube",
    title: snippet.title,
    artist: normalizeArtist(snippet.channelTitle),
    artwork: bestThumbnail(snippet.thumbnails),
    ...(snippet.publishedAt ? { publishedAt: snippet.publishedAt } : {}),
  };
}

function parseLimit(value: string | null): number | null {
  if (value === null) return 12;
  if (!/^\d+$/.test(value)) return null;
  const limit = Number(value);
  return limit >= 1 && limit <= 20 ? limit : null;
}

function recommendationQuery(era: EraId): string {
  const definition = ERAS.find((candidate) => candidate.id === era);
  return definition?.recommendationQueries[0] ?? `${era} music classics`;
}

export async function handleCatalogRequest(
  request: Request,
  env: CatalogEnvironment,
  fetcher: Fetcher = fetch,
): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");
  const limit = parseLimit(url.searchParams.get("limit"));

  if (mode !== "search" && mode !== "recommendations") {
    return fail("invalid_mode", "Choose search or recommendations mode.");
  }
  if (limit === null) {
    return fail("invalid_limit", "Result limit must be between 1 and 20.");
  }

  let query: string;
  if (mode === "search") {
    query = (url.searchParams.get("q") ?? "").trim();
    if (query.length === 0 || query.length > 120) {
      return fail("invalid_query", "Search query must be between 1 and 120 characters.");
    }
  } else {
    const era = url.searchParams.get("era") ?? "";
    if (!eraIds.has(era)) {
      return fail("invalid_era", "Choose a supported decade.");
    }
    query = recommendationQuery(era as EraId);
  }

  const key = env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    return fail("misconfigured", "The music catalog is not configured.", 503);
  }

  const upstreamUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  upstreamUrl.search = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    safeSearch: "moderate",
    maxResults: String(limit),
    q: query,
    key,
    ...(url.searchParams.get("cursor")
      ? { pageToken: url.searchParams.get("cursor") as string }
      : {}),
  }).toString();

  let upstream: Response;
  try {
    upstream = await fetcher(upstreamUrl.toString(), {
      headers: { accept: "application/json" },
    });
  } catch {
    return fail(
      "upstream_unavailable",
      "The music catalog is temporarily unavailable.",
      503,
    );
  }

  if (!upstream.ok) {
    if (upstream.status === 403 || upstream.status === 429) {
      return fail("quota_exceeded", "Search is taking a rest. Try again later.", 429);
    }
    return fail(
      "upstream_unavailable",
      "The music catalog is temporarily unavailable.",
      503,
    );
  }

  try {
    const result = await upstream.json() as YouTubeSearchResponse;
    const items = (result.items ?? [])
      .map(normalizeItem)
      .filter((item): item is Track => item !== null);
    return json({
      items,
      ...(result.nextPageToken ? { nextCursor: result.nextPageToken } : {}),
    });
  } catch {
    return fail(
      "upstream_unavailable",
      "The music catalog is temporarily unavailable.",
      503,
    );
  }
}
