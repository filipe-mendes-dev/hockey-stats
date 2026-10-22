export interface HeaderAccountAction {
  label: string;
  pending: boolean;
  onClick: () => void;
}

export interface AppHeaderProps {
  homeHref?: "/app" | "/sign-in";
  accountAction?: HeaderAccountAction | undefined;
}
