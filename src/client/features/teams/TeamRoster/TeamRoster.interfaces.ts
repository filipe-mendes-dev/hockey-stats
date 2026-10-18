import type { TeamPlayer } from "../../../../domain/teams/teamPlayer.schema";
export interface TeamRosterProps {
  teamId: string;
}
export interface PlayerSelection {
  jerseyNumber: string;
  role: TeamPlayer["role"];
}
