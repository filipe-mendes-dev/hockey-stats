import type { ReactNode } from "react";
import type { Match } from "../../../../domain/matches/match.schema";
import type { RinkPosition } from "../../../../domain/matches/matchEvent.schema";
import type { RinkAttackDirection } from "../../../../domain/matches/rinkPosition";

export interface RecorderRinkPickerProps {
  match: Match;
  period: number;
  direction: RinkAttackDirection | undefined;
  position?: RinkPosition | undefined;
  disabled?: boolean;
  autoFocus?: boolean;
  compactHint?: boolean;
  hintAccessory?: ReactNode;
  onStart: () => void;
  onSelect: (position: RinkPosition) => void;
  onCancelGesture: () => void;
  onDirectionPending?: (pending: boolean) => void;
}

export interface RecorderRinkProps extends RecorderRinkPickerProps {
  inert?: boolean;
  onOpen: () => void;
  presentation: "compact" | "desktop";
}

export interface RecorderRinkSession {
  picking: boolean;
  direction: RinkAttackDirection | undefined;
  onStart: () => void;
  onSelect: (position: RinkPosition) => void;
  onCancelGesture: () => void;
  onEdit: () => void;
}
