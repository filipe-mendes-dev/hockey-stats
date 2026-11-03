import type { StatisticsPlayerValues } from "../../../../contracts/match-statistics-view.schema";

export interface GoalkeeperStatisticsProps {
  statistics: readonly StatisticsPlayerValues[];
  unattributedConcededGoals: number;
  periodLabel: string;
  selectedPlayerId: string | undefined;
  onSelectPlayer: (id: string) => void;
  analysisId: string;
}
