import type { RefObject } from "react";
import type { Team } from "../../../../domain/teams/team.schema";

export interface MatchDetailsValues {
  teamId: string;
  opponentName: string;
  scheduledDate: string;
  venueRole: string;
}
export interface MatchDetailsFieldsProps {
  values: MatchDetailsValues;
  teams: readonly Team[];
  disabled: boolean;
  invalid: boolean;
  teamInput: RefObject<HTMLInputElement | null>;
  opponentInput: RefObject<HTMLInputElement | null>;
  onTeamChange(value: string): void;
  onChange(values: MatchDetailsValues): void;
}
