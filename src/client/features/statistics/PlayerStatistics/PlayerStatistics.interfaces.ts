import type { StatisticsPlayerValues } from "../../../../contracts/match-statistics-view.schema";
import type { ActionStatistics } from "../../../../domain/matches/matchStatistics";

export type PlayerStatisticsColumn =
  | "player"
  | "playingTimeMs"
  | "shots"
  | "goals"
  | "onTarget"
  | "offTarget"
  | "blocked"
  | "recoveries"
  | "losses"
  | "fouls"
  | "cards";

export interface PlayerStatisticsProps {
  statistics: readonly StatisticsPlayerValues[];
  team: ActionStatistics;
  periodLabel: string;
  selectedPlayerId: string | undefined;
  onSelectPlayer: (id: string) => void;
  onViewPlayer: (id: string) => void;
  analysisId: string;
}
