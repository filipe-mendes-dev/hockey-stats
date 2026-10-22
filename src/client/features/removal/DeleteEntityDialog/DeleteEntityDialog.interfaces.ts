import type { DeleteEntityInput } from "../../../../contracts/entity-deletions.schema";

export interface DeletionTarget extends DeleteEntityInput {
  name: string;
  live?: boolean;
}
export interface DeleteEntityDialogProps {
  target: DeletionTarget;
  onClose(): void;
  onDeleted?(): void;
}
