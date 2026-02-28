import { appConfig } from "./config";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function buildAbelianTxUrl(txHash: string): string {
  const base = normalizeBaseUrl(appConfig.abelianExplorerBaseUrl);
  return `${base}/tx/${encodeURIComponent(txHash)}`;
}

