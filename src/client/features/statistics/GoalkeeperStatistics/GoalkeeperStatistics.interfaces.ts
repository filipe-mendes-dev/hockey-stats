import type { PlayerMatchStatistics } from "../../../../domain/matches/matchStatistics";

export interface GoalkeeperStatisticsProps {
  statistics: readonly PlayerMatchStatistics[];
  unattributedConcededGoals: number;
  periodLabel: string;
  selectedPlayerId: string | undefined;
  onSelectPlayer: (id: string) => void;
  analysisId: string;
}
