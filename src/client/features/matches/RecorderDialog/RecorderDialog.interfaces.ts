import type { ReactNode } from "react";
export interface RecorderDialogProps {
  title: string;
  pending?: boolean;
  wide?: boolean;
  topAligned?: boolean;
  metadata?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}
