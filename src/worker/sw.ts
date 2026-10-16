/// <reference lib="webworker" />

import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  getRoutePayloadCacheUrl,
  isOfflinePagePath,
  routePayloadParameter,
} from "../offline-pages";
import { offlineRoutePrecachePlugin } from "./offline-route-payloads";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: Array<PrecacheEntry | string> | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST ?? [],
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: [],
  precacheOptions: {
    cleanURLs: false,
    ignoreURLParametersMatching: [],
    plugins: [offlineRoutePrecachePlugin],
  },
});

self.addEventListener("install", serwist.handleInstall);
self.addEventListener("activate", serwist.handleActivate);
self.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.searchParams.has(routePayloadParameter)
  ) {
    return;
  }
  const isRoutePayload =
    request.headers.get("rsc") === "1" ||
    request.headers.get("accept")?.includes("text/x-component");

  if (isOfflinePagePath(url.pathname)) {
    if (
      isRoutePayload &&
      !request.headers.has("next-router-prefetch") &&
      !request.headers.has("next-router-segment-prefetch")
    ) {
      event.respondWith(
        serwist
          .matchPrecache(getRoutePayloadCacheUrl(url.pathname))
          .then((cached) => cached ?? fetch(request)),
      );
    } else if (
      request.mode === "navigate" &&
      !isRoutePayload &&
      !url.searchParams.has("_rsc")
    ) {
      event.respondWith(
        serwist
          .matchPrecache(url.pathname)
          .then((cached) => cached ?? fetch(request)),
      );
    }
    return;
  }

  if (
    isRoutePayload ||
    request.headers.has("next-router-prefetch") ||
    url.searchParams.has("_rsc")
  ) {
    return;
  }
  serwist.handleFetch(event);
});

self.addEventListener("message", (event: ExtendableMessageEvent) => {
  const data: unknown = event.data;
  const port = event.ports[0];
  if (
    !port ||
    typeof data !== "object" ||
    data === null ||
    !("type" in data) ||
    data.type !== "CHECK_APP_CACHE"
  ) {
    return;
  }

  event.waitUntil(
    Promise.all(
      serwist.getPrecachedUrls().map((url) => serwist.matchPrecache(url)),
    )
      .then((responses) => {
        port.postMessage({
          type: "APP_CACHE_STATUS",
          complete:
            responses.length > 0 && responses.every((response) => response?.ok),
        });
      })
      .catch(() => {
        port.postMessage({ type: "APP_CACHE_STATUS", complete: false });
      }),
  );
});
