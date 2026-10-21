export interface NumberStepperProps {
  label: string;
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  onStep?: (direction: -1 | 1) => void;
  incrementDisabled?: boolean;
  decrementDisabled?: boolean;
}
