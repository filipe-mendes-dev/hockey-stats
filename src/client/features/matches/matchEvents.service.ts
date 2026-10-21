import {
  isValidEventForMatch,
  validateMatchEvent,
  validateEventHistory,
  MatchRuleError,
} from "../../../domain/matches/matchRules";
import { deriveMatchState } from "../../../domain/matches/derivedMatchState";
import {
  addMatchEventInputSchema,
  eventMatchesInput,
  matchEventSchema,
} from "../../../domain/matches/matchEvent.schema";
import type {
  AddMatchEventInput,
  MatchEvent,
} from "../../../domain/matches/matchEvent.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { getMatchSnapshot, updateMatch } from "./matches.repository";
import {
  getMatchEvent,
  getLatestUndoEvent,
  getMatchHistoryEntry,
  listMatchEvents,
  insertMatchEvent,
  updateMatchEvent,
  saveMatchHistoryEntry,
} from "./matchEvents.repository";
export class MatchEventUnavailableError extends Error {
  constructor() {
    super("The Match, selected Player or event is unavailable or changed.");
    this.name = "MatchEventUnavailableError";
  }
}
const eventStores = [
  "metadata",
  "matches",
  "matchPlayers",
  "matchEvents",
  "matchHistory",
  "outbox",
];
export async function addMatchEvent(
  input: AddMatchEventInput,
): Promise<MatchEvent> {
  const fields = addMatchEventInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction("rw", eventStores, async () => {
    if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
    const existing = await getMatchEvent(fields.id);
    if (existing) {
      const history = await getMatchHistoryEntry(existing.id);
      if (
        !eventMatchesInput(existing, fields) ||
        history?.operationId !== fields.operationId
      )
        throw new MatchEventUnavailableError();
      return existing;
    }
    const snapshot = await getMatchSnapshot(fields.matchId);
    if (
      !snapshot ||
      snapshot.match.status !== "live" ||
      snapshot.match.currentPeriod !== fields.period ||
      !snapshot.match.periods.some((period) => period.number === fields.period)
    )
      throw new MatchEventUnavailableError();
    const events = await listMatchEvents(fields.matchId);
    const now = Math.max(
      Date.now(),
      fields.capturedAt,
      snapshot.match.updatedAt,
    );
    const { operationId, ...eventFields } = fields;
    const eligibility = validateMatchEvent(
      { snapshot, state: deriveMatchState(snapshot, events, fields) },
      fields,
    );
    if (!eligibility.allowed) throw new MatchRuleError(eligibility.reason);
    const event = matchEventSchema.parse({
      ...eventFields,
      order: (events.at(-1)?.order ?? 0) + 1,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    });
    if (
      !isValidEventForMatch(snapshot, event) ||
      !deriveMatchState(snapshot, [...events, event]).valid
    )
      throw new MatchEventUnavailableError();
    await insertMatchEvent(event);
    await updateMatch({
      ...snapshot.match,
      revision: snapshot.match.revision + 1,
      updatedAt: now,
    });
    await saveMatchHistoryEntry({
      id: event.id,
      matchId: event.matchId,
      operationId,
    });
    await insertOutboxOperation({
      operationId,
      entityId: event.matchId,
      status: "pending",
      command: {
        version: 5,
        operationId,
        kind: "matchEvent.create",
        expectedRevision: snapshot.match.revision,
        event,
      },
    });
    return event;
  });
  notifyLocalDataChanged("write", "matches");
  return result;
}
export interface UndoMatchEventInput {
  matchId: string;
  eventId: string;
}
export async function undoMatchEvent(
  input: UndoMatchEventInput,
): Promise<MatchEvent> {
  const database = await getDatabase();
  const result = await database.transaction("rw", eventStores, async () => {
    if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
    const snapshot = await getMatchSnapshot(input.matchId);
    const latest = await getLatestUndoEvent(input.matchId);
    if (
      !snapshot ||
      snapshot.match.status !== "live" ||
      !latest ||
      latest.id !== input.eventId
    )
      throw new MatchEventUnavailableError();
    const history = await getMatchHistoryEntry(latest.id);
    if (!history) throw new MatchEventUnavailableError();
    const now = Math.max(
      Date.now(),
      latest.updatedAt,
      snapshot.match.updatedAt,
    );
    const event = matchEventSchema.parse({
      ...latest,
      revision: latest.revision + 1,
      updatedAt: now,
      deletedAt: now,
    });
    const events = await listMatchEvents(input.matchId);
    const historyDecision = validateEventHistory(
      snapshot,
      events.map((entry) => (entry.id === event.id ? event : entry)),
    );
    if (!historyDecision.allowed)
      throw new MatchRuleError(historyDecision.reason);
    const operationId = crypto.randomUUID();
    await updateMatchEvent(event);
    await saveMatchHistoryEntry({ ...history, undoneAt: now });
    await updateMatch({
      ...snapshot.match,
      revision: snapshot.match.revision + 1,
      updatedAt: now,
    });
    await insertOutboxOperation({
      operationId,
      entityId: event.matchId,
      status: "pending",
      command: {
        version: 5,
        operationId,
        kind: "matchEvent.undo",
        expectedRevision: snapshot.match.revision,
        event,
      },
    });
    return event;
  });
  notifyLocalDataChanged("write", "matches");
  return result;
}
