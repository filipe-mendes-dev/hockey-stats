import type { MatchPlayer } from "../../../../domain/matches/match.schema";

export interface EventPlayerChoicesProps {
  players: readonly MatchPlayer[];
  activePlayerIds: ReadonlySet<string>;
  onSelect: (id: string) => void;
}
