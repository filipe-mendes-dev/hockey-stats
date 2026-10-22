import type { Ref } from "react";

export interface PlayerNameFieldProps {
  value: string;
  disabled: boolean;
  invalid: boolean;
  inputRef: Ref<HTMLInputElement>;
  onChange(value: string): void;
}
