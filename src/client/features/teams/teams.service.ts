import { updateTeamInputSchema } from "../../../domain/teams/validation/teamInput.schema";
import type { UpdateTeamInput } from "../../../domain/teams/validation/teamInput.schema";
import { LocalRevisionConflictError } from "./teams.errors";
import type { Team } from "../../../domain/teams/team.schema";
import type { CreateTeamInput } from "../../../domain/teams/validation/teamInput.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { getTeamById, updateTeamRecord, insertTeam } from "./teams.repository";

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const now = Date.now();
  const team: Team = {
    ...input,
    id: crypto.randomUUID(),
    revision: 1,
    createdAt: now,
    updatedAt: now,
  };
  const operationId = crypto.randomUUID();
  const database = await getDatabase();
  await database.transaction(
    "rw",
    ["metadata", "teams", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      await insertTeam(team);
      await insertOutboxOperation({
        operationId,
        entityId: team.id,
        status: "pending",
        command: { version: 1, operationId, kind: "team.create", team },
      });
    },
  );
  notifyLocalDataChanged("write", "teams");
  return team;
}

export async function updateTeam(input: UpdateTeamInput): Promise<Team> {
  const fields = updateTeamInputSchema.parse(input);
  const database = await getDatabase();
  const result = await database.transaction(
    "rw",
    ["metadata", "teams", "outbox"],
    async () => {
      if (!(await getLocalIdentity())) throw new LocalAccountRequiredError();
      const current = await getTeamById(fields.id);
      if (!current || current.archivedAt) throw new Error("Team unavailable.");
      if (current.revision !== fields.expectedRevision)
        throw new LocalRevisionConflictError();
      const team: Team = {
        ...current,
        name: fields.name,
        category: fields.category,
        season: fields.season,
        revision: current.revision + 1,
        updatedAt: Math.max(Date.now(), current.updatedAt),
      };
      const operationId = crypto.randomUUID();
      await updateTeamRecord(team);
      await insertOutboxOperation({
        operationId,
        entityId: team.id,
        status: "pending",
        command: {
          version: 1,
          operationId,
          kind: "team.update",
          expectedRevision: current.revision,
          team,
        },
      });
      return team;
    },
  );
  notifyLocalDataChanged("write", "teams");
  return result;
}
