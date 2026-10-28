"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Info, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { sortMatchEvents } from "../../../../domain/matches/matchEventOrder";
import type { MatchEvent } from "../../../../domain/matches/matchEvent.schema";
import { toViewPosition } from "../../../../domain/matches/rinkPosition";
import { EventRink } from "../../../components/EventRink/EventRink";
import { HockeyRinkLabels } from "../../../components/HockeyRink/HockeyRinkLabels";
import type { EventRinkMarker } from "../../../components/EventRink/EventRink.interfaces";
import { StatisticsBreakdown } from "../../../components/StatisticsBreakdown/StatisticsBreakdown";
import { MatchEventIcon } from "../../../components/MatchEventIcon/MatchEventIcon";
import { MatchEventList } from "../MatchEventList/MatchEventList";
import type {
  MatchEventAnalysisProps,
  StatisticsCategory,
} from "./MatchEventAnalysis.interfaces";
import st from "./MatchEventAnalysis.module.css";
import { useEventDescriptions } from "./useEventDescriptions";
import { useEventBreakdowns } from "./useEventBreakdowns";
import { getEventPresentation } from "../eventPresentation";
import { PlayerLineupTimeline } from "../PlayerLineupTimeline/PlayerLineupTimeline";
import { MatchAnalysisFilters } from "../MatchAnalysisFilters/MatchAnalysisFilters";

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
  onSelectPlayer,
  id,
}: MatchEventAnalysisProps) {
  const t = useTranslations("statistics");
  const recorder = useTranslations("recorder");
  const matches = useTranslations("matches");
  const heading = useId();
  const categoryInputId = useId();
  const [category, setCategory] = useState<StatisticsCategory>("all");
  const [pinned, setPinned] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const categories: readonly { value: StatisticsCategory; label: string }[] = [
    { value: "all", label: t("allActions") },
    { value: "shot", label: t("shots") },
    { value: "ball-recovery", label: t("recoveries") },
    { value: "ball-loss", label: t("losses") },
    { value: "team-foul", label: t("fouls") },
    { value: "card", label: t("cards") },
    { value: "substitution", label: t("substitutions") },
    { value: "goalkeeper-save", label: t("saves") },
    { value: "timeout", label: t("timeouts") },
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
      sortMatchEvents(
        scoped.filter((event) => category === "all" || event.kind === category),
        true,
      ),
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
      substitution: scoped.filter((event) => event.kind === "substitution")
        .length,
      "goalkeeper-save": scoped.filter(
        (event) => event.kind === "goalkeeper-save",
      ).length,
      timeout: scoped.filter((event) => event.kind === "timeout").length,
    }),
    [scoped],
  );
  const pinnedEvent = filtered.find((event) => event.id === pinned);
  const activeEvent =
    filtered.find((event) => event.id === preview) ?? pinnedEvent;
  const selectedPlayer = snapshot.players.find(
    (player) => player.id === selectedPlayerId,
  );

  const descriptions = useEventDescriptions(snapshot, events);

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
          kind: event.kind,
          ...getEventPresentation(event),
        };
        return [marker];
      }),
    [filtered, descriptions],
  );

  const charts = useEventBreakdowns(
    filtered,
    category,
    snapshot.match.periods,
    period,
  );

  const clearSelection = useCallback(() => {
    setPinned(undefined);
    setPreview(undefined);
  }, []);
  const selectEvent = useCallback((eventId: string) => {
    setPinned((previous) => (previous === eventId ? undefined : eventId));
    setPreview(undefined);
  }, []);

  function changeCategory(next: StatisticsCategory): void {
    setCategory(next);
    clearSelection();
  }

  return (
    <section id={id} className={st.section} aria-labelledby={heading}>
      <div className={st.workspace} data-analysis-workspace>
        <div className={st.controls}>
          <div className={st.heading}>
            <div className={st.headingCopy}>
              <h3 id={heading}>{t("eventMap")}</h3>
              <span>
                {period === undefined
                  ? t("allMatch")
                  : matches("periodLabel", { number: period })}
              </span>
            </div>
            {selectedPlayer && (
              <div className={st.playerFilter} role="status">
                <span className={st.filterLabel}>{t("player")}</span>
                <strong
                  title={t("selectedPlayer", {
                    name: selectedPlayer.playerNameAtMatch,
                  })}
                >
                  {selectedPlayer.jerseyNumber && (
                    <span>#{selectedPlayer.jerseyNumber} </span>
                  )}
                  {selectedPlayer.playerNameAtMatch}
                </strong>
                <ActionIcon
                  className={st.clearPlayer}
                  variant="subtle"
                  onClick={onClearPlayer}
                  aria-label={t("clearPlayer")}
                >
                  <X size={14} aria-hidden="true" />
                </ActionIcon>
              </div>
            )}
          </div>
          <MatchAnalysisFilters
            id={categoryInputId}
            options={categories}
            counts={categoryCounts}
            value={category}
            onChange={changeCategory}
          />
        </div>
        <PlayerLineupTimeline
          snapshot={snapshot}
          events={events}
          visibleEvents={filtered}
          descriptions={descriptions}
          period={period}
          activeEventId={activeEvent?.id}
          selectedEventId={pinnedEvent?.id}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={onSelectPlayer}
          onPreview={setPreview}
          onSelect={selectEvent}
        />
        <div className={st.analysis}>
          <div className={st.mapColumn}>
            <div className={st.rinkSurface}>
              <HockeyRinkLabels
                attackingEnd="right"
                attackLabel={recorder("rinkAttack")}
                defenceLabel={recorder("rinkDefence")}
              />
              <EventRink
                label={t("mapLabel")}
                fit
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
                <Tooltip
                  label={t("mapDirection")}
                  events={{ hover: true, focus: true, touch: true }}
                >
                  <ActionIcon
                    variant="subtle"
                    className={st.mapInfo}
                    aria-label={t("mapDirection")}
                  >
                    <Info size={14} aria-hidden="true" />
                  </ActionIcon>
                </Tooltip>
              </div>
            </div>
            {markers.length === 0 && (
              <p className={st.noPositions}>{t("noRecordedPositions")}</p>
            )}
            <div className={st.legend}>
              <span data-event-tone="action">
                <MatchEventIcon kind="shot" size={14} />
                {t("goals")}
              </span>
              <span data-event-tone="blue">
                <MatchEventIcon kind="shot" size={14} />
                {t("nonGoalOnTarget")}
              </span>
              <span data-event-tone="yellow">
                <MatchEventIcon kind="shot" size={14} />
                {t("blocked")}
              </span>
              <span data-event-tone="muted">
                <MatchEventIcon kind="shot" size={14} />
                {t("offTarget")}
              </span>
              <span data-event-tone="action">
                <MatchEventIcon kind="ball-recovery" size={14} />
                {t("recoveriesLegend")}
              </span>
              <span data-event-tone="red">
                <MatchEventIcon kind="ball-loss" size={14} />
                {t("lossesLegend")}
              </span>
              <span data-event-tone="yellow">
                <MatchEventIcon kind="team-foul" size={14} />
                {t("foulLegend")}
              </span>
              <span data-event-tone="blue">
                <MatchEventIcon kind="card" size={14} />
                {t("cardLegend")}
              </span>
            </div>
          </div>
          <MatchEventList
            fallbackFocusId={categoryInputId}
            events={filtered}
            descriptions={descriptions}
            activeEventId={activeEvent?.id}
            selectedEventId={pinnedEvent?.id}
            periodLabel={
              period === undefined
                ? t("allMatch")
                : matches("periodLabel", { number: period })
            }
            playerLabel={selectedPlayer?.playerNameAtMatch}
            filters={
              <MatchAnalysisFilters
                options={categories}
                counts={categoryCounts}
                value={category}
                onChange={changeCategory}
              />
            }
            onPreview={setPreview}
            onSelect={selectEvent}
            onClear={clearSelection}
          />
        </div>
      </div>
      <div className={st.breakdown}>
        {charts.map((chart) => (
          <StatisticsBreakdown
            key={chart.title}
            title={chart.title}
            totalLabel={t("recordedCount", {
              count: chart.segments.reduce(
                (sum, segment) => sum + segment.value,
                0,
              ),
            })}
            segments={chart.segments}
          />
        ))}
      </div>
    </section>
  );
}
