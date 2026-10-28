import type { MatchPlayer } from "../../../../domain/matches/match.schema";

export interface MatchPlayerIdentityProps {
  player: Pick<MatchPlayer, "jerseyNumber" | "playerNameAtMatch" | "role">;
}
