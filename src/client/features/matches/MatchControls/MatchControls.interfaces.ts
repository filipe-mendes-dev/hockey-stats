import type { Match } from "../../../../domain/matches/match.schema";
import type { PowerplayPenalty } from "../../../../domain/matches/powerplay";
export interface MatchControlsProps {
  powerplays: readonly PowerplayPenalty[];
  onCorrectPowerplay: () => void;
  match: Match;
  ownScore: number | undefined;
  opponentScore: number | undefined;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}
