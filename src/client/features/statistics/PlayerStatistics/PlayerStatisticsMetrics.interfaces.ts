import type { ActionStatistics } from "../../../../domain/matches/matchStatistics";
import type { PlayerStatisticsColumn } from "./PlayerStatistics.interfaces";

export interface PlayerStatisticsMetricsProps {
  statistics: ActionStatistics;
  maxima?: ReadonlyMap<Exclude<PlayerStatisticsColumn, "player">, number>;
}
