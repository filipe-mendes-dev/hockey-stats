import type { SerwistPlugin } from "serwist";
import { isOfflinePagePath, routePayloadParameter } from "../offline-pages";

export const offlineRoutePrecachePlugin: SerwistPlugin = {
  async requestWillFetch({ request }) {
    const url = new URL(request.url);
    if (!isOfflinePagePath(url.pathname)) return request;

    if (url.searchParams.has(routePayloadParameter)) {
      url.search = "?_rsc";
      return new Request(url, {
        headers: { rsc: "1", accept: "text/x-component" },
        credentials: "omit",
        cache: "reload",
      });
    }

    return new Request(request, { credentials: "omit" });
  },

  async fetchDidSucceed({ request, response }) {
    const url = new URL(request.url);
    if (isOfflinePagePath(url.pathname)) {
      const expectedType =
        request.headers.get("rsc") === "1" ? "text/x-component" : "text/html";
      if (
        !response.ok ||
        response.redirected ||
        !response.headers.get("content-type")?.includes(expectedType)
      ) {
        throw new Error(
          `Invalid public page cache response for ${url.pathname}`,
        );
      }
    }
    return response;
  },
};
