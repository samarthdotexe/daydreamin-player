import type { Track } from "../../src/features/player/types";
import type { EraId } from "../../src/features/eras/types";

export interface CatalogPage {
  items: Track[];
  nextCursor?: string;
}

export type CatalogErrorCode =
  | "invalid_query"
  | "invalid_mode"
  | "invalid_era"
  | "invalid_limit"
  | "misconfigured"
  | "rate_limited"
  | "quota_exceeded"
  | "upstream_unavailable";

export interface CatalogErrorBody {
  error: {
    code: CatalogErrorCode;
    message: string;
  };
}

export interface CatalogProvider {
  search(query: string, cursor?: string): Promise<CatalogPage>;
  recommendations(era: EraId, cursor?: string): Promise<CatalogPage>;
}

export interface CatalogEnvironment {
  YOUTUBE_API_KEY?: string;
  CATALOG_RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
}
