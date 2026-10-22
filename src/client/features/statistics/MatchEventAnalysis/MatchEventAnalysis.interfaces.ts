import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";

export type StatisticsCategory =
  "all" | "shot" | "ball-recovery" | "ball-loss" | "team-foul" | "card";

export interface MatchEventAnalysisProps {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
  period: number | undefined;
  selectedPlayerId: string | undefined;
  onClearPlayer: () => void;
  id: string;
}
