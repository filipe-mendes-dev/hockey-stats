"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { ActionIcon, Button } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ArrowRight, MousePointer2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { deriveMatchState } from "../../../../domain/matches/derivedMatchState";
import { getEventDetail } from "../../../../domain/matches/matchEvent.schema";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import {
  formatCountdown,
  formatMatchTime,
} from "../../../../domain/matches/matchControl";
import { getActionStatistics } from "../../../../domain/matches/matchStatistics";
import { toViewPosition } from "../../../../domain/matches/rinkPosition";
import { EventRink } from "../../../components/EventRink/EventRink";
import type { EventRinkMarker } from "../../../components/EventRink/EventRink.interfaces";
import { StatisticsBreakdown } from "../../../components/StatisticsBreakdown/StatisticsBreakdown";
import type { StatisticsSegment } from "../../../components/StatisticsBreakdown/StatisticsBreakdown.interfaces";
import { RecorderActionIcon } from "../../matches/RecorderBoard/RecorderActionIcon";
import { MatchTimelineRow } from "./MatchTimelineRow";
import type {
  MatchEventAnalysisProps,
  MatchEventDescription,
  StatisticsCategory,
} from "./MatchEventAnalysis.interfaces";
import st from "./MatchEventAnalysis.module.css";

function involvesPlayer(event: MatchEvent, id: string): boolean {
  if (event.kind === "substitution")
    return (
      event.incomingMatchPlayerId === id || event.outgoingMatchPlayerId === id
    );
  if (event.kind === "card")
    return (
      event.matchPlayerId === id ||
      event.removedMatchPlayerId === id ||
      event.replacementMatchPlayerId === id
    );
  return "matchPlayerId" in event && event.matchPlayerId === id;
}

export function MatchEventAnalysis({
  snapshot,
  events,
  period,
  selectedPlayerId,
  onClearPlayer,
  id,
}: MatchEventAnalysisProps) {
  const t = useTranslations("statistics");
  const recorder = useTranslations("recorder");
  const matches = useTranslations("matches");
  const heading = useId();
  const timelineHeading = useId();
  const timelineId = useId();
  const detailId = useId();
  const [category, setCategory] = useState<StatisticsCategory>("all");
  const [pinned, setPinned] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const timelineRef = useRef<HTMLOListElement>(null);
  const compact = useMediaQuery("(max-width: 50em)");
  const categories: readonly { value: StatisticsCategory; label: string }[] = [
    { value: "all", label: t("allActions") },
    { value: "shot", label: t("shots") },
    { value: "ball-recovery", label: t("recoveries") },
    { value: "ball-loss", label: t("losses") },
    { value: "team-foul", label: t("fouls") },
    { value: "card", label: t("cards") },
  ];
  const scoped = useMemo(
    () =>
      events.filter(
        (event) =>
          event.deletedAt === undefined &&
          (period === undefined || event.period === period) &&
          (!selectedPlayerId || involvesPlayer(event, selectedPlayerId)),
      ),
    [events, period, selectedPlayerId],
  );
  const filtered = useMemo(
    () =>
      scoped
        .filter((event) => category === "all" || event.kind === category)
        .sort((left, right) => right.order - left.order),
    [scoped, category],
  );
  const categoryCounts = useMemo<Record<StatisticsCategory, number>>(
    () => ({
      all: scoped.length,
      shot: scoped.filter((event) => event.kind === "shot").length,
      "ball-recovery": scoped.filter((event) => event.kind === "ball-recovery")
        .length,
      "ball-loss": scoped.filter((event) => event.kind === "ball-loss").length,
      "team-foul": scoped.filter((event) => event.kind === "team-foul").length,
      card: scoped.filter((event) => event.kind === "card").length,
    }),
    [scoped],
  );
  const pinnedEvent = filtered.find((event) => event.id === pinned);
  const activeEvent =
    filtered.find((event) => event.id === preview) ?? pinnedEvent;
  const selectedPlayer = snapshot.players.find(
    (player) => player.id === selectedPlayerId,
  );

  const descriptions = useMemo(() => {
    function playerName(playerId: string | undefined): string {
      return (
        snapshot.players.find((player) => player.id === playerId)
          ?.playerNameAtMatch ?? recorder("playerUnavailable")
      );
    }

    function describe(event: MatchEvent): MatchEventDescription {
      const participant =
        event.kind === "substitution"
          ? recorder("substitutionPlayers", {
              outgoing: playerName(event.outgoingMatchPlayerId),
              incoming: playerName(event.incomingMatchPlayerId),
            })
          : "matchPlayerId" in event
            ? playerName(event.matchPlayerId)
            : event.kind === "opponent-goal"
              ? snapshot.match.opponentName
              : snapshot.match.teamNameAtMatch;
      const detail = getEventDetail(event);
      const parts = [
        recorder("eventSummary", {
          kind: recorder(event.kind),
          detail: detail
            ? recorder(detail)
            : event.kind === "score-adjustment"
              ? recorder("scoreChange", {
                  own: event.ownDelta,
                  opponent: event.opponentDelta,
                })
              : "",
        }).trim(),
      ];
      if (event.kind === "ball-recovery" || event.kind === "ball-loss")
        parts.push(recorder(event.rinkHalf ?? "locationUnknown"));
      if (event.kind === "powerplay-adjust")
        parts.push(
          recorder("penaltyAdjustedTo", {
            time: formatMatchTime(event.powerplayDurationMs),
          }),
        );
      if (event.kind === "card") {
        if (event.removedMatchPlayerId)
          parts.push(
            recorder("outgoingPlayer", {
              name: playerName(event.removedMatchPlayerId),
            }),
          );
        if (event.lineupEffect === "replace")
          parts.push(
            recorder("incomingPlayer", {
              name: playerName(event.replacementMatchPlayerId),
            }),
          );
        if (
          event.colour === "blue" &&
          event.startsPowerplay &&
          (deriveMatchState(
            snapshot,
            events.filter((entry) => entry.order <= event.order),
          ).blueCardCounts.get(event.matchPlayerId) ?? 0) >= 3
        )
          parts.push(recorder("thirdBlueRed"));
      }
      const action = parts.join(" · ");
      const duration = snapshot.match.periods.find(
        (entry) => entry.number === event.period,
      )?.durationMs;
      const countdown = formatCountdown(event.gameTime?.elapsedMs, duration);
      const time =
        countdown ??
        (event.gameTime
          ? formatMatchTime(event.gameTime.elapsedMs)
          : recorder("untimed"));
      const periodName = matches("periodLabel", { number: event.period });
      const context = event.gameTime
        ? t(countdown === undefined ? "elapsed" : "remaining", {
            period: periodName,
            time,
          })
        : recorder("eventTime", { period: event.period, time });
      const positioned = "position" in event && event.position !== undefined;
      return {
        participant,
        action,
        time,
        periodName,
        context,
        positioned,
        elapsed: countdown === undefined && event.gameTime !== undefined,
        label: t(
          positioned ? "eventDescription" : "eventDescriptionNoPosition",
          { participant, action, time: context },
        ),
      };
    }

    return new Map(
      events
        .filter((event) => event.deletedAt === undefined)
        .map((event) => [event.id, describe(event)]),
    );
  }, [events, snapshot, t, recorder, matches]);

  const markers = useMemo<EventRinkMarker[]>(
    () =>
      filtered.flatMap((event) => {
        if (!("position" in event) || !event.position) return [];
        const description = descriptions.get(event.id);
        if (!description) return [];
        const marker: EventRinkMarker = {
          id: event.id,
          position: toViewPosition(event.position, "toward-x1"),
          label: description.label,
          shape: "circle",
          tone: "action",
          emphasized: event.kind === "shot" && event.outcome === "goal",
        };
        if (event.kind === "shot" && category === "shot")
          marker.tone =
            event.outcome === "on-target"
              ? "blue"
              : event.outcome === "off-target"
                ? "muted"
                : event.outcome === "blocked"
                  ? "yellow"
                  : "action";
        if (event.kind === "ball-recovery") marker.shape = "diamond";
        if (event.kind === "ball-loss") {
          marker.shape = "cross";
          marker.tone = "red";
        }
        if (event.kind === "team-foul") {
          marker.shape = "square";
          marker.tone = "yellow";
        }
        if (event.kind === "card") {
          marker.shape = "card";
          marker.tone =
            event.colour === "red"
              ? "red"
              : event.colour === "blue"
                ? "blue"
                : "yellow";
        }
        return [marker];
      }),
    [filtered, category, descriptions],
  );

  const chart = useMemo<{
    title: string;
    segments: StatisticsSegment[];
  }>(() => {
    const statistics = getActionStatistics(filtered);
    if (category === "card")
      return {
        title: t("cardBreakdown"),
        segments: (["yellow", "blue", "red"] as const).map((colour) => ({
          id: colour,
          label: recorder(colour),
          value: statistics.cards[colour],
          tone: colour,
        })),
      };
    if (category === "ball-recovery")
      return {
        title: t("recoveryBreakdown"),
        segments: (
          ["interception", "duel", "loose-ball", "other"] as const
        ).map((subtype, index) => ({
          id: subtype,
          label: recorder(subtype),
          value: filtered.filter(
            (event) =>
              event.kind === "ball-recovery" && event.subtype === subtype,
          ).length,
          tone:
            index === 0
              ? "action"
              : index === 1
                ? "blue"
                : index === 2
                  ? "muted"
                  : "yellow",
        })),
      };
    if (category === "ball-loss")
      return {
        title: t("lossBreakdown"),
        segments: (
          ["intercepted-pass", "failed-individual-action", "other"] as const
        ).map((reason, index) => ({
          id: reason,
          label: recorder(reason),
          value: filtered.filter(
            (event) => event.kind === "ball-loss" && event.reason === reason,
          ).length,
          tone: index === 0 ? "red" : index === 1 ? "muted" : "blue",
        })),
      };
    if (category === "team-foul")
      return {
        title: t("foulBreakdown"),
        segments: snapshot.match.periods
          .filter((entry) => period === undefined || entry.number === period)
          .map((entry) => ({
            id: String(entry.number),
            label: matches("periodLabel", { number: entry.number }),
            value: filtered.filter((event) => event.period === entry.number)
              .length,
            tone: entry.number === 1 ? "yellow" : "muted",
          })),
      };
    return {
      title: t("shotOutcomes"),
      segments: [
        {
          id: "goal",
          label: t("goals"),
          value: statistics.goals,
          tone: "action",
        },
        {
          id: "on-target",
          label: t("nonGoalOnTarget"),
          value: statistics.onTarget,
          tone: "blue",
        },
        {
          id: "off-target",
          label: t("offTarget"),
          value: statistics.offTarget,
          tone: "muted",
        },
        {
          id: "blocked",
          label: t("blocked"),
          value: statistics.blocked,
          tone: "yellow",
        },
      ],
    };
  }, [
    filtered,
    category,
    snapshot.match.periods,
    period,
    t,
    recorder,
    matches,
  ]);
  const detail = activeEvent ? descriptions.get(activeEvent.id) : undefined;

  const clearSelection = useCallback(() => {
    setPinned(undefined);
    setPreview(undefined);
  }, []);
  const selectEvent = useCallback(
    (eventId: string) => {
      setPinned((previous) => (previous === eventId ? undefined : eventId));
      setPreview(undefined);
      const list = timelineRef.current;
      const row = document.getElementById(`${timelineId}-${eventId}`);
      if (list && row) {
        const listBounds = list.getBoundingClientRect();
        const rowBounds = row.getBoundingClientRect();
        if (
          rowBounds.top < listBounds.top ||
          rowBounds.bottom > listBounds.bottom
        ) {
          list.scrollTop +=
            rowBounds.top -
            listBounds.top -
            (list.clientHeight - rowBounds.height) / 2;
        }
        if (compact)
          row.scrollIntoView({ block: "nearest", behavior: "instant" });
      }
    },
    [timelineId, compact],
  );

  return (
    <section id={id} className={st.section} aria-labelledby={heading}>
      <div className={st.heading}>
        <h3 id={heading}>{t("eventMap")}</h3>
        <span>
          {period === undefined
            ? t("allMatch")
            : matches("periodLabel", { number: period })}
        </span>
      </div>
      {selectedPlayer && (
        <div className={st.playerFilter} role="status">
          <span>
            {t("selectedPlayer", { name: selectedPlayer.playerNameAtMatch })}
          </span>
          <Button
            size="sm"
            variant="subtle"
            onClick={onClearPlayer}
            aria-label={t("clearPlayer")}
          >
            {t("clear")}
          </Button>
        </div>
      )}
      <div
        className={st.categories}
        role="group"
        aria-label={t("categoryFilter")}
      >
        {categories.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={category === option.value ? "filled" : "default"}
            aria-pressed={category === option.value}
            className={st.category}
            onClick={() => {
              setCategory(option.value);
              setPinned(undefined);
              setPreview(undefined);
            }}
          >
            {option.label}
            <span className={st.categoryCount}>
              {categoryCounts[option.value]}
            </span>
          </Button>
        ))}
      </div>
      <div className={st.analysis}>
        <div className={st.mapColumn}>
          <div className={st.rinkSurface}>
            <div className={st.direction}>
              <span>{recorder("rinkDefence")}</span>
              <span>
                {recorder("rinkAttack")}
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </div>
            <EventRink
              label={t("mapLabel")}
              markers={markers}
              activeId={activeEvent?.id}
              selectedId={pinnedEvent?.id}
              onPreview={setPreview}
              onSelect={selectEvent}
            />
            <div className={st.mapFooter}>
              <span>
                {t("positioned", {
                  positioned: markers.length,
                  count: filtered.length,
                })}
              </span>
              <span>{t("mapDirection")}</span>
            </div>
          </div>
          {markers.length === 0 && (
            <p className={st.noPositions}>{t("noRecordedPositions")}</p>
          )}
          <div className={st.legend}>
            {category === "shot" ? (
              chart.segments.map((segment) => (
                <span key={segment.id}>
                  <i
                    className={st.dot}
                    data-tone={segment.tone}
                    aria-hidden="true"
                  />
                  {segment.label}
                </span>
              ))
            ) : (
              <>
                <span>
                  <i className={st.dot} aria-hidden="true" />
                  {t("shotLegend")}
                </span>
                <span>
                  <i className={st.diamond} aria-hidden="true" />
                  {t("recoveriesLegend")}
                </span>
                <span>
                  <i className={st.cross} aria-hidden="true">
                    ×
                  </i>
                  {t("lossesLegend")}
                </span>
                <span>
                  <i className={st.square} aria-hidden="true" />
                  {t("foulLegend")}
                </span>
                <span>
                  <i className={st.card} aria-hidden="true" />
                  {t("cardLegend")}
                </span>
              </>
            )}
          </div>
          <div
            id={detailId}
            className={st.detail}
            aria-live={preview ? "off" : "polite"}
          >
            <span className={st.detailIcon}>
              {activeEvent ? (
                <RecorderActionIcon kind={activeEvent.kind} size={16} />
              ) : (
                <MousePointer2 size={16} aria-hidden="true" />
              )}
            </span>
            <div className={st.detailText}>
              <strong>
                {detail
                  ? `${detail.action} · ${detail.participant}`
                  : t("selectEvent")}
              </strong>
              <span>{detail ? detail.context : t("selectHint")}</span>
            </div>
            {pinnedEvent && (
              <ActionIcon
                type="button"
                aria-label={t("clearEvent")}
                onClick={clearSelection}
              >
                <X size={16} aria-hidden="true" />
              </ActionIcon>
            )}
          </div>
          <StatisticsBreakdown
            title={chart.title}
            totalLabel={t("recordedCount", {
              count: chart.segments.reduce(
                (sum, segment) => sum + segment.value,
                0,
              ),
            })}
            segments={chart.segments}
          />
        </div>
        <section className={st.timeline} aria-labelledby={timelineHeading}>
          <div className={st.timelineHeading}>
            <h3 id={timelineHeading}>{t("timeline")}</h3>
            <span>{t("eventCount", { count: filtered.length })}</span>
          </div>
          <ol
            id={timelineId}
            ref={timelineRef}
            className={st.events}
            aria-labelledby={timelineHeading}
            tabIndex={filtered.length ? 0 : undefined}
          >
            {filtered.map((event) => {
              const description = descriptions.get(event.id);
              return description ? (
                <MatchTimelineRow
                  key={event.id}
                  id={`${timelineId}-${event.id}`}
                  event={event}
                  description={description}
                  active={activeEvent?.id === event.id}
                  selected={pinnedEvent?.id === event.id}
                  compact={compact}
                  detailId={detailId}
                  onPreview={setPreview}
                  onSelect={selectEvent}
                  onClear={clearSelection}
                />
              ) : null;
            })}
          </ol>
          {filtered.length === 0 && (
            <p className={st.empty}>{t("emptyEvents")}</p>
          )}
        </section>
      </div>
    </section>
  );
}
