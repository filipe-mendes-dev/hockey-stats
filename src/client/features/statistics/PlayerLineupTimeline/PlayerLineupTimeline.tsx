"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Tooltip } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { sortMatchEvents } from "../../../../domain/matches/matchEventOrder";
import {
  formatCountdown,
  formatMatchTime,
} from "../../../../domain/matches/matchControl";
import { TimelineEventMarker } from "./TimelineEventMarker";
import {
  getStintEvents,
  layoutTimelinePeriods,
  layoutStintMarkers,
  timelinePeriodGap,
} from "./timelineLayout";
import type { PlayerLineupTimelineProps } from "./PlayerLineupTimeline.interfaces";
import st from "./PlayerLineupTimeline.module.css";

function position(left: number, width?: number): CSSProperties {
  return width === undefined
    ? { left: left + "px" }
    : { left: left + "px", width: width + "px" };
}

export function PlayerLineupTimeline({
  snapshot,
  visibleEvents,
  descriptions,
  period,
  activeEventId,
  selectedEventId,
  selectedPlayerId,
  onSelectPlayer,
  onPreview,
  onSelect,
}: PlayerLineupTimelineProps) {
  const t = useTranslations("statistics");
  const matches = useTranslations("matches");
  const recorder = useTranslations("recorder");
  const heading = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [availableWidth, setAvailableWidth] = useState(560);
  const coarse = useMediaQuery("(pointer: coarse)");
  const targetSize = coarse ? 44 : 24;
  const timelines = snapshot.timelines;
  const onRinkEvents = useMemo(
    () => visibleEvents.filter((event) => event.onRink),
    [visibleEvents],
  );
  const layouts = useMemo(
    () =>
      layoutTimelinePeriods(
        timelines.filter(
          (entry) => period === undefined || entry.period === period,
        ),
        onRinkEvents,
        Math.max(0, availableWidth - targetSize),
        targetSize,
      ),
    [timelines, period, onRinkEvents, availableWidth, targetSize],
  );
  const last = layouts.at(-1);
  const width = last ? last.left + last.width : availableWidth;
  const navigable = useMemo(() => {
    const ids = new Set(
      layouts.flatMap((layout) =>
        layout.timeline.stints.flatMap((stint) =>
          getStintEvents(stint, layout.timeline.period, layout.events).map(
            (event) => event.id,
          ),
        ),
      ),
    );
    return sortMatchEvents(visibleEvents)
      .filter((event) => ids.has(event.id))
      .map((event) => event.id);
  }, [layouts, visibleEvents]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeEventId) return;
    const marker = rootRef.current?.querySelector<HTMLElement>(
      '[data-event-id="' + activeEventId + '"]',
    );
    const viewport = marker?.closest<HTMLElement>("[data-timeline-viewport]");
    if (!marker || !viewport) return;
    const bounds = marker.getBoundingClientRect();
    const container = viewport.getBoundingClientRect();
    if (bounds.left < container.left || bounds.right > container.right)
      viewport.scrollLeft +=
        bounds.left -
        container.left -
        (viewport.clientWidth - bounds.width) / 2;
  }, [activeEventId]);

  function time(elapsedMs: number, periodNumber: number): string {
    return (
      formatCountdown(
        elapsedMs,
        snapshot.match.periods.find((entry) => entry.number === periodNumber)
          ?.durationMs,
      ) ?? formatMatchTime(elapsedMs)
    );
  }

  function navigateEvent(
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
  ): void {
    const index = navigable.indexOf(id);
    const next =
      event.key === "ArrowRight"
        ? navigable[index + 1]
        : event.key === "ArrowLeft"
          ? navigable[index - 1]
          : event.key === "Home"
            ? navigable[0]
            : event.key === "End"
              ? navigable.at(-1)
              : undefined;
    if (!next) return;
    event.preventDefault();
    rootRef.current
      ?.querySelector<HTMLButtonElement>('[data-event-id="' + next + '"]')
      ?.focus({ preventScroll: true });
  }

  function selectTimelineEvent(id: string): void {
    rootRef.current
      ?.querySelector<HTMLButtonElement>('[data-event-id="' + id + '"]')
      ?.focus({ preventScroll: true });
    onSelect(id);
  }

  return (
    <section ref={rootRef} className={st.section} aria-labelledby={heading}>
      <h4 id={heading}>{t("lineupTitle")}</h4>
      <div
        className={st.viewport}
        data-timeline-viewport
        aria-label={t("lineupScroll")}
      >
        <div className={st.canvas} style={{ width }}>
          <div className={st.axis} aria-hidden="true">
            {layouts.map((layout) => (
              <div
                key={layout.timeline.period}
                className={st.periodAxis}
                data-period={layout.timeline.period}
                style={position(layout.left, layout.width)}
              >
                <strong>
                  {matches("periodLabel", { number: layout.timeline.period })}
                </strong>
                {layout.ticks.map((at, index) => (
                  <span
                    key={at}
                    className={st.tick}
                    data-edge={
                      index === 0
                        ? "start"
                        : index === layout.ticks.length - 1
                          ? "end"
                          : undefined
                    }
                    style={position(
                      index === 0
                        ? 8
                        : index === layout.ticks.length - 1
                          ? layout.width - 8
                          : (at / Math.max(1, layout.timeline.extentMs)) *
                            layout.width,
                    )}
                  >
                    {time(at, layout.timeline.period)}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div
            className={st.chart}
            role="group"
            aria-label={t("lineupKeyboard")}
          >
            <div className={st.grid} aria-hidden="true">
              {layouts.flatMap((layout) =>
                layout.ticks.map((at) => (
                  <i
                    key={layout.timeline.period + "-" + at}
                    style={position(
                      layout.left +
                        (at / Math.max(1, layout.timeline.extentMs)) *
                          layout.width,
                    )}
                  />
                )),
              )}
            </div>
            {[0, 1, 2, 3, 4].map((lane) => (
              <div key={lane} className={st.row} data-lane={lane}>
                {layouts.flatMap((layout) =>
                  layout.timeline.stints
                    .filter((stint) => stint.lane === lane)
                    .map((stint) => {
                      const player = snapshot.players.find(
                        (entry) => entry.id === stint.matchPlayerId,
                      );
                      if (!player) return null;
                      const extent = Math.max(1, layout.timeline.extentMs);
                      const stintWidth = Math.max(
                        0,
                        ((stint.endMs - stint.startMs) / extent) * layout.width,
                      );
                      const stintEvents = getStintEvents(
                        stint,
                        layout.timeline.period,
                        layout.events,
                      );
                      const markerLayout = layoutStintMarkers(
                        stint,
                        stintEvents,
                        stintWidth,
                        Math.min(200, 48 + player.playerNameAtMatch.length * 7),
                        targetSize,
                      );
                      const label = t("lineupPlayer", {
                        name: player.playerNameAtMatch,
                        intervals: t("lineupInterval", {
                          from: time(stint.startMs, layout.timeline.period),
                          to: time(stint.endMs, layout.timeline.period),
                        }),
                      });
                      return (
                        <div
                          key={
                            layout.timeline.period +
                            "-" +
                            player.id +
                            "-" +
                            stint.startMs
                          }
                          className={st.stint}
                          data-keeper={player.role === "goalkeeper"}
                          data-selected={selectedPlayerId === player.id}
                          style={position(
                            layout.left +
                              (stint.startMs / extent) * layout.width,
                            stintWidth,
                          )}
                        >
                          <Tooltip
                            label={label}
                            multiline
                            events={{ hover: true, focus: true, touch: true }}
                          >
                            <button
                              type="button"
                              className={st.player}
                              style={position(
                                markerLayout.label.left,
                                markerLayout.label.width,
                              )}
                              aria-label={label}
                              aria-pressed={selectedPlayerId === player.id}
                              onClick={() => onSelectPlayer(player.id)}
                            >
                              <strong>
                                {player.jerseyNumber
                                  ? "#" + player.jerseyNumber
                                  : "—"}
                              </strong>
                              <span>{player.playerNameAtMatch}</span>
                            </button>
                          </Tooltip>
                          {stintEvents.map((event, index) => (
                            <TimelineEventMarker
                              key={event.id}
                              event={event}
                              descriptions={descriptions}
                              left={markerLayout.positions[index] ?? 0}
                              active={activeEventId === event.id}
                              selected={selectedEventId === event.id}
                              onPreview={onPreview}
                              onSelect={selectTimelineEvent}
                              onNavigate={navigateEvent}
                            />
                          ))}
                        </div>
                      );
                    }),
                )}
              </div>
            ))}
            {layouts.slice(1).map((layout) => (
              <div
                key={layout.timeline.period}
                className={st.divider}
                data-period-boundary
                style={position(layout.left - timelinePeriodGap / 2)}
                aria-hidden="true"
              />
            ))}
            {layouts
              .filter((layout) => layout.timeline.unknownFromMs !== undefined)
              .map((layout) => {
                const start =
                  ((layout.timeline.unknownFromMs ?? 0) /
                    Math.max(1, layout.timeline.extentMs)) *
                  layout.width;
                return (
                  <div
                    key={layout.timeline.period}
                    className={st.unknown}
                    style={position(
                      layout.left + start,
                      Math.max(0, layout.width - start),
                    )}
                    aria-label={t("lineupUnknown")}
                  />
                );
              })}
          </div>
        </div>
      </div>
      {layouts
        .filter((layout) => layout.timeline.unknownFromMs !== undefined)
        .map(({ timeline }) => (
          <p key={timeline.period} className={st.warning} role="status">
            {timeline.issue
              ? t("lineupConflict", {
                  period: matches("periodLabel", {
                    number: timeline.issue.event?.period ?? timeline.period,
                  }),
                  time: timeline.issue.event?.gameTime
                    ? time(
                        timeline.issue.event.gameTime.elapsedMs,
                        timeline.issue.event.period,
                      )
                    : recorder("untimed"),
                  reason: recorder(`rules.${timeline.issue.reason}`),
                })
              : t("lineupEndUnknown")}
          </p>
        ))}
    </section>
  );
}
