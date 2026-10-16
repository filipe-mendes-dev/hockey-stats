"use client";

import { useEffect, useState } from "react";

type WorkerStatus =
  "preparing" | "cached" | "failed" | "unsupported" | "development";

interface WorkerState {
  status: WorkerStatus;
  updateAvailable: boolean;
  retry(): void;
}

function checkAppCache(worker: ServiceWorker): Promise<boolean> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => finish(false), 5000);

    function finish(complete: boolean): void {
      window.clearTimeout(timeout);
      channel.port1.close();
      resolve(complete);
    }

    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      finish(
        typeof data === "object" &&
          data !== null &&
          "type" in data &&
          data.type === "APP_CACHE_STATUS" &&
          "complete" in data &&
          data.complete === true,
      );
    };
    channel.port1.onmessageerror = () => finish(false);
    worker.postMessage({ type: "CHECK_APP_CACHE" }, [channel.port2]);
  });
}

export function useServiceWorker(): WorkerState {
  const [status, setStatus] = useState<WorkerStatus>(
    process.env.NODE_ENV === "production" ? "preparing" : "development",
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    async function verifyCache(): Promise<void> {
      const controller = navigator.serviceWorker.controller;
      if (!controller) return;
      const complete = await checkAppCache(controller);
      if (!cancelled) setStatus(complete ? "cached" : "failed");
    }

    async function register(): Promise<void> {
      if (!("serviceWorker" in navigator)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const onControllerChange = () => void verifyCache();
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        onControllerChange,
      );
      cleanups.push(() =>
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          onControllerChange,
        ),
      );

      try {
        const registration = await navigator.serviceWorker.register(
          "/serwist/sw.js",
          {
            scope: "/",
            updateViaCache: "none",
          },
        );
        if (cancelled) return;

        function watchInstalling(): void {
          const worker = registration.installing;
          if (!worker) return;
          function onStateChange(): void {
            if (cancelled) return;
            if (worker?.state === "installed") {
              setUpdateAvailable(
                registration.waiting !== null && registration.active !== null,
              );
            } else if (worker?.state === "activated") {
              setUpdateAvailable(false);
              void verifyCache();
            } else if (worker?.state === "redundant" && !registration.active) {
              setStatus("failed");
            }
          }
          worker.addEventListener("statechange", onStateChange);
          cleanups.push(() =>
            worker.removeEventListener("statechange", onStateChange),
          );
        }

        setUpdateAvailable(
          registration.waiting !== null && registration.active !== null,
        );
        watchInstalling();
        registration.addEventListener("updatefound", watchInstalling);
        cleanups.push(() =>
          registration.removeEventListener("updatefound", watchInstalling),
        );
        await verifyCache();
        if (attempt > 0) await registration.update();
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    void register();
    return () => {
      cancelled = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, [attempt]);

  function retry(): void {
    setStatus("preparing");
    setAttempt((value) => value + 1);
  }

  return { status, updateAvailable, retry };
}
