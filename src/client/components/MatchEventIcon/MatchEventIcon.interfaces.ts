import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";

export interface MatchEventIconProps {
  kind: MatchEvent["kind"];
  size?: number;
}
