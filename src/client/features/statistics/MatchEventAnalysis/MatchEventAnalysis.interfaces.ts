import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
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
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
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
