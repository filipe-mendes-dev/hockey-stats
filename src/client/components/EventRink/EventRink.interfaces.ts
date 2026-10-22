import type { RinkMarker } from "../HockeyRink/HockeyRink.interfaces";
import type { StatisticsTone } from "../StatisticsBreakdown/StatisticsBreakdown.interfaces";

export interface EventRinkMarker extends RinkMarker {
  shape: "circle" | "diamond" | "cross" | "square" | "card";
  tone: StatisticsTone;
  emphasized: boolean;
}

export interface EventRinkProps {
  label: string;
  markers: readonly EventRinkMarker[];
  activeId: string | undefined;
  selectedId: string | undefined;
  onPreview: (id: string | undefined) => void;
  onSelect: (id: string) => void;
}
