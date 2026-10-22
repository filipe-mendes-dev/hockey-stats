import type { Team } from "../../../../domain/teams/team.schema";

export interface MatchReviewSummaryProps {
  team: Team | undefined;
  opponent: string;
  scheduledDate: string;
  venueRole: string;
  durationMinutes: number;
}
