import type { Match } from "../../../../domain/matches/match.schema";

export interface RecorderTimeProps {
  match: Match;
  period: number;
  elapsedMs: number | undefined;
}
