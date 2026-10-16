export type StoragePersistence =
  "persistent" | "bestEffort" | "unsupported" | "failed";

export async function requestStoragePersistence(): Promise<StoragePersistence> {
  try {
    const storage = navigator.storage;
    if (!storage || typeof storage.persisted !== "function") {
      return "unsupported";
    }
    if (await storage.persisted()) return "persistent";
    if (typeof storage.persist !== "function") return "unsupported";
    return (await storage.persist()) ? "persistent" : "bestEffort";
  } catch {
    return "failed";
  }
}
