import type { MatchStatisticsView } from "../../../../contracts/match-statistics-view.schema";
import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";
import type { StatisticsTimeline } from "../../../../contracts/match-statistics-view.schema";

export interface PlayerLineupTimelineProps {
  snapshot: MatchStatisticsView;
  visibleEvents: readonly StatisticsEvent[];
  descriptions: ReadonlyMap<string, MatchEventDescription>;
  period: number | undefined;
  activeEventId: string | undefined;
  selectedEventId: string | undefined;
  selectedPlayerId: string | undefined;
  onSelectPlayer: (id: string) => void;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
}

export interface TimelinePeriodLayout {
  timeline: StatisticsTimeline;
  events: readonly StatisticsEvent[];
  left: number;
  width: number;
  ticks: readonly number[];
}

export interface TimelineLabelGap {
  left: number;
  width: number;
}

export interface TimelineMarkerLayout {
  positions: readonly number[];
  label: TimelineLabelGap;
}
