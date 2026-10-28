import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import type { MatchEventDescription } from "./MatchEventAnalysis.interfaces";

export interface MatchTimelineRowProps {
  event: MatchEvent;
  description: MatchEventDescription;
  active: boolean;
  selected: boolean;
  id: string;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}
