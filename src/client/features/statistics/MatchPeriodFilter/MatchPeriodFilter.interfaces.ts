import type { MatchSnapshot } from "../../../../domain/matches/match.schema";

export interface MatchPeriodFilterProps {
  periods: MatchSnapshot["match"]["periods"];
  value: number | undefined;
  onChange(value: number | undefined): void;
}
