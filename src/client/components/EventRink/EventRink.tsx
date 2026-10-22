"use client";

import type { CSSProperties } from "react";
import { HockeyRink } from "../HockeyRink/HockeyRink";
import type { RinkPoint } from "../HockeyRink/HockeyRink.interfaces";
import type { EventRinkProps } from "./EventRink.interfaces";
import st from "./EventRink.module.css";

function markerPosition(position: RinkPoint): CSSProperties {
  return {
    left: `${((8 + position.x * 1000) / 1016) * 100}%`,
    top: `${((8 + position.y * 500) / 516) * 100}%`,
  };
}

export function EventRink({
  label,
  markers,
  activeId,
  selectedId,
  onPreview,
  onSelect,
}: EventRinkProps) {
  return (
    <div className={st.rink} role="group" aria-label={label}>
      <HockeyRink
        label={label}
        color="var(--color-text-muted)"
        backgroundColor="var(--color-surface)"
      />
      {markers.map((marker) => (
        <button
          type="button"
          key={marker.id}
          className={st.marker}
          style={markerPosition(marker.position)}
          data-tone={marker.tone}
          data-active={activeId === marker.id}
          data-dimmed={Boolean(activeId) && activeId !== marker.id}
          aria-label={marker.label}
          aria-pressed={selectedId === marker.id}
          onClick={() => onSelect(marker.id)}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") onPreview(marker.id);
          }}
          onPointerLeave={() => onPreview(undefined)}
          onFocus={() => onPreview(marker.id)}
          onBlur={() => onPreview(undefined)}
        >
          <svg viewBox="-14 -14 28 28" className={st.symbol} aria-hidden="true">
            <circle className={st.activeRing} r="12" />
            {marker.shape === "circle" && <circle r="4.5" />}
            {marker.shape === "circle" && marker.emphasized && (
              <circle className={st.goalRing} r="8" />
            )}
            {marker.shape === "diamond" && (
              <path d="M0 -5.5L5.5 0L0 5.5L-5.5 0Z" />
            )}
            {marker.shape === "cross" && (
              <path className={st.cross} d="M-4 -4L4 4M4 -4L-4 4" />
            )}
            {marker.shape === "square" && (
              <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" />
            )}
            {marker.shape === "card" && (
              <rect x="-4" y="-6" width="8" height="12" rx="1.5" />
            )}
          </svg>
        </button>
      ))}
    </div>
  );
}
