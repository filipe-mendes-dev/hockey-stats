import type { Player } from "../../../../domain/players/player.schema";
import type { TeamPlayer } from "../../../../domain/teams/teamPlayer.schema";

export interface PlayerAssignmentDialogProps {
  teamId: string;
  players: Player[];
  members: TeamPlayer[];
  onClose(): void;
  onSaved(): void;
}

export interface PlayerAssignmentDraft {
  selected: boolean;
  jerseyNumber: string;
  role: TeamPlayer["role"];
}
