import type { RefObject } from "react";
import type { MatchMetadataValues } from "../MatchMetadataFields/MatchMetadataFields.interfaces";
import type { Team } from "../../../../domain/teams/team.schema";

export interface MatchDetailsValues extends MatchMetadataValues {
  teamId: string;
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
