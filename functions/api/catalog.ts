import { handleCatalogRequest } from "../lib/catalog";
import type { CatalogEnvironment } from "../lib/types";

interface PagesFunctionContext {
  request: Request;
  env: CatalogEnvironment;
}

export function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  return handleCatalogRequest(context.request, context.env, fetch);
}
