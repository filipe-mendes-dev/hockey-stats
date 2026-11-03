import type { MatchStatisticsView } from "../../../../contracts/match-statistics-view.schema";
import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import type { StatisticsSegment } from "../../../components/StatisticsBreakdown/StatisticsBreakdown.interfaces";

export interface EventBreakdown {
  title: string;
  segments: readonly StatisticsSegment[];
}

export type StatisticsCategory =
  | "all"
  | "shot"
  | "ball-recovery"
  | "ball-loss"
  | "team-foul"
  | "card"
  | "substitution"
  | "goalkeeper-save"
  | "timeout";

export interface MatchEventAnalysisProps {
  snapshot: MatchStatisticsView;
  events: readonly StatisticsEvent[];
  period: number | undefined;
  selectedPlayerId: string | undefined;
  onClearPlayer: () => void;
  onSelectPlayer: (id: string) => void;
  id: string;
}

export interface MatchEventDescription {
  participant: string;
  action: string;
  time: string;
  periodName: string;
  context: string;
  positioned: boolean;
  elapsed: boolean;
  label: string;
}
