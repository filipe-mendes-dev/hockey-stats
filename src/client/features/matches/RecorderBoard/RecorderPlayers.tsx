"use client";
import { Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { getAvailableEventKinds } from "../../../../domain/matches/matchRules";
import type { MatchPlayer } from "../../../../domain/matches/match.schema";
import type { RecorderPlayersProps } from "./RecorderBoard.interfaces";
import st from "./RecorderPlayers.module.css";
export function RecorderPlayers({
  context,
  disabled,
  onPick,
}: RecorderPlayersProps) {
  const t = useTranslations("recorder");
  const roles = useTranslations("teamPlayers");
  const eligible = context.snapshot.players.filter(
    (player) => getAvailableEventKinds(context, player.id).length > 0,
  );
  const active = eligible.filter((player) =>
    context.state.activePlayerIds.has(player.id),
  );
  const bench = eligible.filter(
    (player) => !context.state.activePlayerIds.has(player.id),
  );
  function playerButton(player: MatchPlayer, reserve = false) {
    return (
      <button
        type="button"
        className={reserve ? st.reserve : st.player}
        disabled={disabled}
        title={player.playerNameAtMatch}
        aria-label={`${player.jerseyNumber === undefined ? "" : `#${player.jerseyNumber} `}${player.playerNameAtMatch} · ${roles(player.role)}`}
        onClick={() => onPick({ matchPlayerId: player.id })}
      >
        <span className={st.number}>{player.jerseyNumber ?? "·"}</span>
        <span className={st.name}>{player.playerNameAtMatch}</span>
        {player.role === "goalkeeper" && (
          <Shield size={16} aria-hidden="true" />
        )}
      </button>
    );
  }
  return (
    <section className={st.section} aria-labelledby="recorder-players">
      <div className={st.lineupHeading}>
        <h2 id="recorder-players" className={st.heading} tabIndex={-1}>
          {t("onField")}
        </h2>
        {context.state.isPowerplay && (
          <span className={st.powerplay}>{t("powerplayActiveShort")}</span>
        )}
        <span className={st.count}>
          {active.length}/{context.state.maxOnField}
        </span>
        {getAvailableEventKinds(context).includes("player-in") && (
          <Button
            size="sm"
            variant="subtle"
            disabled={disabled}
            onClick={() => onPick({ kind: "player-in" })}
          >
            {t("player-in")}
          </Button>
        )}
      </div>
      <ul className={st.field}>
        {active
          .filter((p) => p.role !== "goalkeeper")
          .map((player) => (
            <li key={player.id}>{playerButton(player)}</li>
          ))}
      </ul>
      {active
        .filter((p) => p.role === "goalkeeper")
        .map((player) => (
          <div key={player.id} className={st.keeper}>
            {playerButton(player)}
            <Button
              variant="subtle"
              size="sm"
              disabled={
                disabled ||
                !getAvailableEventKinds(context).includes("goalkeeper-save")
              }
              onClick={() => onPick({ kind: "goalkeeper-save" })}
            >
              {t("goalkeeper-save")}
            </Button>
          </div>
        ))}
      {bench.length > 0 && (
        <div className={st.bench}>
          <h3 className={st.heading}>{t("bench")}</h3>
          <ul>
            {bench.map((player) => (
              <li key={player.id}>{playerButton(player, true)}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
