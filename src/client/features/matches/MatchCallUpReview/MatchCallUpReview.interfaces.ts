import type { MatchCallUpPlayer } from "../MatchCallUpSelection/MatchCallUpSelection.interfaces";

export interface MatchCallUpReviewProps {
  players: readonly MatchCallUpPlayer[];
  disabled?: boolean;
  onChange?(player: MatchCallUpPlayer): void;
}
