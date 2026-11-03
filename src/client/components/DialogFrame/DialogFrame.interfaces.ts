import type { ReactNode } from "react";

export interface DialogFrameProps {
  opened: boolean;
  title: string;
  closeLabel: string;
  pending?: boolean;
  wide?: boolean;
  topAligned?: boolean;
  metadata?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose(): void;
}
