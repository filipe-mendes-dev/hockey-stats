export interface DurationFields {
  minutes: number | string;
  seconds: number | string;
}
export interface DurationCounterProps {
  value: DurationFields;
  onChange: (value: DurationFields) => void;
  maxMs: number | undefined;
  minutesLabel: string;
  secondsLabel: string;
  disabled?: boolean;
}
