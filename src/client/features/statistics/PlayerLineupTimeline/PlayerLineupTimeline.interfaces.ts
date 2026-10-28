import type { MatchSnapshot } from "../../../../domain/matches/match.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";
import type { TeamPeriodLineupTimeline } from "../../../../domain/matches/lineupTimeline";

export interface PlayerLineupTimelineProps {
  snapshot: MatchSnapshot;
  events: readonly MatchEvent[];
  visibleEvents: readonly MatchEvent[];
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
  timeline: TeamPeriodLineupTimeline;
  events: readonly MatchEvent[];
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
