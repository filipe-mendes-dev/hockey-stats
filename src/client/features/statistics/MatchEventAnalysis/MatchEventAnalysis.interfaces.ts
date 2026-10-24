import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";

export type StatisticsCategory =
  | "all"
  | "shot"
  | "ball-recovery"
  | "ball-loss"
  | "team-foul"
  | "card"
  | "goalkeeper-save"
  | "timeout";

export interface MatchEventAnalysisProps {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
  period: number | undefined;
  selectedPlayerId: string | undefined;
  onClearPlayer: () => void;
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
