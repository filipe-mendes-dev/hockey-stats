import type { Ref } from "react";

export interface TeamFieldValues {
  name: string;
  category: string;
  season: string;
}

export interface TeamFieldsProps {
  values: TeamFieldValues;
  disabled: boolean;
  invalidName: boolean;
  nameInputRef: Ref<HTMLInputElement>;
  onChange(values: TeamFieldValues): void;
}
