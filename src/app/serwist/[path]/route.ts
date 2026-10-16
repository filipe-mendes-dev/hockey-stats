import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createSerwistRoute } from "@serwist/turbopack";

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "src/worker/sw.ts",
    useNativeEsbuild: true,
    esbuildOptions: { format: "iife", sourcemap: false },
    globPatterns: [
      ".next/static/**/*.{js,css,woff,woff2}",
      "public/icons/*.png",
    ],
    manifestTransforms: [
      async (entries) => {
        const hash = createHash("sha256").update(JSON.stringify(entries));
        hash.update(readFileSync("src/app/layout.tsx"));
        hash.update(readFileSync("src/app/app/page.tsx"));
        hash.update(readFileSync("src/app/icon.svg"));
        hash.update(readFileSync("src/app/favicon.ico"));
        hash.update(readFileSync("src/app/manifest.ts"));
        const revision = hash.digest("hex");
        return {
          manifest: [
            ...entries,
            { url: "/app", revision, size: 0 },
            { url: "/manifest.webmanifest", revision, size: 0 },
            { url: "/icon.svg", revision, size: 0 },
            { url: "/favicon.ico", revision, size: 0 },
          ],
          warnings: [],
        };
      },
    ],
  });
