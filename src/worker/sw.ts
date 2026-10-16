/// <reference lib="webworker" />

import { Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

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
  precacheOptions: { cleanURLs: false, ignoreURLParametersMatching: [] },
});

self.addEventListener("install", serwist.handleInstall);
self.addEventListener("activate", serwist.handleActivate);
self.addEventListener("fetch", (event: FetchEvent) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    (url.pathname === "/app" && request.mode !== "navigate")
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
