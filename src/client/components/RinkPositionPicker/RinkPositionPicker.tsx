"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { HockeyRinkLabels } from "../HockeyRink/HockeyRinkLabels";
import { HockeyRink } from "../HockeyRink/HockeyRink";
import type {
  RinkPoint,
  RinkViewport,
} from "../HockeyRink/HockeyRink.interfaces";
import { isInsideRink, pointerToRink } from "../HockeyRink/rinkGeometry";
import type { RinkPositionPickerProps } from "./RinkPositionPicker.interfaces";
import st from "./RinkPositionPicker.module.css";

function suppressReleaseClick(): void {
  // The picker can become action buttons before the release click arrives.
  const timeout = window.setTimeout(cleanup, 500);
  function cleanup(): void {
    window.clearTimeout(timeout);
    document.removeEventListener("click", consume, true);
    document.removeEventListener("pointerdown", cleanup, true);
    document.removeEventListener("keydown", cleanup, true);
  }
  function consume(event: MouseEvent): void {
    cleanup();
    if (event.detail === 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  document.addEventListener("click", consume, true);
  document.addEventListener("pointerdown", cleanup, true);
  document.addEventListener("keydown", cleanup, true);
}

export function RinkPositionPicker({
  label,
  hint,
  touchHint,
  hintAccessory,
  hideHint = false,
  invalidLabel,
  positionLabel,
  initialPosition,
  orientation,
  disabled = false,
  autoFocus = false,
  interaction = "precision",
  onStart,
  onSelect,
  onCancelGesture,
}: RinkPositionPickerProps) {
  const hintId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const pointerOrigin = useRef({ x: 0, y: 0 });
  const keyboardStarted = useRef(false);
  const [position, setPosition] = useState(initialPosition);
  const [magnifying, setMagnifying] = useState(false);
  const [viewport, setViewport] = useState<RinkViewport>();
  const [invalid, setInvalid] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const visiblePosition = selecting ? position : initialPosition;

  useEffect(() => {
    if (!autoFocus) return;
    const frame = window.requestAnimationFrame(() =>
      target.current?.focus({ preventScroll: true }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus]);

  useEffect(() => {
    function interrupt(): void {
      if (activePointer.current === null && !keyboardStarted.current) return;
      activePointer.current = null;
      keyboardStarted.current = false;
      setMagnifying(false);
      setSelecting(false);
      setPosition(initialPosition);
      onCancelGesture();
    }
    window.addEventListener("resize", interrupt);
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", interrupt);
    return () => {
      window.removeEventListener("resize", interrupt);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", interrupt);
    };
  }, [initialPosition, onCancelGesture]);

  function cancelGesture(): void {
    activePointer.current = null;
    keyboardStarted.current = false;
    setMagnifying(false);
    setSelecting(false);
    setPosition(initialPosition);
    onCancelGesture();
  }
  function readPoint(event: PointerEvent<HTMLDivElement>): RinkPoint | null {
    return svg.current
      ? pointerToRink(svg.current, event.clientX, event.clientY)
      : null;
  }
  function move(event: PointerEvent<HTMLDivElement>, point: RinkPoint): void {
    setPosition(point);
    setInvalid(false);
    if (
      event.pointerType === "mouse" ||
      !stage.current ||
      !lens.current ||
      !svg.current
    )
      return;
    const bounds = stage.current.getBoundingClientRect();
    const scale = svg.current.getScreenCTM();
    if (!scale) return;
    const span = 112 / (Math.hypot(scale.a, scale.b) * 1.5);
    setViewport({
      x: point.x * 1000 - span / 2,
      y: point.y * 500 - span / 2,
      width: span,
      height: span,
    });
    lens.current.style.setProperty(
      "--lens-left",
      `${Math.max(0, Math.min(bounds.width - 112, event.clientX - bounds.left - 56))}px`,
    );
    const fingerY = event.clientY - bounds.top;
    const lensTop = fingerY >= 140 ? fingerY - 140 : fingerY + 28;
    lens.current.style.setProperty("--lens-top", `${lensTop}px`);
    setMagnifying(true);
  }
  function pointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (activePointer.current !== null) {
      cancelGesture();
      return;
    }
    if (disabled || !event.isPrimary || event.button !== 0) return;
    const point = readPoint(event);
    if (!point) return;
    if (interaction === "precision" || event.pointerType === "mouse")
      event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    activePointer.current = event.pointerId;
    pointerOrigin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    keyboardStarted.current = false;
    setSelecting(true);
    onStart();
    if (interaction === "precision") move(event, point);
  }
  function pointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (activePointer.current !== event.pointerId) return;
    if (interaction === "tap" && movedBeyondTap(event)) {
      cancelGesture();
      return;
    }
    const point = readPoint(event);
    activePointer.current = null;
    setMagnifying(false);
    setSelecting(false);
    if (!point || disabled) {
      cancelGesture();
      setInvalid(true);
      return;
    }
    setPosition(point);
    suppressReleaseClick();
    onSelect(point);
  }
  function movedBeyondTap(event: PointerEvent<HTMLDivElement>): boolean {
    return (
      Math.hypot(
        event.clientX - pointerOrigin.current.x,
        event.clientY - pointerOrigin.current.y,
      ) > 10
    );
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (
      event.key === "Escape" &&
      (keyboardStarted.current || activePointer.current !== null)
    ) {
      event.preventDefault();
      event.stopPropagation();
      cancelGesture();
      return;
    }
    if (disabled || activePointer.current !== null) return;
    const increment = event.shiftKey ? 0.002 : 0.01;
    const delta =
      event.key === "ArrowLeft"
        ? { x: -increment, y: 0 }
        : event.key === "ArrowRight"
          ? { x: increment, y: 0 }
          : event.key === "ArrowUp"
            ? { x: 0, y: -increment * 2 }
            : event.key === "ArrowDown"
              ? { x: 0, y: increment * 2 }
              : null;
    if (event.key !== "Enter" && !delta) return;
    event.preventDefault();
    if (!keyboardStarted.current) {
      keyboardStarted.current = true;
      onStart();
    }
    const origin = selecting ? position : initialPosition;
    const next = delta
      ? { x: (origin?.x ?? 0.5) + delta.x, y: (origin?.y ?? 0.5) + delta.y }
      : (origin ?? { x: 0.5, y: 0.5 });
    if (!isInsideRink(next)) return;
    setPosition(next);
    setSelecting(true);
    setInvalid(false);
    if (event.key === "Enter") {
      keyboardStarted.current = false;
      setSelecting(false);
      onSelect(next);
    }
  }
  return (
    <div className={st.picker}>
      {orientation && <HockeyRinkLabels {...orientation} />}
      <div ref={stage} className={st.stage}>
        <div
          ref={target}
          data-autofocus={autoFocus || undefined}
          className={st.target}
          data-interaction={interaction}
          tabIndex={disabled ? -1 : 0}
          role="group"
          aria-label={label}
          aria-describedby={hintId}
          aria-disabled={disabled}
          onPointerDown={pointerDown}
          onPointerMove={(event) => {
            if (activePointer.current !== event.pointerId) return;
            if (interaction === "tap") {
              if (movedBeyondTap(event)) cancelGesture();
              return;
            }
            const point = readPoint(event);
            if (point) move(event, point);
            else setInvalid(true);
          }}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            if (activePointer.current !== null) cancelGesture();
          }}
          onLostPointerCapture={() => {
            if (activePointer.current !== null) cancelGesture();
          }}
          onKeyDown={keyDown}
          onBlur={() => {
            if (keyboardStarted.current) cancelGesture();
          }}
          onContextMenu={(event) => event.preventDefault()}
        >
          <HockeyRink
            label={label}
            svgRef={svg}
            position={visiblePosition}
            orientation={orientation}
          />
        </div>
        <div
          ref={lens}
          className={st.lens}
          data-visible={magnifying}
          aria-hidden="true"
        >
          <HockeyRink
            label={label}
            viewport={viewport}
            orientation={
              orientation
                ? { attackingEnd: orientation.attackingEnd }
                : undefined
            }
          />
          <span className={st.crosshair} />
        </div>
      </div>
      <div className={st.hintRow}>
        <p id={hintId} className={hideHint ? st.announcement : st.hint}>
          <span className={st.pointerHint}>{hint}</span>
          <span className={st.touchHint}>{touchHint ?? hint}</span>
        </p>
        {hintAccessory}
      </div>
      <p className={invalid ? st.status : st.announcement} role="status">
        {invalid
          ? invalidLabel
          : visiblePosition
            ? positionLabel(visiblePosition)
            : ""}
      </p>
    </div>
  );
}
