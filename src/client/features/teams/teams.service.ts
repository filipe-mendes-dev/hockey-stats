import type { Team } from "../../../domain/teams/team.schema";
import type { CreateTeamInput } from "../../../domain/teams/validation/createTeam.schema";
import { getDatabase } from "../../storage/database";
import { notifyLocalDataChanged } from "../../storage/localDataEvents";
import { getLocalIdentity } from "../account/account.repository";
import { LocalAccountRequiredError } from "../account/account.service";
import { insertOutboxOperation } from "../sync/outbox.repository";
import { insertTeam } from "./teams.repository";

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
