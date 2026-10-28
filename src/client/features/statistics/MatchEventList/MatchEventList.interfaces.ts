import type { ReactNode } from "react";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import type { MatchEventDescription } from "../MatchEventAnalysis/MatchEventAnalysis.interfaces";

export interface MatchEventListProps {
  events: readonly MatchEvent[];
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
