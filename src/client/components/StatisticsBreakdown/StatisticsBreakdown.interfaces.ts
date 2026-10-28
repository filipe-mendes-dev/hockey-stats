export type StatisticsTone =
  "action" | "blue" | "muted" | "yellow" | "red" | "neutral";

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
