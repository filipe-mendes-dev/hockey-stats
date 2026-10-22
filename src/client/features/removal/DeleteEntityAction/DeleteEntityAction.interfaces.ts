import type { DeletionTarget } from "../DeleteEntityDialog/DeleteEntityDialog.interfaces";

export interface DeleteEntityActionProps {
  target: DeletionTarget;
  redirectHref?: string;
}
