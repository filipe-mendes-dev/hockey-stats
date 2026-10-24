export interface RecorderRinkToolbarProps {
  hint: string;
  disabled: boolean;
  onChangeDirection: () => void;
  onClear?: (() => void) | undefined;
}
