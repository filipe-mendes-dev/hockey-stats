export interface SearchToolbarProps {
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  onChange: (value: string) => void;
  actionHref: string;
  actionLabel: string;
  compactActionLabel: string;
}
