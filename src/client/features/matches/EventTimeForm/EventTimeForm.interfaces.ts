export interface EventTimeFormProps {
  durationMs: number | undefined;
  onApply: (elapsedMs: number) => void;
}
