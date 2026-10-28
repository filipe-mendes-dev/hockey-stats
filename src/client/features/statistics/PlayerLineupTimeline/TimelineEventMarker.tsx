"use client";

import { Tooltip } from "@mantine/core";
import { useTranslations } from "next-intl";
import { MatchEventIcon } from "../../../components/MatchEventIcon/MatchEventIcon";
import { getEventPresentation } from "../eventPresentation";
import type { TimelineEventMarkerProps } from "./TimelineEventMarker.interfaces";
import st from "./TimelineEventMarker.module.css";

export function TimelineEventMarker({
  event,
  descriptions,
  left,
  active,
  selected,
  onPreview,
  onSelect,
  onNavigate,
}: TimelineEventMarkerProps) {
  const recorder = useTranslations("recorder");
  const label = descriptions.get(event.id)?.label ?? recorder(event.kind);

  return (
    <Tooltip
      label={label}
      multiline
      events={{ hover: true, focus: true, touch: false }}
    >
      <button
        type="button"
        className={st.marker}
        style={{ left }}
        data-event-id={event.id}
        data-event-tone={getEventPresentation(event).tone}
        data-active={active}
        aria-label={label}
        aria-pressed={selected}
        onPointerEnter={(pointer) => {
          if (pointer.pointerType !== "touch") onPreview(event.id);
        }}
        onPointerLeave={() => onPreview(undefined)}
        onFocus={() => onPreview(event.id)}
        onBlur={() => onPreview(undefined)}
        onClick={() => onSelect(event.id)}
        onKeyDown={(key) => onNavigate(key, event.id)}
      >
        <MatchEventIcon kind={event.kind} size={14} />
      </button>
    </Tooltip>
  );
}
