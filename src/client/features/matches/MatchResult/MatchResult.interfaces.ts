import type { Match } from "../../../../domain/matches/match.schema";
import type { PeriodScore } from "../../../../domain/matches/matchStatistics";

export interface MatchResultProps {
  match: Match;
  category: string | undefined;
  score: { own: number; opponent: number } | undefined;
  periods: readonly PeriodScore[] | undefined;
}
