export const offlinePagePaths = [
  "/app",
  "/app/matches",
  "/app/matches/new",
  "/app/matches/view",
  "/app/matches/start",
  "/app/matches/live",
  "/app/players",
  "/app/players/new",
  "/app/players/view",
  "/app/teams",
  "/app/teams/new",
  "/app/teams/view",
] as const;

export type OfflinePagePath = (typeof offlinePagePaths)[number];

export const routePayloadParameter = "__route_payload";

export function isOfflinePagePath(
  pathname: string,
): pathname is OfflinePagePath {
  return offlinePagePaths.some((path) => path === pathname);
}

export function getRoutePayloadCacheUrl(pathname: OfflinePagePath): string {
  return `${pathname}?${routePayloadParameter}=1`;
}
