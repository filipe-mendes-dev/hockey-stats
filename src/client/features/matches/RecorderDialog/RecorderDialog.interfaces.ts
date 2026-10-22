import type { ReactNode } from "react";
export interface RecorderDialogProps {
  title: string;
  pending?: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}
