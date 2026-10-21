import {
  isValidEventForMatch,
  validateMatchEvent,
  validateEventHistory,
} from "../../../domain/matches/matchRules";
import "server-only";
import { deriveMatchState } from "../../../domain/matches/derivedMatchState";
import type { DatabaseTransaction } from "../../db/client.ts";
import { db } from "../../db/client.ts";
import type { MatchEventCommand } from "../../../contracts/match-events-sync.schema";
import {
  usesPowerplayProtocol,
  usesEventContextProtocol,
} from "../../../contracts/match-events-sync.schema";
import { matchRecordingSchema } from "../../../contracts/matches-sync.schema";
import {
  matchEventSchema,
  toMatchEventInput,
} from "../../../domain/matches/matchEvent.schema";
import {
  getOwnedMatchForUpdate,
  listMatchSnapshotsForOwner,
  getMatchSnapshotForOwner,
} from "./matches.repository";
import {
  listMatchEvents,
  listOwnedMatchEvents,
  insertMatchEvent,
  updateMatchEvent,
  updateMatchRevision,
} from "./matchEvents.repository";
import { SyncConflictError } from "../sync/sync.errors";
export async function applyMatchEventCommand(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  command: MatchEventCommand,
): Promise<void> {
  const event = command.event;
  const match = await getOwnedMatchForUpdate(
    transaction,
    ownerUserId,
    event.matchId,
  );
  if (
    !match ||
    match.status !== "live" ||
    match.revision !== command.expectedRevision
  )
    throw new SyncConflictError("revision_conflict");
  const snapshot = await getMatchSnapshotForOwner(
    transaction,
    ownerUserId,
    match.id,
  );
  if (
    !snapshot ||
    !isValidEventForMatch(snapshot, event) ||
    !match.periods.some((period) => period.number === event.period) ||
    event.updatedAt < match.updatedAt
  )
    throw new SyncConflictError("reference_unavailable");
  const events = await listMatchEvents(transaction, match.id);
  if (command.version < 3 && events.some(usesPowerplayProtocol))
    throw new SyncConflictError("event_conflict");
  if (command.version < 4 && events.some(usesEventContextProtocol))
    throw new SyncConflictError("event_conflict");
  if (command.kind === "matchEvent.create") {
    if (command.version >= 3) {
      const decision = validateMatchEvent(
        { snapshot, state: deriveMatchState(snapshot, events) },
        toMatchEventInput(event, command.operationId),
      );
      if (!decision.allowed) throw new SyncConflictError("event_conflict");
    }
    if (
      event.period !== match.currentPeriod ||
      !deriveMatchState(snapshot, [...events, event]).valid
    )
      throw new SyncConflictError("event_conflict");
    if (
      event.order !== (events.at(-1)?.order ?? 0) + 1 ||
      !(await insertMatchEvent(transaction, event))
    )
      throw new SyncConflictError("event_conflict");
  } else {
    const current = events
      .filter((entry) => entry.deletedAt === undefined)
      .at(-1);
    if (
      !current ||
      (command.version >= 3 &&
        !validateEventHistory(
          snapshot,
          events.map((entry) => (entry.id === event.id ? event : entry)),
        ).allowed) ||
      !deriveMatchState(
        snapshot,
        events.map((entry) => (entry.id === event.id ? event : entry)),
      ).valid ||
      current.id !== event.id ||
      event.updatedAt < current.updatedAt ||
      JSON.stringify(
        matchEventSchema.parse({
          ...current,
          revision: current.revision + 1,
          updatedAt: event.updatedAt,
          deletedAt: event.deletedAt,
        }),
      ) !== JSON.stringify(event) ||
      !(await updateMatchEvent(transaction, event))
    )
      throw new SyncConflictError("event_conflict");
  }
  if (
    !(await updateMatchRevision(
      transaction,
      match.id,
      command.expectedRevision,
      event.updatedAt,
    ))
  )
    throw new SyncConflictError("revision_conflict");
}
export async function listMatchRecordingsForOwner(ownerUserId: string) {
  return db.transaction(
    async (transaction) => {
      const snapshots = await listMatchSnapshotsForOwner(
        ownerUserId,
        transaction,
      );
      const events = await listOwnedMatchEvents(transaction, ownerUserId);
      return snapshots.map((snapshot) =>
        matchRecordingSchema.parse({
          ...snapshot,
          events: events.filter((event) => event.matchId === snapshot.match.id),
        }),
      );
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
