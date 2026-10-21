import { createRegulationPeriods } from "../../../../domain/matches/matchFormat";
import type { MatchMetadataValues } from "./MatchMetadataFields.interfaces";

export function getMatchMetadataInput(values: MatchMetadataValues) {
  return {
    opponentName: values.opponentName,
    scheduledDate: values.scheduledDate,
    venueRole: values.venueRole,
    periods: createRegulationPeriods(Number(values.durationMinutes)),
  };
}
