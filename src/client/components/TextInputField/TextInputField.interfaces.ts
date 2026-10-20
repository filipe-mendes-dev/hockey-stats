import type { InputHTMLAttributes, Ref } from "react";

export interface TextInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  requiredLabel: string;
  error?: string | undefined;
  inputRef?: Ref<HTMLInputElement>;
}
