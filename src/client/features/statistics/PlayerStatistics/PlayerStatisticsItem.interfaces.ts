import type { StatisticsPlayerValues } from "../../../../contracts/match-statistics-view.schema";
import type { PlayerStatisticsColumn } from "./PlayerStatistics.interfaces";

export interface PlayerStatisticsItemProps {
  row: StatisticsPlayerValues;
  expanded: boolean;
  selected: boolean;
  maxima: ReadonlyMap<Exclude<PlayerStatisticsColumn, "player">, number>;
  analysisId: string;
  onToggle(): void;
  onSelect(): void;
}
