import type { PowerplayPenalty } from "../../../../domain/matches/powerplay";

export interface PowerplayIndicatorProps {
  penalties: readonly PowerplayPenalty[];
  disabled: boolean;
  onCorrect: () => void;
}
