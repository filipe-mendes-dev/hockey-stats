export type LocalDataChangeReason = "write" | "sync";
const changeEvent = "benchline.local-data-changed";
let channel: BroadcastChannel | undefined;

function getChannel(): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  channel ??= new BroadcastChannel(changeEvent);
  return channel;
}

export function notifyLocalDataChanged(
  reason: LocalDataChangeReason = "write",
): void {
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: reason }));
  getChannel()?.postMessage(reason);
}

export function subscribeLocalDataChanges(
  listener: (reason: LocalDataChangeReason) => void,
): () => void {
  function receiveLocal(event: Event): void {
    const detail: unknown =
      event instanceof CustomEvent ? event.detail : undefined;
    listener(detail === "sync" ? "sync" : "write");
  }
  function receiveRemote(event: MessageEvent<unknown>): void {
    if (event.data === "sync" || event.data === "write") listener(event.data);
  }
  const connection = getChannel();
  window.addEventListener(changeEvent, receiveLocal);
  connection?.addEventListener("message", receiveRemote);
  return () => {
    window.removeEventListener(changeEvent, receiveLocal);
    connection?.removeEventListener("message", receiveRemote);
  };
}
