import type { ReactNode } from "react";
export interface EntityPageProps {
  backHref: string;
  backLabel: string;
  title: string;
  description?: string;
  storageNotice: string;
  children: ReactNode;
}
