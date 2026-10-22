export interface MatchFlowProgressProps {
  labels: readonly string[];
  compactLabels?: readonly string[];
  active: number;
  visited: number;
  disabled: boolean;
  onStepChange(step: number): void;
}
