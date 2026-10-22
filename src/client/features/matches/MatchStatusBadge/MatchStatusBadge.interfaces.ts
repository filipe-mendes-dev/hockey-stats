import type { Match } from "../../../../domain/matches/match.schema";

export interface MatchStatusBadgeProps {
  status: Match["status"];
}
