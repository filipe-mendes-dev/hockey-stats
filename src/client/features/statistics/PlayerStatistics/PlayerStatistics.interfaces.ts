import type {
  ActionStatistics,
  PlayerMatchStatistics,
} from "../../../../domain/matches/matchStatistics";

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
  statistics: readonly PlayerMatchStatistics[];
  team: ActionStatistics;
  periodLabel: string;
  selectedPlayerId: string | undefined;
  onSelectPlayer: (id: string) => void;
  onViewPlayer: (id: string) => void;
  analysisId: string;
}
