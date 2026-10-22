export type StatisticsTone = "action" | "blue" | "muted" | "yellow" | "red";

export interface StatisticsSegment {
  id: string;
  label: string;
  value: number;
  tone: StatisticsTone;
}

export interface StatisticsBreakdownProps {
  title: string;
  totalLabel: string;
  segments: readonly StatisticsSegment[];
}
