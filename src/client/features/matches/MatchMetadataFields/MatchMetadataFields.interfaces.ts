import type { RefObject } from "react";

export interface MatchMetadataValues {
  opponentName: string;
  scheduledDate: string;
  venueRole: string;
}
export interface MatchMetadataFieldsProps {
  values: MatchMetadataValues;
  disabled: boolean;
  invalid: boolean;
  opponentInput: RefObject<HTMLInputElement | null>;
  onChange(values: MatchMetadataValues): void;
}
