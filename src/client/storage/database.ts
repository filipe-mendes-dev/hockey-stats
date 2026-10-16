import { Dexie } from "dexie";

export interface LocalWorkspaceIdentity {
  key: "workspace";
  workspaceId: string;
  createdAt: number;
}

export function createLocalDatabase(): Dexie {
  const database = new Dexie("benchline-stats", {
    autoOpen: false,
    chromeTransactionDurability: "strict",
  });

  database.version(1).stores({ metadata: "key" });
  return database;
}

function parseWorkspaceIdentity(value: unknown): LocalWorkspaceIdentity {
  if (
    typeof value !== "object" ||
    value === null ||
    !("key" in value) ||
    value.key !== "workspace" ||
    !("workspaceId" in value) ||
    typeof value.workspaceId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.workspaceId,
    ) ||
    !("createdAt" in value) ||
    typeof value.createdAt !== "number" ||
    !Number.isSafeInteger(value.createdAt) ||
    value.createdAt <= 0
  ) {
    throw new Error(
      "Invalid local workspace identity; existing data retained.",
    );
  }

  return {
    key: "workspace",
    workspaceId: value.workspaceId,
    createdAt: value.createdAt,
  };
}

export async function initializeLocalWorkspace(
  database: Dexie,
): Promise<LocalWorkspaceIdentity> {
  const metadata = database.table<LocalWorkspaceIdentity, string>("metadata");

  return database.transaction("rw", metadata, async () => {
    const stored: unknown = await metadata.get("workspace");

    if (stored === undefined) {
      const workspace: LocalWorkspaceIdentity = {
        key: "workspace",
        workspaceId: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      await metadata.add(workspace);
      return workspace;
    }

    const workspace = parseWorkspaceIdentity(stored);
    // Rewriting the validated identity verifies write access on every launch.
    await metadata.put(workspace);
    return workspace;
  });
}
