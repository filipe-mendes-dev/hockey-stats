import type { PlayerMatchStatistics } from "../../../../domain/matches/matchStatistics";
import type { PlayerStatisticsColumn } from "./PlayerStatistics.interfaces";

export interface PlayerStatisticsItemProps {
  row: PlayerMatchStatistics;
  expanded: boolean;
  selected: boolean;
  maxima: ReadonlyMap<Exclude<PlayerStatisticsColumn, "player">, number>;
  analysisId: string;
  onToggle(): void;
  onSelect(): void;
}
