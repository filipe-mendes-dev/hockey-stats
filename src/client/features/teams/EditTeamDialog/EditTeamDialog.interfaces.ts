import type { Team } from "../../../../domain/teams/team.schema";

export interface EditTeamDialogProps {
  team: Team;
  onClose(): void;
}
