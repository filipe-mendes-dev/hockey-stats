import type { Match } from "../../../../domain/matches/match.schema";
export interface MatchControlsProps {
  match: Match;
  ownScore: number | undefined;
  opponentScore: number | undefined;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}
