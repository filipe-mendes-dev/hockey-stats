export interface AppMenuItem {
  id: string;
  title: string;
  description: string;
  href?: string;
}

export interface AppMenuProps {
  label: string;
  comingSoonLabel: string;
  items: readonly AppMenuItem[];
}
