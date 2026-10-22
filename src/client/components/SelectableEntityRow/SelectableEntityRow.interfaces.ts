import type { ReactNode } from "react";

export interface SelectableEntityRowProps {
  title: string;
  avatar: ReactNode;
  description?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(checked: boolean): void;
}
