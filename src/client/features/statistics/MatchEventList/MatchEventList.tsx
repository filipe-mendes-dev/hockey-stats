"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import { Button, Modal } from "@mantine/core";
import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { Expand } from "lucide-react";
import { useTranslations } from "next-intl";
import { MatchTimelineRow } from "../MatchEventAnalysis/MatchTimelineRow";
import type { MatchEventListProps } from "./MatchEventList.interfaces";
import st from "./MatchEventList.module.css";

export function MatchEventList({
  events,
  descriptions,
  activeEventId,
  selectedEventId,
  periodLabel,
  playerLabel,
  filters,
  fallbackFocusId,
  onPreview,
  onSelect,
  onClear,
}: MatchEventListProps) {
  const t = useTranslations("statistics");
  const matches = useTranslations("matches");
  const compact = useMediaQuery("(max-width: 50rem)");
  const reducedMotion = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const heading = useId();
  const listId = useId();
  const inlineList = useRef<HTMLOListElement>(null);
  const fullList = useRef<HTMLOListElement>(null);
  const fullscreen = Boolean(compact && opened);

  useEffect(() => {
    if (!activeEventId) return;
    const frame = requestAnimationFrame(() => {
      const list = fullscreen ? fullList.current : inlineList.current;
      const row = document.getElementById(
        `${listId}-${fullscreen ? "full" : "inline"}-${activeEventId}`,
      );
      if (!list || !row) return;
      const bounds = list.getBoundingClientRect();
      const item = row.getBoundingClientRect();
      if (item.top < bounds.top || item.bottom > bounds.bottom)
        list.scrollTop +=
          item.top - bounds.top - (list.clientHeight - item.height) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [activeEventId, compact, fullscreen, events, listId]);

  function renderEvents(visible: typeof events, full: boolean) {
    return visible.map((event, position) => {
      const description = descriptions.get(event.id);
      if (!description) return null;
      return (
        <Fragment key={event.id}>
          {position > 0 && visible[position - 1]?.period !== event.period && (
            <li className={st.period} data-event-period={event.period}>
              {matches("periodLabel", { number: event.period })}
            </li>
          )}
          <MatchTimelineRow
            id={`${listId}-${full ? "full" : "inline"}-${event.id}`}
            event={event}
            description={description}
            active={activeEventId === event.id}
            selected={selectedEventId === event.id && (full || !fullscreen)}
            onPreview={onPreview}
            onSelect={onSelect}
            onClear={onClear}
          />
        </Fragment>
      );
    });
  }

  return (
    <section className={st.section} aria-labelledby={heading} data-game-events>
      <div className={st.heading}>
        <h4 id={heading}>{t("timeline")}</h4>
        <span>{t("eventCount", { count: events.length })}</span>
      </div>
      <ol
        ref={inlineList}
        className={st.events}
        aria-labelledby={heading}
        tabIndex={events.length ? 0 : undefined}
        data-event-list="inline"
      >
        {renderEvents(events, false)}
      </ol>
      {!events.length && <p className={st.empty}>{t("emptyEvents")}</p>}
      {compact && events.length > 0 && (
        <Button
          className={st.viewAll}
          variant="default"
          leftSection={<Expand size={15} aria-hidden="true" />}
          onClick={() => setOpened(true)}
        >
          {t("showAll", { count: events.length })}
        </Button>
      )}
      <Modal
        opened={fullscreen}
        onClose={() => setOpened(false)}
        fullScreen
        title={t("timeline")}
        returnFocus
        onExitTransitionEnd={() => {
          if (!events.length)
            document
              .getElementById(fallbackFocusId)
              ?.focus({ preventScroll: true });
        }}
        closeButtonProps={{ "aria-label": t("closeEvents") }}
        transitionProps={{
          transition: "fade",
          duration: reducedMotion ? 0 : 150,
        }}
        classNames={{
          content: st.dialog,
          body: st.body,
          header: st.dialogHeader,
        }}
      >
        <div className={st.scope}>
          <span>{periodLabel}</span>
          {playerLabel && <strong>{playerLabel}</strong>}
          <span>{t("eventCount", { count: events.length })}</span>
        </div>
        <div className={st.filters}>{filters}</div>
        <ol
          ref={fullList}
          className={`${st.events} ${st.fullEvents}`}
          aria-label={t("timeline")}
          tabIndex={events.length ? 0 : undefined}
          data-event-list="full"
        >
          {renderEvents(events, true)}
        </ol>
        {!events.length && <p className={st.empty}>{t("emptyEvents")}</p>}
      </Modal>
    </section>
  );
}
