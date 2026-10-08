import type { EraId } from "../../features/eras/types";
import type { Track } from "../../features/player/types";

export interface CatalogPage {
  items: Track[];
  nextCursor?: string;
}

export type CatalogErrorCode =
  | "aborted"
  | "offline"
  | "invalid_query"
  | "invalid_mode"
  | "invalid_era"
  | "invalid_limit"
  | "misconfigured"
  | "quota_exceeded"
  | "upstream_unavailable";

export interface CatalogProvider {
  search(query: string, signal?: AbortSignal): Promise<CatalogPage>;
  recommendations(era: EraId, signal?: AbortSignal): Promise<CatalogPage>;
}
