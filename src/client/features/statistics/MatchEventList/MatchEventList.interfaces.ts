import type { ReactNode } from "react";
import type { StatisticsEvent } from "../../../../contracts/match-statistics-view.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";

export interface MatchEventListProps {
  events: readonly StatisticsEvent[];
  descriptions: ReadonlyMap<string, MatchEventDescription>;
  activeEventId: string | undefined;
  selectedEventId: string | undefined;
  periodLabel: string;
  playerLabel: string | undefined;
  filters: ReactNode;
  fallbackFocusId: string;
  onPreview(id: string | undefined): void;
  onSelect(id: string): void;
  onClear(): void;
}
