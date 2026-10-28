import type { KeyboardEvent } from "react";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";

export interface TimelineEventMarkerProps {
  event: MatchEvent;
  descriptions: ReadonlyMap<string, MatchEventDescription>;
  left: number;
  active: boolean;
  selected: boolean;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
  onNavigate: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void;
}
