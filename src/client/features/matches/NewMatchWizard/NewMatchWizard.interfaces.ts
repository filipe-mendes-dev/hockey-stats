import type { CreateMatchInput } from "../../../../domain/matches/match.schema";

export interface NewMatchWizardProps {
  pending: boolean;
  error: string | null;
  onSave(input: CreateMatchInput): Promise<void>;
  onDraftChange(): void;
}
