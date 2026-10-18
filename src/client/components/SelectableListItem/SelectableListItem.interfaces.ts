import type { ReactNode } from "react";
export interface SelectableListItemProps {
  title: string;
  checked: boolean;
  disabled?: boolean;
  description?: string;
  onChange(checked: boolean): void;
  children?: ReactNode;
}
