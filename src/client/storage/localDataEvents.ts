export type LocalDataChangeReason = "write" | "sync";
export type LocalDataFeature = "players" | "teams" | "all";
export interface LocalDataChange {
  reason: LocalDataChangeReason;
  feature: LocalDataFeature;
}
const changeEvent = "benchline.local-data-changed";
let channel: BroadcastChannel | undefined;

function getChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel(changeEvent);
  return channel;
}

function parseChange(value: unknown): LocalDataChange | null {
  // Accept notifications from tabs running the preceding app version.
  if (value === "write" || value === "sync")
    return { reason: value, feature: "all" };
  if (
    typeof value !== "object" ||
    value === null ||
    !("reason" in value) ||
    !("feature" in value)
  )
    return null;
  const { reason, feature } = value;
  if (
    (reason === "write" || reason === "sync") &&
    (feature === "players" || feature === "teams" || feature === "all")
  )
    return { reason, feature };
  return null;
}

export function notifyLocalDataChanged(
  reason: LocalDataChangeReason = "write",
  feature: LocalDataFeature = "all",
): void {
  const change: LocalDataChange = { reason, feature };
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: change }));
  getChannel()?.postMessage(change);
}

export function subscribeLocalDataChanges(
  listener: (change: LocalDataChange) => void,
): () => void {
  function receiveLocal(event: Event): void {
    const change = parseChange(
      event instanceof CustomEvent ? event.detail : undefined,
    );
    if (change) listener(change);
  }
  function receiveRemote(event: MessageEvent<unknown>): void {
    const change = parseChange(event.data);
    if (change) listener(change);
  }
  const connection = getChannel();
  window.addEventListener(changeEvent, receiveLocal);
  connection?.addEventListener("message", receiveRemote);
  return () => {
    window.removeEventListener(changeEvent, receiveLocal);
    connection?.removeEventListener("message", receiveRemote);
  };
}
