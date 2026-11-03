import type { MatchStatisticsView } from "../../../../contracts/match-statistics-view.schema";

export interface MatchPeriodFilterProps {
  periods: MatchStatisticsView["match"]["periods"];
  value: number | undefined;
  onChange(value: number | undefined): void;
}
