import type { CreateTeamInput } from "../../../../domain/teams/validation/teamInput.schema";
export interface TeamFormProps {
  initial?: CreateTeamInput;
  pending: boolean;
  failed: boolean;
  failedLabel: string;
  submitLabel: string;
  onSave(input: CreateTeamInput): Promise<void>;
  onCancel?(): void;
}
