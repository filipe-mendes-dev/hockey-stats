import { matchesDownloadSchema } from "../../../contracts/matches-sync.schema";
import { playersDownloadSchema } from "../../../contracts/players-sync.schema";
import { parseAcknowledgement } from "../../../contracts/sync.schema";
import { getBlockingOperation } from "./dependencies";
import {
  teamPlayersDownloadSchema,
  teamsDownloadSchema,
} from "../../../contracts/teams-sync.schema";
import type { LocalDataChange } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { AccountMismatchError } from "../account/account.service";
import { subscribeLocalDataChanges } from "../../storage/localDataEvents";
import { listOutboxOperations } from "./outbox.repository";
import {
  acknowledgeOperation,
  mergeDownloadedEntities,
  rejectOperation,
} from "./syncResults.service";
import { SyncRequestError, syncRequest } from "./sync.transport";

export interface SyncStatus {
  phase:
    | "idle"
    | "syncing"
    | "offline"
    | "signIn"
    | "mismatch"
    | "unsupported"
    | "failed";
  pending: number;
  blocked: number;
  accountName: string;
  lastSyncedAt: number | null;
}

const initialStatus: SyncStatus = {
  phase: "idle",
  pending: 0,
  blocked: 0,
  accountName: "",
  lastSyncedAt: null,
};
let status = initialStatus;
const listeners = new Set<() => void>();
let running: Promise<void> | undefined;
let controller: AbortController | undefined;
let stopped = true;
let rerun = false;
let forceRerun = false;
let retryTimer: number | undefined;
let retryDelay = 1000;
let retryNotBefore = 0;

export function getSyncStatus(): SyncStatus {
  return status;
}
export function getServerSyncStatus(): SyncStatus {
  return initialStatus;
}
export function subscribeSyncStatus(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function updateStatus(patch: Partial<SyncStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach((listener) => listener());
}

async function refreshCounts(): Promise<void> {
  const [identity, entries] = await Promise.all([
    getLocalIdentity(),
    listOutboxOperations(),
  ]);
  if (stopped) return;
  updateStatus({
    pending: entries.filter((entry) => entry.status === "pending").length,
    blocked: entries.filter((entry) => entry.status === "blocked").length,
    accountName: identity?.accountName ?? "",
  });
}

async function synchronize(signal: AbortSignal): Promise<void> {
  const identity = await getLocalIdentity();
  if (!identity || stopped || signal.aborted) return;
  await refreshCounts();
  if (!navigator.locks) {
    updateStatus({ phase: "unsupported" });
    return;
  }
  if (!navigator.onLine) {
    updateStatus({ phase: "offline" });
    return;
  }
  updateStatus({ phase: "syncing" });
  await navigator.locks.request(
    // Retain the lock name so older open Player-only tabs share the same lock.
    "benchline.players-sync",
    { signal },
    async () => {
      const operations = await listOutboxOperations();
      signal.throwIfAborted();
      for (const operation of operations) {
        if (
          operation.status === "blocked" ||
          getBlockingOperation(operation, await listOutboxOperations())
        )
          continue;
        try {
          const result = parseAcknowledgement(
            operation.command,
            await syncRequest(
              "/api/sync/commands",
              identity.ownerUserId,
              signal,
              JSON.stringify(operation.command),
            ),
          );
          if (result.operationId !== operation.operationId)
            throw new Error("Unexpected operation acknowledgement.");
          await acknowledgeOperation(identity.ownerUserId, result, signal);
        } catch (error: unknown) {
          signal.throwIfAborted();
          if (
            error instanceof SyncRequestError &&
            [400, 409, 415, 422].includes(error.status)
          ) {
            await rejectOperation(
              identity.ownerUserId,
              operation.operationId,
              error.code,
              signal,
            );
            continue;
          }
          throw error;
        }
      }
      const download = playersDownloadSchema.parse(
        await syncRequest("/api/sync/players", identity.ownerUserId, signal),
      );
      if (download.ownerUserId !== identity.ownerUserId)
        throw new AccountMismatchError();
      await mergeDownloadedEntities(identity.ownerUserId, download, signal);
      const teamsDownload = teamsDownloadSchema.parse(
        await syncRequest("/api/sync/teams", identity.ownerUserId, signal),
      );
      await mergeDownloadedEntities(
        identity.ownerUserId,
        teamsDownload,
        signal,
      );
      await mergeDownloadedEntities(
        identity.ownerUserId,
        teamPlayersDownloadSchema.parse(
          await syncRequest(
            "/api/sync/team-players",
            identity.ownerUserId,
            signal,
          ),
        ),
        signal,
      );
      await mergeDownloadedEntities(
        identity.ownerUserId,
        matchesDownloadSchema.parse(
          await syncRequest("/api/sync/matches", identity.ownerUserId, signal),
        ),
        signal,
      );
      signal.throwIfAborted();
      retryDelay = 1000;
      retryNotBefore = 0;
      updateStatus({ phase: "idle", lastSyncedAt: Date.now() });
      await refreshCounts();
    },
  );
}

function scheduleRetry(error: unknown): void {
  const requestedDelay =
    error instanceof SyncRequestError ? error.retryAfterMs : 0;
  const delay = Math.max(retryDelay, Math.min(requestedDelay, 300_000));
  retryNotBefore = Date.now() + delay;
  retryDelay = Math.min(retryDelay * 2, 60_000);
  window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => {
    void requestSynchronization();
  }, delay);
}

export function requestSynchronization(force = false): Promise<void> {
  if (stopped) return Promise.resolve();
  if (running) {
    rerun = true;
    forceRerun ||= force;
    return running;
  }
  if (
    !force &&
    (["signIn", "mismatch", "unsupported"].includes(status.phase) ||
      Date.now() < retryNotBefore)
  )
    return Promise.resolve();
  if (force) retryNotBefore = 0;
  window.clearTimeout(retryTimer);
  const cycle = new AbortController();
  controller = cycle;
  running = synchronize(cycle.signal)
    .catch((error: unknown) => {
      if (stopped || cycle.signal.aborted) return;
      if (
        error instanceof AccountMismatchError ||
        (error instanceof SyncRequestError && error.code === "account_mismatch")
      )
        updateStatus({ phase: "mismatch" });
      else if (error instanceof SyncRequestError && error.status === 401)
        updateStatus({ phase: "signIn" });
      else {
        updateStatus({ phase: navigator.onLine ? "failed" : "offline" });
        scheduleRetry(error);
      }
    })
    .finally(async () => {
      try {
        if (!stopped) await refreshCounts();
      } catch {
        if (!stopped) updateStatus({ phase: "failed" });
      }
      running = undefined;
      if (controller === cycle) controller = undefined;
      if (rerun && !stopped) {
        const forceNextCycle = forceRerun;
        rerun = false;
        forceRerun = false;
        void requestSynchronization(forceNextCycle);
      }
    });
  return running;
}

export function stopSynchronization(): void {
  stopped = true;
  rerun = false;
  forceRerun = false;
  window.clearTimeout(retryTimer);
  controller?.abort();
}

export function resumeSynchronization(): void {
  stopped = false;
  retryNotBefore = 0;
  void requestSynchronization(true);
}

export function startSynchronization(): () => void {
  resumeSynchronization();
  function wake(): void {
    if (document.visibilityState === "visible") {
      retryNotBefore = 0;
      void requestSynchronization(true);
    }
  }
  function localChange(change: LocalDataChange): void {
    void refreshCounts().catch(() => {
      if (!stopped) updateStatus({ phase: "failed" });
    });
    if (change.reason === "write") void requestSynchronization();
  }
  const unsubscribe = subscribeLocalDataChanges(localChange);
  function wentOffline(): void {
    if (!stopped && status.phase !== "unsupported")
      updateStatus({ phase: "offline" });
  }
  window.addEventListener("online", wake);
  window.addEventListener("offline", wentOffline);
  window.addEventListener("focus", wake);
  document.addEventListener("visibilitychange", wake);
  const interval = window.setInterval(() => {
    if (document.visibilityState === "visible") void requestSynchronization();
  }, 60_000);
  return () => {
    stopSynchronization();
    unsubscribe();
    window.removeEventListener("online", wake);
    window.removeEventListener("offline", wentOffline);
    window.removeEventListener("focus", wake);
    document.removeEventListener("visibilitychange", wake);
    window.clearInterval(interval);
  };
}
