"use client";
import { useRef } from "react";
import { ActionIcon, NumberInput } from "@mantine/core";
import type { NumberInputHandlers } from "@mantine/core";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NumberStepperProps } from "./NumberStepper.interfaces";
import st from "./NumberStepper.module.css";
export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max,
  disabled = false,
  onStep,
  incrementDisabled,
  decrementDisabled,
}: NumberStepperProps) {
  const t = useTranslations("controls");
  const handlers = useRef<NumberInputHandlers>(null);
  const cannotIncrease =
    disabled ||
    (incrementDisabled ?? (max !== undefined && Number(value) >= max));
  const cannotDecrease =
    disabled || (decrementDisabled ?? Number(value) <= min);
  function step(direction: -1 | 1): void {
    if (direction === 1 ? cannotIncrease : cannotDecrease) return;
    if (onStep) onStep(direction);
    else if (direction === 1) handlers.current?.increment();
    else handlers.current?.decrement();
  }
  return (
    <NumberInput
      label={label}
      value={value}
      onChange={onChange}
      min={min}
      {...(max === undefined ? {} : { max })}
      disabled={disabled}
      handlersRef={handlers}
      hideControls
      allowDecimal={false}
      allowNegative={min < 0}
      clampBehavior="strict"
      selectAllOnFocus
      leftSectionWidth={48}
      rightSectionWidth={48}
      leftSectionPointerEvents="all"
      rightSectionPointerEvents="all"
      classNames={{ input: st.input, wrapper: st.wrapper }}
      withKeyboardEvents={!onStep}
      onKeyDown={(event) => {
        if (onStep && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
          event.preventDefault();
          step(event.key === "ArrowUp" ? 1 : -1);
        }
      }}
      leftSection={
        <ActionIcon
          type="button"
          variant="subtle"
          disabled={cannotDecrease}
          aria-label={t("decrease", { label })}
          onClick={() => step(-1)}
        >
          <Minus size={18} aria-hidden="true" />
        </ActionIcon>
      }
      rightSection={
        <ActionIcon
          type="button"
          variant="subtle"
          disabled={cannotIncrease}
          aria-label={t("increase", { label })}
          onClick={() => step(1)}
        >
          <Plus size={18} aria-hidden="true" />
        </ActionIcon>
      }
    />
  );
}
