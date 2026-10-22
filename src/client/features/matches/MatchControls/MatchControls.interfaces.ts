import type { Match } from "../../../../domain/matches/match.schema";
export interface MatchControlsProps {
  match: Match;
  now: number;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}
