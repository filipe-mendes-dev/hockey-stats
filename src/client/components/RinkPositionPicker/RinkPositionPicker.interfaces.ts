import type { ReactNode } from "react";
import type {
  RinkOrientation,
  RinkPoint,
} from "../HockeyRink/HockeyRink.interfaces";

export interface RinkPositionPickerProps {
  label: string;
  hint: string;
  touchHint?: string;
  hintAccessory?: ReactNode;
  hideHint?: boolean;
  invalidLabel: string;
  positionLabel: (point: RinkPoint) => string;
  initialPosition?: RinkPoint | undefined;
  orientation?: RinkOrientation | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  interaction?: "precision" | "tap";
  onStart: () => void;
  onSelect: (point: RinkPoint) => void;
  onCancelGesture: () => void;
}
