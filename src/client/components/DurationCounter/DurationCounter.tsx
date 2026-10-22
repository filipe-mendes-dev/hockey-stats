"use client";
import { NumberStepper } from "../NumberStepper/NumberStepper";
import { getDurationFields, parseDurationFields } from "./durationFields";
import type { DurationCounterProps } from "./DurationCounter.interfaces";
import st from "./DurationCounter.module.css";
export function DurationCounter({
  value,
  onChange,
  maxMs,
  minutesLabel,
  secondsLabel,
  disabled = false,
}: DurationCounterProps) {
  const total = parseDurationFields(value) ?? 0;
  const maximum =
    maxMs === undefined
      ? Number.MAX_SAFE_INTEGER
      : Math.floor(maxMs / 1000) * 1000;
  function step(delta: number): void {
    onChange(getDurationFields(Math.max(0, Math.min(maximum, total + delta))));
  }
  return (
    <div className={st.fields}>
      <NumberStepper
        label={minutesLabel}
        value={value.minutes}
        min={0}
        max={Math.floor(maximum / 60_000)}
        onChange={(minutes) => onChange({ ...value, minutes })}
        disabled={disabled}
        onStep={(direction) => step(direction * 60_000)}
        decrementDisabled={total === 0}
        incrementDisabled={total >= maximum}
      />
      <NumberStepper
        label={secondsLabel}
        value={value.seconds}
        min={0}
        max={59}
        onChange={(seconds) => onChange({ ...value, seconds })}
        disabled={disabled}
        onStep={(direction) => step(direction * 1000)}
        decrementDisabled={total === 0}
        incrementDisabled={total >= maximum}
      />
    </div>
  );
}
