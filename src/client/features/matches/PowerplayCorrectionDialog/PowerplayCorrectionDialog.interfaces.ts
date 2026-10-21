import type { Match } from "../../../../domain/matches/match.schema";
import type { PowerplayPenalty } from "../../../../domain/matches/powerplay";

export interface PowerplayCorrectionDialogProps {
  match: Match;
  penalties: readonly PowerplayPenalty[];
  onClose: () => void;
}
