export interface SearchInputFieldProps {
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  onChange(value: string): void;
}
