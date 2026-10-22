import type { ReactNode, SubmitEvent } from "react";

export interface FormLayoutProps {
  label: string;
  children: ReactNode;
  pending: boolean;
  error: string | null;
  submitLabel: string;
  cancelLabel: string;
  cancelHref: string;
  submitDisabled?: boolean;
  actionsLayout?: "default" | "wizard";
  secondaryAction?: { label: string; onClick(): void };
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void;
}
