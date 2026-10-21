import type { Match } from "../../../../domain/matches/match.schema";
export interface MatchControlsProps {
  match: Match;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}
