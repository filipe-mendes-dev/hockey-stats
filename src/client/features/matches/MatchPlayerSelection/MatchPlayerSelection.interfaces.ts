import type { MatchPlayer } from "../../../../domain/matches/match.schema";
export interface MatchPlayerChoice {
  jerseyNumber: string;
  role: MatchPlayer["role"];
}
export interface MatchPlayerSelectionProps {
  teamId: string;
  existingPlayers?: readonly MatchPlayer[];
  value: Record<string, MatchPlayerChoice>;
  disabled: boolean;
  onChange(value: Record<string, MatchPlayerChoice>): void;
}
