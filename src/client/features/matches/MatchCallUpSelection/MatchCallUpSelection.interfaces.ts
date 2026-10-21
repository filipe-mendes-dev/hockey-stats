import type { MatchPlayer } from "../../../../domain/matches/match.schema";

export interface MatchPlayerChoice {
  jerseyNumber: string;
  role: MatchPlayer["role"];
}

export interface MatchCallUpPlayer extends MatchPlayerChoice {
  playerId: string;
  name: string;
}
export interface MatchCallUpSelectionProps {
  available: readonly MatchCallUpPlayer[];
  selected: Record<string, MatchCallUpPlayer>;
  search: string;
  disabled: boolean;
  onSearchChange(value: string): void;
  onToggle(player: MatchCallUpPlayer, checked: boolean): void;
}
