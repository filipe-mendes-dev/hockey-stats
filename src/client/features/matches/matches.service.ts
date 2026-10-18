import {
  createMatchInputSchema,
  updateMatchSetupInputSchema,
  startMatchInputSchema,
  matchSnapshotSchema,
} from "../../../domain/matches/match.schema";
import type {
  CreateMatchInput,
  UpdateMatchSetupInput,
  StartMatchInput,
  MatchPlayer,
  MatchSnapshot,
} from "../../../domain/matches/match.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { getTeamById } from "../teams/teams.repository";
import { listTeamPlayers } from "../teams/teamPlayers.repository";
import { getPlayerById } from "../players/players.repository";
import { insertOutboxOperation } from "../sync/outbox.repository";
import {
  getMatchSnapshot,
  replaceMatchSnapshot,
  insertMatchSnapshot,
} from "./matches.repository";
export class MatchReferencesUnavailableError extends Error {
  constructor() {
    super("The Team or selected Players are no longer available.");
    this.name = "MatchReferencesUnavailableError";
  }
}
export async function createMatch(
  input: CreateMatchInput,
): Promise<MatchSnapshot> {
  const fields = createMatchInputSchema.parse(input);
  const database = await getDatabase();
  const snapshot = await database.transaction(
    "rw",
    [
      "metadata",
      "teams",
      "players",
      "teamPlayers",
      "matches",
      "matchPlayers",
      "outbox",
    ],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const team = await getTeamById(fields.teamId);
      if (!team || team.archivedAt) throw new MatchReferencesUnavailableError();
      const memberships = await listTeamPlayers(team.id);
      const id = crypto.randomUUID();
      const players: MatchPlayer[] = [];
      for (const selection of fields.players) {
        const player = await getPlayerById(selection.playerId);
        if (
          !player ||
          player.archivedAt ||
          !memberships.some((entry) => entry.playerId === player.id)
        )
          throw new MatchReferencesUnavailableError();
        players.push({
          ...selection,
          id: crypto.randomUUID(),
          matchId: id,
          playerNameAtMatch: player.name,
          isStarter: false as const,
        });
      }
      const now = Date.now();
      const result = matchSnapshotSchema.parse({
        match: {
          id,
          teamId: team.id,
          teamNameAtMatch: team.name,
          opponentName: fields.opponentName,
          scheduledDate: fields.scheduledDate,
          venueRole: fields.venueRole,
          status: "setup",
          revision: 1,
          createdAt: now,
          updatedAt: now,
        },
        players,
      });
      const operationId = crypto.randomUUID();
      await insertMatchSnapshot(result);
      await insertOutboxOperation({
        operationId,
        entityId: id,
        status: "pending",
        command: { version: 1, operationId, kind: "match.create", ...result },
      });
      return result;
    },
  );
  notifyLocalDataChanged("write", "matches");
  return snapshot;
}

export class MatchChangedError extends Error {
  constructor() {
    super(
      "Match setup changed or has already started. Reopen the form to load the latest version.",
    );
    this.name = "MatchChangedError";
  }
}
export async function updateMatchSetup(
  input: UpdateMatchSetupInput,
): Promise<MatchSnapshot> {
  const fields = updateMatchSetupInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    [
      "metadata",
      "matches",
      "matchPlayers",
      "teams",
      "players",
      "teamPlayers",
      "outbox",
    ],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getMatchSnapshot(fields.id);
      if (
        !current ||
        current.match.status !== "setup" ||
        current.match.revision !== fields.expectedRevision ||
        current.match.teamId !== fields.teamId
      )
        throw new MatchChangedError();
      const members = await listTeamPlayers(fields.teamId);
      const players: MatchPlayer[] = [];
      for (const selection of fields.players) {
        const existing = current.players.find(
          (player) => player.playerId === selection.playerId,
        );
        if (existing) {
          players.push({
            ...existing,
            jerseyNumber: selection.jerseyNumber,
            role: selection.role,
          });
          continue;
        }
        const player = await getPlayerById(selection.playerId);
        if (
          !player ||
          player.archivedAt ||
          !members.some((member) => member.playerId === player.id)
        )
          throw new MatchReferencesUnavailableError();
        players.push({
          ...selection,
          id: crypto.randomUUID(),
          matchId: current.match.id,
          playerNameAtMatch: player.name,
          isStarter: false,
        });
      }
      const snapshot = matchSnapshotSchema.parse({
        match: {
          ...current.match,
          opponentName: fields.opponentName,
          scheduledDate: fields.scheduledDate,
          venueRole: fields.venueRole,
          revision: current.match.revision + 1,
          updatedAt: Math.max(Date.now(), current.match.updatedAt),
        },
        players,
      });
      const operationId = crypto.randomUUID();
      await replaceMatchSnapshot(snapshot);
      await insertOutboxOperation({
        operationId,
        entityId: snapshot.match.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "match.updateSetup",
          expectedRevision: current.match.revision,
          ...snapshot,
        },
      });
      return snapshot;
    },
  );
  notifyLocalDataChanged("write", "matches");
  return result;
}
export async function startMatch(
  input: StartMatchInput,
): Promise<MatchSnapshot> {
  const fields = startMatchInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    ["metadata", "matches", "matchPlayers", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getMatchSnapshot(fields.id);
      if (
        !current ||
        current.match.status !== "setup" ||
        current.match.revision !== fields.expectedRevision
      )
        throw new MatchChangedError();
      if (
        !fields.starterIds.every((id) =>
          current.players.some((player) => player.id === id),
        )
      )
        throw new MatchChangedError();
      const now = Math.max(Date.now(), current.match.updatedAt);
      const snapshot = matchSnapshotSchema.parse({
        match: {
          ...current.match,
          revision: current.match.revision + 1,
          status: "live",
          periods: fields.periods,
          startedAt: now,
          updatedAt: now,
        },
        players: current.players.map((player) => ({
          ...player,
          isStarter: fields.starterIds.includes(player.id),
        })),
      });
      const operationId = crypto.randomUUID();
      await replaceMatchSnapshot(snapshot);
      await insertOutboxOperation({
        operationId,
        entityId: snapshot.match.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "match.start",
          expectedRevision: current.match.revision,
          ...snapshot,
        },
      });
      return snapshot;
    },
  );
  notifyLocalDataChanged("write", "matches");
  return result;
}
