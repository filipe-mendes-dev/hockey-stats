import type { ReactNode, SubmitEvent } from "react";
export interface EntityFormProps {
  pending: boolean;
  failed: boolean;
  failedLabel: string;
  submitLabel: string;
  cancelLabel: string;
  cancelHref: string;
  onSubmit(event: SubmitEvent<HTMLFormElement>): void;
  children: ReactNode;
}
