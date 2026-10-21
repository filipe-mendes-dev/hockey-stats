import type {
  MatchSnapshot,
  StartMatchInput,
} from "../../../../domain/matches/match.schema";

export interface StartMatchFormProps {
  snapshot: MatchSnapshot;
  pending: boolean;
  error: string | null;
  onStart(input: StartMatchInput): Promise<void>;
}
