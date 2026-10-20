import type { BackLinkProps } from "../BackLink/BackLink.interfaces";

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  back?: BackLinkProps;
}
