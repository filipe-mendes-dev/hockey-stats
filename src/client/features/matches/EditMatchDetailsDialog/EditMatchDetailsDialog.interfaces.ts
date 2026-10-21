import type { MatchSnapshot } from "../../../../domain/matches/match.schema";

export interface EditMatchDetailsDialogProps {
  snapshot: MatchSnapshot;
  onClose(): void;
}
