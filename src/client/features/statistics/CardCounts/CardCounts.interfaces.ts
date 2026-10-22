import type { CardStatistics } from "../../../../domain/matches/matchStatistics";

export interface CardCountsProps {
  cards: CardStatistics;
  showZeros?: boolean;
}
