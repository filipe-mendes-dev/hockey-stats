import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import type { MatchEventDescription } from "./MatchEventAnalysis.interfaces";

export interface MatchTimelineRowProps {
  event: StatisticsEvent;
  description: MatchEventDescription;
  active: boolean;
  selected: boolean;
  id: string;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}
