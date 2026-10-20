import type { ReactNode } from "react";

export interface SelectableEntityRowProps {
  title: string;
  avatar: ReactNode;
  checked: boolean;
  onChange(checked: boolean): void;
}
