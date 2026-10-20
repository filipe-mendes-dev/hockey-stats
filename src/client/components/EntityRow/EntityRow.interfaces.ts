import type { ReactNode } from "react";

export interface EntityRowProps {
  title: string;
  href: string;
  avatar: ReactNode;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}
