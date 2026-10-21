import type { Match } from "../../../../domain/matches/match.schema";
export interface RecorderDirectionDialogProps {
  match: Match;
  onClose: () => void;
}
