import type { TeamPlayer } from "../../../../domain/teams/teamPlayer.schema";
export interface TeamMembershipProps {
  membership: TeamPlayer;
  playerName: string;
  duplicateNumber: boolean;
}
