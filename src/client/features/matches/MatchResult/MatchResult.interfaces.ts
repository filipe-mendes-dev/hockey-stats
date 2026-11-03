import type { Match } from "../../../../domain/matches/match.schema";
import type { PeriodScore } from "../../../../domain/matches/matchStatistics";

export interface MatchResultProps {
  match: Pick<
    Match,
    | "teamNameAtMatch"
    | "opponentName"
    | "scheduledDate"
    | "venueRole"
    | "status"
    | "periods"
  >;
  category: string | undefined;
  score: { own: number; opponent: number } | undefined;
  periods: readonly PeriodScore[] | undefined;
}
