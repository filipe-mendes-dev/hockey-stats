import type {
  CreateMatchInput,
  MatchSnapshot,
} from "../../../../domain/matches/match.schema";
export interface MatchFormProps {
  initial?: MatchSnapshot;
  pending: boolean;
  failed: boolean;
  failedLabel: string;
  submitLabel: string;
  onSave(input: CreateMatchInput): Promise<void>;
  onCancel?(): void;
}
