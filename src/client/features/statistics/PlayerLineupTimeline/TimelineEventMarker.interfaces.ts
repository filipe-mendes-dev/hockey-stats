import type { KeyboardEvent } from "react";
import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";

export interface TimelineEventMarkerProps {
  event: StatisticsEvent;
  descriptions: ReadonlyMap<string, MatchEventDescription>;
  left: number;
  active: boolean;
  selected: boolean;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
  onNavigate: (event: KeyboardEvent<HTMLButtonElement>, id: string) => void;
}
