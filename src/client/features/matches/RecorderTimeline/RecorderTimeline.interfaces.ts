import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
export interface RecorderTimelineProps {
  snapshot: MatchSnapshot;
  events: MatchEvent[] | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  expanded?: boolean;
  scrollable?: boolean;
}
