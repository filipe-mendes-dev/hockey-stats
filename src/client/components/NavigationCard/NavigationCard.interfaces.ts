import type { ReactNode } from "react";

export interface NavigationCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  featured?: boolean;
}
