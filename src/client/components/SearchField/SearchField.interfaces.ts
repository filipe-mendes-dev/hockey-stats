import type { ReactNode } from "react";

export interface SearchFieldProps {
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  onChange(value: string): void;
  children?: ReactNode;
}
