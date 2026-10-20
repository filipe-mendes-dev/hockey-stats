import type { SearchFieldProps } from "../SearchField/SearchField.interfaces";

export interface SearchToolbarProps extends Omit<SearchFieldProps, "children"> {
  actionHref: string;
  actionLabel: string;
  compactActionLabel: string;
}
