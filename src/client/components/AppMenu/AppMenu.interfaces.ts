import type { NavigationCardProps } from "../NavigationCard/NavigationCard.interfaces";

export interface AppMenuItem extends NavigationCardProps {
  id: string;
}
export interface AppMenuProps {
  label: string;
  items: readonly AppMenuItem[];
}
