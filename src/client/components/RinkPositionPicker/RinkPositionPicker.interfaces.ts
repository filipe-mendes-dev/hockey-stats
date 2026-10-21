import type { RinkPoint } from "../HockeyRink/HockeyRink.interfaces";

export interface RinkPositionPickerProps {
  label: string;
  hint: string;
  invalidLabel: string;
  positionLabel: (point: RinkPoint) => string;
  initialPosition?: RinkPoint | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  hideIdleStatus?: boolean;
  onStart: () => void;
  onSelect: (point: RinkPoint) => void;
  onCancelGesture: () => void;
}
