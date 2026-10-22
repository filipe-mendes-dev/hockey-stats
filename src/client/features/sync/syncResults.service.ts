import {
  getEntityDeletion,
  deletionStores,
} from "../removal/deletions.repository";
import { applyDownloadedDeletions } from "../removal/deletionsSync.service";
import { matchEventSchema } from "../../../domain/matches/matchEvent.schema";
import {
  updateMatchEvent,
  replaceMatchEvents,
} from "../matches/matchEvents.repository";
import { matchSchema } from "../../../domain/matches/match.schema";
import { replaceMatchSnapshot } from "../matches/matches.repository";
import type {
  SyncAcknowledgement,
  SyncDownload,
} from "../../../contracts/sync.schema";
import { getCommandFeature } from "../../../contracts/sync.schema";
import { teamPlayerSchema } from "../../../domain/teams/teamPlayer.schema";
import { playerSchema } from "../../../domain/players/player.schema";
import { teamSchema } from "../../../domain/teams/team.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { AccountMismatchError } from "../account/account.service";
import {
  blockOutboxOperation,
  deleteOutboxOperation,
  getOutboxOperation,
  listOutboxOperations,
} from "./outbox.repository";

async function requireOwner(
  expectedOwner: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if ((await getLocalIdentity())?.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  signal.throwIfAborted();
}

export async function acknowledgeOperation(
  expectedOwner: string,
  acknowledgement: SyncAcknowledgement,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (acknowledgement.ownerUserId !== expectedOwner)
    throw new AccountMismatchError();
  if ("deletions" in acknowledgement) {
    const database = await getDatabase();
    await database.transaction("rw", deletionStores, async () => {
      await requireOwner(expectedOwner, signal);
      const operation = await getOutboxOperation(acknowledgement.operationId);
      if (!operation || !("deletedAt" in operation.command)) return;
      const feature = getCommandFeature(operation.command);
      if (
        !acknowledgement.deletions.some(
          (entry) =>
            entry.feature === feature && entry.id === operation.entityId,
        )
      )
        throw new Error("Acknowledgement refers to another deletion.");
      await applyDownloadedDeletions(acknowledgement.deletions);
      signal.throwIfAborted();
      await deleteOutboxOperation(operation.operationId);
    });
    notifyLocalDataChanged("sync", "all");
    return;
  }
  if ("event" in acknowledgement) {
    const database = await getDatabase();
    await database.transaction(
      "rw",
      ["metadata", "matches", "matchEvents", "outbox", "entityDeletions"],
      async () => {
        await requireOwner(expectedOwner, signal);
        const operation = await getOutboxOperation(acknowledgement.operationId);
        if (!operation) return;
        if (
          !("event" in operation.command) ||
          operation.entityId !== acknowledgement.matchId ||
          operation.command.event.id !== acknowledgement.event.id
        )
          throw new Error("Acknowledgement refers to another event.");
        if (await getEntityDeletion("matches", acknowledgement.matchId)) {
          await deleteOutboxOperation(operation.operationId);
          return;
        }
        const row = await database
          .table<unknown, string>("matches")
          .get(acknowledgement.matchId);
        const match = row === undefined ? null : matchSchema.parse(row);
        if (!match) throw new Error("The event Match is unavailable.");
        const stored = await database
          .table<unknown, string>("matchEvents")
          .get(acknowledgement.event.id);
        const current =
          stored === undefined ? null : matchEventSchema.parse(stored);
        if (!current || current.revision <= acknowledgement.event.revision)
          await updateMatchEvent(acknowledgement.event);
        if (match.revision <= acknowledgement.matchRevision)
          await database.table("matches").put({
            ...match,
            revision: acknowledgement.matchRevision,
            updatedAt: Math.max(
              match.updatedAt,
              acknowledgement.event.updatedAt,
            ),
          });
        signal.throwIfAborted();
        await deleteOutboxOperation(operation.operationId);
      },
    );
    notifyLocalDataChanged("sync", "matches");
    return;
  }
  if ("match" in acknowledgement) {
    const database = await getDatabase();
    await database.transaction(
      "rw",
      ["metadata", "matches", "matchPlayers", "outbox", "entityDeletions"],
      async () => {
        await requireOwner(expectedOwner, signal);
        const operation = await getOutboxOperation(acknowledgement.operationId);
        if (!operation) return;
        if (
          getCommandFeature(operation.command) !== "matches" ||
          operation.entityId !== acknowledgement.match.id
        )
          throw new Error("Acknowledgement refers to another Match.");
        if (await getEntityDeletion("matches", acknowledgement.match.id)) {
          await deleteOutboxOperation(operation.operationId);
          return;
        }
        const row = await database
          .table<unknown, string>("matches")
          .get(acknowledgement.match.id);
        const current = row === undefined ? null : matchSchema.parse(row);
        signal.throwIfAborted();
        if (!current || current.revision <= acknowledgement.match.revision)
          await replaceMatchSnapshot(acknowledgement);
        signal.throwIfAborted();
        await deleteOutboxOperation(operation.operationId);
      },
    );
    notifyLocalDataChanged("sync", "matches");
    return;
  }
  const isPlayer = "player" in acknowledgement;
  const feature = isPlayer
    ? "players"
    : "team" in acknowledgement
      ? "teams"
      : "teamPlayers";
  const entity = isPlayer
    ? acknowledgement.player
    : "team" in acknowledgement
      ? acknowledgement.team
      : acknowledgement.teamPlayer;
  const schema = isPlayer
    ? playerSchema
    : "team" in acknowledgement
      ? teamSchema
      : teamPlayerSchema;
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", feature, "outbox", "entityDeletions"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const operation = await getOutboxOperation(acknowledgement.operationId);
      if (!operation) return;
      if (
        operation.entityId !== entity.id ||
        getCommandFeature(operation.command) !== feature
      )
        throw new Error("Acknowledgement refers to another entity.");
      const table = database.table<unknown, string>(feature);
      const row = await table.get(entity.id);
      const current = row === undefined ? null : schema.parse(row);
      signal.throwIfAborted();
      if (
        !(await getEntityDeletion(feature, entity.id)) &&
        (!current || current.revision <= entity.revision)
      )
        await table.put(entity);
      await deleteOutboxOperation(operation.operationId);
    },
  );
  notifyLocalDataChanged("sync", feature);
}

export async function mergeDownloadedEntities(
  expectedOwner: string,
  download: SyncDownload,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  if (download.ownerUserId !== expectedOwner) throw new AccountMismatchError();
  if ("deletions" in download) {
    const database = await getDatabase();
    await database.transaction("rw", deletionStores, async () => {
      await requireOwner(expectedOwner, signal);
      await applyDownloadedDeletions(download.deletions);
      signal.throwIfAborted();
    });
    notifyLocalDataChanged("sync", "all");
    return;
  }
  if ("matches" in download) {
    const database = await getDatabase();
    await database.transaction(
      "rw",
      [
        "metadata",
        "matches",
        "matchPlayers",
        "matchEvents",
        "outbox",
        "entityDeletions",
      ],
      async () => {
        await requireOwner(expectedOwner, signal);
        const pending = new Set(
          (await listOutboxOperations())
            .filter((entry) => getCommandFeature(entry.command) === "matches")
            .map((entry) => entry.entityId),
        );
        for (const snapshot of download.matches) {
          signal.throwIfAborted();
          if (
            pending.has(snapshot.match.id) ||
            (await getEntityDeletion("matches", snapshot.match.id))
          )
            continue;
          const row = await database
            .table<unknown, string>("matches")
            .get(snapshot.match.id);
          const current = row === undefined ? null : matchSchema.parse(row);
          if (!current || current.revision <= snapshot.match.revision) {
            await replaceMatchSnapshot(snapshot);
            await replaceMatchEvents(snapshot.match.id, snapshot.events);
          }
        }
        signal.throwIfAborted();
      },
    );
    notifyLocalDataChanged("sync", "matches");
    return;
  }
  const isPlayers = "players" in download;
  const feature = isPlayers
    ? "players"
    : "teams" in download
      ? "teams"
      : "teamPlayers";
  const records = isPlayers
    ? download.players
    : "teams" in download
      ? download.teams
      : download.teamPlayers;
  const schema = isPlayers
    ? playerSchema
    : "teams" in download
      ? teamSchema
      : teamPlayerSchema;
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", feature, "outbox", "entityDeletions"],
    async () => {
      await requireOwner(expectedOwner, signal);
      const pendingIds = new Set(
        (await listOutboxOperations())
          .filter((entry) => getCommandFeature(entry.command) === feature)
          .map((entry) => entry.entityId),
      );
      const table = database.table<unknown, string>(feature);
      for (const entity of records) {
        signal.throwIfAborted();
        if (
          pendingIds.has(entity.id) ||
          (await getEntityDeletion(feature, entity.id))
        )
          continue;
        const row = await table.get(entity.id);
        const current = row === undefined ? null : schema.parse(row);
        if (!current || current.revision <= entity.revision)
          await table.put(entity);
      }
    },
  );
  notifyLocalDataChanged("sync", feature);
}

export async function rejectOperation(
  expectedOwner: string,
  operationId: string,
  code: string,
  signal: AbortSignal,
): Promise<void> {
  signal.throwIfAborted();
  const database = await getDatabase();
  await database.transaction("rw", ["metadata", "outbox"], async () => {
    await requireOwner(expectedOwner, signal);
    await blockOutboxOperation(operationId, code);
  });
  notifyLocalDataChanged("sync");
}
