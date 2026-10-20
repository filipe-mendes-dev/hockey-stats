import type { TeamPlayer } from "../../../domain/teams/teamPlayer.schema";
export interface PlayerAssignmentFieldsProps {
  jerseyNumber: string;
  role: TeamPlayer["role"];
  disabled: boolean;
  onNumberChange(value: string): void;
  onRoleChange(value: TeamPlayer["role"]): void;
}
