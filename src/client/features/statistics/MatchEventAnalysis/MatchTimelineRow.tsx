"use client";

import { memo } from "react";
import { ActionIcon, Popover, Tooltip, UnstyledButton } from "@mantine/core";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MatchEventIcon } from "../../../components/MatchEventIcon/MatchEventIcon";
import type { MatchTimelineRowProps } from "./MatchTimelineRow.interfaces";
import { getEventPresentation } from "../eventPresentation";
import st from "./MatchTimelineRow.module.css";

function MatchTimelineRowContent({
  event,
  description,
  active,
  selected,
  id,
  onPreview,
  onSelect,
  onClear,
}: MatchTimelineRowProps) {
  const t = useTranslations("statistics");
  const spatial =
    event.kind === "shot" ||
    event.kind === "ball-recovery" ||
    event.kind === "ball-loss" ||
    event.kind === "team-foul" ||
    event.kind === "card" ||
    event.kind === "goalkeeper-save";
  return (
    <li id={id} className={st.row} data-event-row={event.id}>
      <Popover
        opened={selected}
        onDismiss={onClear}
        position="top"
        width={300}
        returnFocus
        withArrow
      >
        <Popover.Target>
          <Tooltip
            label={description.label}
            disabled={selected}
            multiline
            events={{ hover: true, focus: true, touch: false }}
          >
            <UnstyledButton
              className={st.event}
              data-active={active}
              aria-label={description.label}
              aria-pressed={selected}
              onClick={() => onSelect(event.id)}
              onPointerEnter={(pointer) => {
                if (pointer.pointerType !== "touch") onPreview(event.id);
              }}
              onPointerLeave={() => onPreview(undefined)}
              onFocus={() => onPreview(event.id)}
              onBlur={() => onPreview(undefined)}
            >
              <span className={st.time}>
                <span>{description.time}</span>
                <span>
                  {description.elapsed
                    ? t("elapsedPeriod", { period: description.periodName })
                    : description.periodName}
                </span>
              </span>
              <span
                className={st.icon}
                data-event-tone={getEventPresentation(event).tone}
              >
                <MatchEventIcon kind={event.kind} size={15} />
              </span>
              <span className={st.copy}>
                <strong>{description.participant}</strong>
                <span className={st.action}>{description.action}</span>
              </span>
            </UnstyledButton>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown className={st.popover} aria-label={description.label}>
          <div className={st.popoverHeading}>
            <strong>{description.participant}</strong>
            <ActionIcon aria-label={t("clearEvent")} onClick={onClear}>
              <X size={16} aria-hidden="true" />
            </ActionIcon>
          </div>
          <p>{description.action}</p>
          <p className={st.context}>{description.context}</p>
          {spatial && !description.positioned && (
            <p className={st.context}>{t("noPosition")}</p>
          )}
        </Popover.Dropdown>
      </Popover>
    </li>
  );
}

export const MatchTimelineRow = memo(MatchTimelineRowContent);
