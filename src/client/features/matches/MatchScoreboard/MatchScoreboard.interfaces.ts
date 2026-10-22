import type { Match } from "../../../../domain/matches/match.schema";
import type { PowerplayPenalty } from "../../../../domain/matches/powerplay";

export interface MatchScoreboardProps {
  match: Match;
  now: number;
  powerplays: readonly PowerplayPenalty[];
  ownScore: number | undefined;
  opponentScore: number | undefined;
  disabled: boolean;
  onCorrectPowerplay: () => void;
}
