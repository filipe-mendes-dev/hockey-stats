export interface MatchTimeoutStatisticsProps {
  ownTeam: string;
  opponentTeam: string;
  timeouts: { own: number; opponent: number };
  periodLabel: string;
}
