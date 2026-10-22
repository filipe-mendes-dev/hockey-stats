export interface PasswordFieldValues {
  password: string;
  passwordConfirmation: string;
}

export interface PasswordFieldsProps {
  values: PasswordFieldValues;
  disabled: boolean;
  invalid: boolean;
  onChange(values: PasswordFieldValues): void;
}
