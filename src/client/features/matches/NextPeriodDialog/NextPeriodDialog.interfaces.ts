import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";

export interface NextPeriodDialogProps {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
  onClose: () => void;
}
