"use client";

import { useId } from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import type { EventPlayerChoicesProps } from "./EventPlayerChoices.interfaces";
import st from "./EventPlayerChoices.module.css";

export function EventPlayerChoices({
  players,
  activePlayerIds,
  onSelect,
}: EventPlayerChoicesProps) {
  const t = useTranslations("recorder");
  const roles = useTranslations("teamPlayers");
  const id = useId();
  const hasBenchPlayers = players.some(
    (player) => !activePlayerIds.has(player.id),
  );
  return (
    <div className={st.groups}>
      {(["onField", "bench"] as const).map((group) => {
        const options = players.filter(
          (player) => activePlayerIds.has(player.id) === (group === "onField"),
        );
        if (!options.length) return null;
        return (
          <section
            key={group}
            className={st.group}
            aria-labelledby={`${id}-${group}`}
          >
            <h3
              id={`${id}-${group}`}
              className={
                group === "onField" && !hasBenchPlayers
                  ? st.hiddenHeading
                  : st.heading
              }
            >
              {t(group)}
            </h3>
            <ul
              className={st.players}
              data-few={options.length <= 4 || undefined}
            >
              {[
                ...options.filter((player) => player.role !== "goalkeeper"),
                ...options.filter((player) => player.role === "goalkeeper"),
              ].map((player) => (
                <li
                  key={player.id}
                  data-goalkeeper={player.role === "goalkeeper"}
                >
                  <button
                    type="button"
                    className={st.player}
                    data-role={player.role}
                    data-bench={group === "bench"}
                    onClick={() => onSelect(player.id)}
                    aria-label={`${player.jerseyNumber === undefined ? "" : `#${player.jerseyNumber} `}${player.playerNameAtMatch} · ${roles(player.role)}`}
                    title={player.playerNameAtMatch}
                  >
                    <span className={st.number}>
                      {player.jerseyNumber ?? "·"}
                    </span>
                    <span className={st.name}>{player.playerNameAtMatch}</span>
                    {player.role === "goalkeeper" && (
                      <Shield size={18} aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
