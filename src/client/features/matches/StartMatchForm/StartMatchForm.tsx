"use client";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { startMatchInputSchema } from "../../../../domain/matches/match.schema";
import type { Match } from "../../../../domain/matches/match.schema";
import { useStartMatch } from "../mutations/matches.mutations";
import { MatchChangedError } from "../matches.service";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { SelectableListItem } from "../../../components/SelectableListItem/SelectableListItem";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
import { Button } from "../../../components/Button/Button";
import type {
  StartMatchFormProps,
  PeriodDraft,
} from "./StartMatchForm.interfaces";
import st from "./StartMatchForm.module.css";
export function StartMatchForm({ snapshot }: StartMatchFormProps) {
  const [initial] = useState(snapshot);
  const [starterIds, setStarterIds] = useState<string[]>([]);
  const [periods, setPeriods] = useState<PeriodDraft[]>([{ duration: "" }]);
  const [direction, setDirection] =
    useState<Match["periods"][number]["attackDirection"]>("unknown");
  const [invalid, setInvalid] = useState(false);
  const submitted = useRef(false);
  const lineup = useRef<HTMLFieldSetElement>(null);
  const settings = useRef<HTMLFieldSetElement>(null);
  const start = useStartMatch();
  const router = useRouter();
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const starters = initial.players.filter((player) =>
    starterIds.includes(player.id),
  );
  const fieldCount = starters.filter(
    (player) => player.role === "field-player",
  ).length;
  const keeperCount = starters.filter(
    (player) => player.role === "goalkeeper",
  ).length;
  const validLineup = fieldCount === 4 && keeperCount === 1;
  const validPeriods = periods.every(
    (period) =>
      !period.duration.trim() ||
      (Number.isSafeInteger(Number(period.duration) * 60_000) &&
        Number(period.duration) > 0),
  );
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || start.isPending) return;
    const input = startMatchInputSchema.safeParse({
      id: initial.match.id,
      expectedRevision: initial.match.revision,
      starterIds,
      periods: periods.map((period, index) => ({
        number: index + 1,
        durationMs: period.duration.trim()
          ? Number(period.duration) * 60_000
          : undefined,
        attackDirection: index === 0 ? direction : "unknown",
      })),
    });
    if (!input.success || !validLineup) {
      setInvalid(true);
      if (!validLineup) lineup.current?.focus();
      else settings.current?.focus();
      return;
    }
    submitted.current = true;
    void start
      .mutateAsync(input.data)
      .then((saved) => {
        router.replace(`/app/matches/live?id=${saved.match.id}`);
      })
      .catch(() => {
        submitted.current = false;
      });
  }
  return (
    <EntityForm
      pending={start.isPending}
      failed={start.isError}
      failedLabel={
        start.error instanceof MatchChangedError
          ? t("changed")
          : t("startFailed")
      }
      submitLabel={start.isPending ? t("starting") : t("start")}
      cancelLabel={t("cancel")}
      cancelHref={`/app/matches/view?id=${initial.match.id}`}
      onSubmit={submit}
    >
      <fieldset
        className={st.section}
        disabled={start.isPending}
        ref={lineup}
        tabIndex={-1}
      >
        <legend>{t("starters")}</legend>
        <p>{t("starterDescription")}</p>
        <div role="status">
          <p>{t("starterFieldCount", { count: fieldCount })}</p>
          <p>{t("starterKeeperCount", { count: keeperCount })}</p>
        </div>
        {invalid && !validLineup && (
          <p className={st.error} role="alert">
            {t("invalidStarters")}
          </p>
        )}
        <ul className={st.list}>
          {initial.players.map((player) => (
            <SelectableListItem
              key={player.id}
              title={player.playerNameAtMatch}
              description={`${assignment(player.role)}${player.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}`}
              checked={starterIds.includes(player.id)}
              disabled={
                start.isPending ||
                (!starterIds.includes(player.id) &&
                  (player.role === "goalkeeper"
                    ? keeperCount >= 1
                    : fieldCount >= 4))
              }
              onChange={(checked) =>
                setStarterIds(
                  checked
                    ? [...starterIds, player.id]
                    : starterIds.filter((id) => id !== player.id),
                )
              }
            />
          ))}
        </ul>
      </fieldset>
      <fieldset
        className={st.section}
        disabled={start.isPending}
        ref={settings}
        tabIndex={-1}
      >
        <legend>{t("periods")}</legend>
        {periods.map((period, index) => (
          <TextInputField
            key={index}
            name={`period-${index + 1}`}
            label={`${t("periodLabel", { number: index + 1 })} · ${t("duration")}`}
            requiredLabel={t("required")}
            type="number"
            min="0"
            step="any"
            value={period.duration}
            onChange={(event) =>
              setPeriods(
                periods.map((entry, position) =>
                  position === index ? { duration: event.target.value } : entry,
                ),
              )
            }
          />
        ))}
        <div className={st.actions}>
          <Button
            variant="secondary"
            onClick={() => setPeriods([...periods, { duration: "" }])}
          >
            {t("addPeriod")}
          </Button>
          <Button
            variant="secondary"
            disabled={periods.length <= 1}
            onClick={() => setPeriods(periods.slice(0, -1))}
          >
            {t("removePeriod")}
          </Button>
        </div>
        <label className={st.select}>
          {t("direction")}
          <select
            value={direction}
            onChange={(event) => {
              const value = event.target.value;
              if (
                value === "unknown" ||
                value === "toward-x0" ||
                value === "toward-x1"
              )
                setDirection(value);
            }}
          >
            {(["unknown", "toward-x0", "toward-x1"] as const).map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </select>
        </label>
        {invalid && !validPeriods && (
          <p className={st.error} role="alert">
            {t("periodInvalid")}
          </p>
        )}
      </fieldset>
    </EntityForm>
  );
}
