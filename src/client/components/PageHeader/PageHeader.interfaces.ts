import type { ReactNode } from "react";
import type { BackLinkProps } from "../BackLink/BackLink.interfaces";

export interface PageHeaderProps {
  title: string;
  avatar?: ReactNode;
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  back?: BackLinkProps;
}
