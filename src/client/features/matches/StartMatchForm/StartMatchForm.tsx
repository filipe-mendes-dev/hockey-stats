"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  startMatchInputSchema,
  regulationPeriodsSchema,
} from "../../../../domain/matches/match.schema";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import { SelectableEntityRow } from "../../../components/SelectableEntityRow/SelectableEntityRow";
import { PlayerAvatar } from "../../players/PlayerAvatar/PlayerAvatar";
import { useLanguage } from "../../../i18n/LanguageProvider";
import type { StartMatchFormProps } from "./StartMatchForm.interfaces";
import st from "./StartMatchForm.module.css";

export function StartMatchForm({
  snapshot,
  pending,
  error,
  onStart,
}: StartMatchFormProps) {
  const [initial] = useState(snapshot);
  const [starterIds, setStarterIds] = useState<string[]>([]);
  const submitted = useRef(false);
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const players = [...initial.players].sort((a, b) =>
    collator.compare(a.playerNameAtMatch, b.playerNameAtMatch),
  );
  const groups = [
    { role: "field-player", label: t("starterGroupField"), limit: 4 },
    { role: "goalkeeper", label: t("starterGroupKeeper"), limit: 1 },
  ];
  const enoughPlayers = groups.every(
    (group) =>
      players.filter((player) => player.role === group.role).length >=
      group.limit,
  );
  const validLineup = groups.every(
    (group) =>
      players.filter(
        (player) =>
          player.role === group.role && starterIds.includes(player.id),
      ).length === group.limit,
  );
  const configured = regulationPeriodsSchema.safeParse(
    initial.match.periods,
  ).success;
  const backHref = `/app/matches/view?id=${encodeURIComponent(initial.match.id)}`;

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending || submitted.current || !validLineup || !configured) return;
    const input = startMatchInputSchema.safeParse({
      id: initial.match.id,
      expectedRevision: initial.match.revision,
      starterIds,
    });
    if (!input.success) return;
    submitted.current = true;
    void onStart(input.data).catch(() => {
      submitted.current = false;
    });
  }

  return (
    <FormLayout
      actionsLayout="wizard"
      label={t("prepareTitle")}
      pending={pending}
      error={error}
      submitLabel={t(pending ? "starting" : "start")}
      submitDisabled={!validLineup || !configured || !enoughPlayers}
      cancelLabel={t("cancel")}
      cancelHref={backHref}
      onSubmit={submit}
    >
      {!configured && (
        <Alert color="yellow" role="alert">
          <p className={st.notice}>{t("formatMissing")}</p>
          <Button
            component={Link}
            href={backHref}
            prefetch={false}
            variant="subtle"
            size="sm"
            disabled={pending}
          >
            {t("editDetails")}
          </Button>
        </Alert>
      )}
      {!enoughPlayers && (
        <Alert color="yellow" role="alert">
          <p className={st.notice}>{t("callUpInsufficient")}</p>
          <Button
            component={Link}
            href={`${backHref}&edit=call-up`}
            prefetch={false}
            variant="subtle"
            size="sm"
            disabled={pending}
          >
            {t("editCallUp")}
          </Button>
        </Alert>
      )}
      {groups.map((group) => {
        const entries = players.filter((player) => player.role === group.role);
        const count = entries.filter((player) =>
          starterIds.includes(player.id),
        ).length;
        return (
          <section
            key={group.role}
            className={st.group}
            aria-labelledby={`starters-${group.role}`}
          >
            <div className={st.groupHeader}>
              <h2 id={`starters-${group.role}`}>{group.label}</h2>
              <span
                role="status"
                className={st.count}
                data-complete={count === group.limit}
              >
                {t("starterGroupCount", { count, limit: group.limit })}
              </span>
            </div>
            <ul className={st.list} aria-label={group.label}>
              {entries.map((player) => {
                const checked = starterIds.includes(player.id);
                return (
                  <SelectableEntityRow
                    key={player.id}
                    title={player.playerNameAtMatch}
                    avatar={<PlayerAvatar name={player.playerNameAtMatch} />}
                    description={[
                      assignment(player.role),
                      player.jerseyNumber ? `#${player.jerseyNumber}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    checked={checked}
                    disabled={pending || (!checked && count >= group.limit)}
                    onChange={(selected) => {
                      if (
                        pending ||
                        submitted.current ||
                        (selected && count >= group.limit)
                      )
                        return;
                      setStarterIds((current) =>
                        selected
                          ? [
                              ...current.filter((id) => id !== player.id),
                              player.id,
                            ]
                          : current.filter((id) => id !== player.id),
                      );
                    }}
                  />
                );
              })}
            </ul>
          </section>
        );
      })}
    </FormLayout>
  );
}
