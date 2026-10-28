import type { RinkMarker } from "../HockeyRink/HockeyRink.interfaces";
import type { StatisticsTone } from "../StatisticsBreakdown/StatisticsBreakdown.interfaces";
import type { MatchEvent } from "../../../domain/matches/matchEvent.schema";

export interface EventRinkMarker extends RinkMarker {
  kind: MatchEvent["kind"];
  tone: StatisticsTone;
}

export interface EventRinkProps {
  label: string;
  fit?: boolean;
  markers: readonly EventRinkMarker[];
  activeId: string | undefined;
  selectedId: string | undefined;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
}

export interface EventRinkMarkerButtonProps extends Pick<
  EventRinkProps,
  "onPreview" | "onSelect"
> {
  marker: EventRinkMarker;
  active: boolean;
  selected: boolean;
}
