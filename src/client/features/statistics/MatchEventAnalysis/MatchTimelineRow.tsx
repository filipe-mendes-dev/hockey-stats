"use client";

import { memo } from "react";
import { ActionIcon, Popover, Tooltip, UnstyledButton } from "@mantine/core";
import { MapPinOff, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecorderActionIcon } from "../../matches/RecorderBoard/RecorderActionIcon";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import type { MatchTimelineRowProps } from "./MatchTimelineRow.interfaces";
import st from "./MatchTimelineRow.module.css";

function MatchTimelineRowContent({
  event,
  description,
  active,
  selected,
  compact,
  id,
  detailId,
  onPreview,
  onSelect,
  onClear,
}: MatchTimelineRowProps) {
  const t = useTranslations("statistics");
  const button = (
    <UnstyledButton
      className={st.event}
      data-active={active}
      aria-label={description.label}
      aria-pressed={selected}
      aria-controls={compact ? undefined : detailId}
      onClick={() => onSelect(event.id)}
      onPointerEnter={(pointer) => {
        if (pointer.pointerType !== "touch") onPreview(event.id);
      }}
      onPointerLeave={() => onPreview(undefined)}
      onFocus={() => onPreview(event.id)}
      onBlur={() => onPreview(undefined)}
    >
      <span
        className={st.icon}
        data-colour={
          event.kind === "card"
            ? event.colour
            : event.kind === "shot" && event.outcome === "goal"
              ? "goal"
              : undefined
        }
      >
        <RecorderActionIcon kind={event.kind} size={15} />
      </span>
      <span className={st.copy}>
        <strong>{description.participant}</strong>
        <span className={st.action}>
          <span>{description.action}</span>
          {!description.positioned && (
            <MapPinOff size={13} aria-hidden="true" />
          )}
        </span>
      </span>
      <span className={st.time}>
        <span>{description.time}</span>
        <span>
          {description.elapsed
            ? t("elapsedPeriod", { period: description.periodName })
            : description.periodName}
        </span>
      </span>
    </UnstyledButton>
  );
  return (
    <li id={id} className={st.row}>
      {compact ? (
        <Popover
          opened={selected}
          onDismiss={onClear}
          position="top"
          width={300}
          returnFocus
          withArrow
        >
          <Popover.Target>{button}</Popover.Target>
          <Popover.Dropdown
            className={st.popover}
            aria-label={description.label}
          >
            <div className={st.popoverHeading}>
              <strong>{description.participant}</strong>
              <ActionIcon aria-label={t("clearEvent")} onClick={onClear}>
                <X size={16} aria-hidden="true" />
              </ActionIcon>
            </div>
            <p>{description.action}</p>
            <p className={st.context}>{description.context}</p>
            {!description.positioned && (
              <p className={st.context}>{t("noPosition")}</p>
            )}
          </Popover.Dropdown>
        </Popover>
      ) : (
        <Tooltip
          label={description.label}
          multiline
          events={{ hover: true, focus: true, touch: false }}
        >
          {button}
        </Tooltip>
      )}
      <DeliveryStatus
        compact
        kind="matchEvent.create"
        entityId={event.matchId}
        eventId={event.id}
      />
    </li>
  );
}

export const MatchTimelineRow = memo(MatchTimelineRowContent);
