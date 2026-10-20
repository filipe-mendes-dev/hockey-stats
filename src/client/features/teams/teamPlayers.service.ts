import {
  addTeamPlayersInputSchema,
  updateTeamPlayerInputSchema,
} from "../../../domain/teams/teamPlayer.schema";
import type {
  AddTeamPlayersInput,
  UpdateTeamPlayerInput,
  TeamPlayer,
} from "../../../domain/teams/teamPlayer.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { getPlayerById } from "../players/players.repository";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { getTeamById } from "./teams.repository";
import {
  listTeamPlayers,
  getTeamPlayer,
  insertTeamPlayer,
  updateTeamPlayerRecord,
} from "./teamPlayers.repository";
import { LocalRevisionConflictError, TeamPlayersError } from "./teams.errors";

export async function addPlayersToTeam(
  input: AddTeamPlayersInput,
): Promise<void> {
  const fields = addTeamPlayersInputSchema.parse(input);
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "teams", "players", "teamPlayers", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const team = await getTeamById(fields.teamId);
      if (!team || team.archivedAt) throw new TeamPlayersError();
      const existing = await listTeamPlayers(team.id);
      for (const field of fields.players) {
        const player = await getPlayerById(field.playerId);
        if (
          !player ||
          player.archivedAt ||
          existing.some((entry) => entry.playerId === player.id)
        )
          throw new TeamPlayersError();
        const now = Date.now();
        const teamPlayer: TeamPlayer = {
          ...field,
          id: crypto.randomUUID(),
          teamId: team.id,
          revision: 1,
          createdAt: now,
          updatedAt: now,
        };
        const operationId = crypto.randomUUID();
        await insertTeamPlayer(teamPlayer);
        await insertOutboxOperation({
          operationId,
          entityId: teamPlayer.id,
          status: "pending",
          command: {
            version: 1,
            operationId,
            kind: "teamPlayer.create",
            teamPlayer,
          },
        });
      }
    },
  );
  notifyLocalDataChanged("write", "teamPlayers");
}
export async function updateTeamPlayer(
  input: UpdateTeamPlayerInput,
): Promise<void> {
  const fields = updateTeamPlayerInputSchema.parse(input);
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "teamPlayers", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getTeamPlayer(fields.id);
      if (!current) throw new TeamPlayersError();
      if (current.revision !== fields.expectedRevision)
        throw new LocalRevisionConflictError();
      const teamPlayer: TeamPlayer = {
        ...current,
        jerseyNumber: fields.jerseyNumber,
        role: fields.role,
        revision: current.revision + 1,
        updatedAt: Math.max(Date.now(), current.updatedAt),
      };
      const operationId = crypto.randomUUID();
      await updateTeamPlayerRecord(teamPlayer);
      await insertOutboxOperation({
        operationId,
        entityId: teamPlayer.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "teamPlayer.update",
          expectedRevision: current.revision,
          teamPlayer,
        },
      });
    },
  );
  notifyLocalDataChanged("write", "teamPlayers");
}
