import type { Match } from "../../../../domain/matches/match.schema";
export interface RecorderHeaderProps {
  match: Match;
  disabled: boolean;
  scoreDisabled: boolean;
  onScoreAdjust: () => void;
}
