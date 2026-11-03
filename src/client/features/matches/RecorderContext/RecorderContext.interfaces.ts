import type { Match } from "../../../../domain/matches/match.schema";
import type { MatchEventKind } from "../../../../domain/matches/matchEvent.schema";
export interface RecorderContextProps {
  match: Match;
  period: number;
  elapsedMs: number | undefined;
  primary: string;
  secondary?: string | undefined;
  kind?: MatchEventKind | undefined;
  showTime?: boolean;
}
