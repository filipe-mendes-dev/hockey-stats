import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
export interface NextPeriodContext {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
}
export interface MatchControlsProps {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[] | undefined;
  now: number;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}
