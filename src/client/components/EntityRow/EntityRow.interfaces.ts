import type { ReactNode } from "react";

export interface EntityRowProps {
  title: string;
  href: string;
  avatar: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}
