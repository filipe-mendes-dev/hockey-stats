import type { ReactNode, SubmitEvent } from "react";

export interface DialogSecondaryAction {
  label: string;
  onClick(): void;
}

export interface ResponsiveFormDialogProps {
  opened: boolean;
  title: string;
  closeLabel: string;
  submitLabel: string;
  cancelLabel: string;
  pending: boolean;
  layout?: "compact" | "flow";
  submitDisabled?: boolean;
  destructive?: boolean;
  secondaryAction?: DialogSecondaryAction;
  error: string | null;
  children: ReactNode;
  onSubmit(event: SubmitEvent<HTMLFormElement>): void;
  onClose(): void;
}
