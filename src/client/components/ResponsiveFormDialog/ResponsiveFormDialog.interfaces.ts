import type { ReactNode, SubmitEvent } from "react";

export interface ResponsiveFormDialogProps {
  opened: boolean;
  title: string;
  closeLabel: string;
  submitLabel: string;
  cancelLabel: string;
  pending: boolean;
  error: string | null;
  children: ReactNode;
  onSubmit(event: SubmitEvent<HTMLFormElement>): void;
  onClose(): void;
}
