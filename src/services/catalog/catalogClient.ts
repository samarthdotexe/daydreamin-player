import type { EraId } from "../../features/eras/types";
import type { CatalogErrorCode, CatalogPage, CatalogProvider } from "./types";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface GatewayErrorBody {
  error?: { code?: CatalogErrorCode; message?: string };
}

export class CatalogClientError extends Error {
  readonly code: CatalogErrorCode;
  readonly cachedPage?: CatalogPage;

  constructor(code: CatalogErrorCode, message: string, cachedPage?: CatalogPage) {
    super(message);
    this.name = "CatalogClientError";
    this.code = code;
    this.cachedPage = cachedPage;
  }
}

export interface CatalogClient extends CatalogProvider {
  peek(key: string): CatalogPage | undefined;
}

export function createCatalogClient(fetcher: Fetcher = fetch): CatalogClient {
  const cache = new Map<string, CatalogPage>();

  async function request(
    key: string,
    url: string,
    signal?: AbortSignal,
  ): Promise<CatalogPage> {
    try {
      const response = await fetcher(url, { signal, headers: { accept: "application/json" } });
      const body = await response.json() as CatalogPage | GatewayErrorBody;
      if (!response.ok) {
        const error = (body as GatewayErrorBody).error;
        throw new CatalogClientError(
          error?.code ?? "upstream_unavailable",
          error?.message ?? "The music catalog is unavailable.",
          cache.get(key),
        );
      }
      const page = body as CatalogPage;
      cache.set(key, page);
      return page;
    } catch (error) {
      if (error instanceof CatalogClientError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new CatalogClientError("aborted", "The request was cancelled.", cache.get(key));
      }
      throw new CatalogClientError(
        "offline",
        "You appear to be offline.",
        cache.get(key),
      );
    }
  }

  return {
    search(query, signal) {
      const normalized = query.trim();
      return request(
        `search:${normalized}`,
        `/api/catalog?mode=search&q=${encodeURIComponent(normalized)}`,
        signal,
      );
    },
    recommendations(era: EraId, signal?: AbortSignal) {
      return request(
        `recommendations:${era}`,
        `/api/catalog?mode=recommendations&era=${encodeURIComponent(era)}`,
        signal,
      );
    },
    peek(key) {
      return cache.get(key);
    },
  };
}

const catalogClient = createCatalogClient();

export function searchCatalog(query: string, signal?: AbortSignal): Promise<CatalogPage> {
  return catalogClient.search(query, signal);
}

export function getEraRecommendations(
  era: EraId,
  signal?: AbortSignal,
): Promise<CatalogPage> {
  return catalogClient.recommendations(era, signal);
}
