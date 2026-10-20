import type { ReactNode } from "react";

export interface AppHeaderProps {
  children?: ReactNode;
  homeHref?: "/app" | "/sign-in";
}
