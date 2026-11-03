import type { StatisticsCategory } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";

export interface MatchAnalysisCategory {
  value: StatisticsCategory;
  label: string;
}

export interface MatchAnalysisFiltersProps {
  id?: string;
  options: readonly MatchAnalysisCategory[];
  counts: Readonly<Record<StatisticsCategory, number>>;
  value: StatisticsCategory;
  onChange(value: StatisticsCategory): void;
}
