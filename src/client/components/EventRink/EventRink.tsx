"use client";

import { memo } from "react";
import type { CSSProperties } from "react";
import { HockeyRink } from "../HockeyRink/HockeyRink";
import { MatchEventIcon } from "../MatchEventIcon/MatchEventIcon";
import type { RinkPoint } from "../HockeyRink/HockeyRink.interfaces";
import type {
  EventRinkProps,
  EventRinkMarkerButtonProps,
} from "./EventRink.interfaces";
import st from "./EventRink.module.css";

function markerPosition(position: RinkPoint): CSSProperties {
  return {
    left: `${((8 + position.x * 1000) / 1016) * 100}%`,
    top: `${((8 + position.y * 500) / 516) * 100}%`,
  };
}

export function EventRink({
  label,
  fit = false,
  markers,
  activeId,
  selectedId,
  onPreview,
  onSelect,
}: EventRinkProps) {
  return (
    <div className={st.frame} data-fit={fit}>
      <div
        className={st.rink}
        role="group"
        aria-label={label}
        data-highlighting={Boolean(activeId)}
      >
        <HockeyRink
          label={label}
          color="var(--color-text-muted)"
          backgroundColor="var(--color-surface)"
          lineGradient="right"
        />
        {markers.map((marker) => (
          <MemoizedMarker
            key={marker.id}
            marker={marker}
            active={activeId === marker.id}
            selected={selectedId === marker.id}
            onPreview={onPreview}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function EventRinkMarkerButton({
  marker,
  active,
  selected,
  onPreview,
  onSelect,
}: EventRinkMarkerButtonProps) {
  return (
    <button
      type="button"
      className={st.marker}
      style={markerPosition(marker.position)}
      data-event-tone={marker.tone}
      data-active={active}
      aria-label={marker.label}
      aria-pressed={selected}
      onClick={() => onSelect(marker.id)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") onPreview(marker.id);
      }}
      onPointerLeave={() => onPreview(undefined)}
      onFocus={() => onPreview(marker.id)}
      onBlur={() => onPreview(undefined)}
    >
      <MatchEventIcon kind={marker.kind} size={14} />
    </button>
  );
}

const MemoizedMarker = memo(EventRinkMarkerButton);
