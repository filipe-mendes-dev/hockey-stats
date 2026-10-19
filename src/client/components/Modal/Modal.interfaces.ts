import type { ReactNode } from "react";
export interface ModalProps {
  title: string;
  locked: boolean;
  returnFocusTo?: HTMLElement | null;
  onDismiss(): void;
  children: ReactNode;
}
