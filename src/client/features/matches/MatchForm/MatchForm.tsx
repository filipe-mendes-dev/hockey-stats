"use client";
import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { EntityForm } from "../../../components/EntityForm/EntityForm";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { TextInputField } from "../../../components/TextInputField/TextInputField";
import { ButtonLink } from "../../../components/Button/Button";
import { MatchPlayerSelection } from "../MatchPlayerSelection/MatchPlayerSelection";
import type { MatchPlayerChoice } from "../MatchPlayerSelection/MatchPlayerSelection.interfaces";
import { useTeams } from "../../teams/queries/teams.queries";
import {
  createMatchInputSchema,
  isValidMatchCallUp,
} from "../../../../domain/matches/match.schema";
import type { CreateMatchInput } from "../../../../domain/matches/match.schema";
import type { MatchFormProps } from "./MatchForm.interfaces";
import st from "./MatchForm.module.css";
export function MatchForm({
  initial,
  pending,
  failed,
  failedLabel,
  submitLabel,
  onSave,
  onCancel,
}: MatchFormProps) {
  const t = useTranslations("matches");
  const teams = useTeams();
  const [teamId, setTeamId] = useState(initial?.match.teamId ?? "");
  const [opponentName, setOpponentName] = useState(
    initial?.match.opponentName ?? "",
  );
  const [scheduledDate, setScheduledDate] = useState(
    initial?.match.scheduledDate ?? "",
  );
  const [venueRole, setVenueRole] = useState(initial?.match.venueRole ?? "");
  const [selected, setSelected] = useState<Record<string, MatchPlayerChoice>>(
    () =>
      Object.fromEntries(
        (initial?.players ?? []).map((player) => [
          player.playerId,
          { jerseyNumber: player.jerseyNumber ?? "", role: player.role },
        ]),
      ),
  );
  const [invalid, setInvalid] = useState(false);
  const teamInput = useRef<HTMLSelectElement>(null);
  const opponentInput = useRef<HTMLInputElement>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const callUp = useRef<HTMLDivElement>(null);
  const submitted = useRef(false);
  const teamValid = !!teams.data?.some((team) => team.id === teamId);
  const callUpValid = isValidMatchCallUp(Object.values(selected));
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || pending) return;
    const input = createMatchInputSchema.safeParse({
      teamId,
      opponentName,
      scheduledDate,
      venueRole,
      players: Object.entries(selected).map(([playerId, fields]) => ({
        playerId,
        ...fields,
      })),
    });
    if (!input.success || !teamValid) {
      setInvalid(true);
      if (!teamValid) teamInput.current?.focus();
      else if (!opponentName.trim()) opponentInput.current?.focus();
      else if (!callUpValid) callUp.current?.focus();
      else dateInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data);
  }
  async function save(input: CreateMatchInput): Promise<void> {
    try {
      await onSave(input);
    } catch {
      /* Retain the form and selection until a local transaction succeeds. */
    } finally {
      submitted.current = false;
    }
  }
  return (
    <>
      {teams.isPending || teams.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={teams.isError}
          onRetry={() => {
            void teams.refetch();
          }}
        />
      ) : teams.data.length === 0 ? (
        <div className={st.empty}>
          <p>{t("noTeams")}</p>
          <ButtonLink href="/app/teams">{t("manageTeams")}</ButtonLink>
        </div>
      ) : (
        <EntityForm
          pending={pending}
          failed={failed}
          failedLabel={failedLabel}
          submitLabel={pending ? t("saving") : submitLabel}
          {...(onCancel ? { onCancel } : {})}
          cancelLabel={t("cancel")}
          cancelHref="/app/matches"
          onSubmit={submit}
        >
          <label className={st.select} htmlFor="match-team">
            {t("team")} · {t("required")}
            <select
              id="match-team"
              ref={teamInput}
              value={teamId}
              required
              disabled={pending || !!initial}
              aria-invalid={invalid && !teamValid}
              aria-describedby={
                invalid && !teamValid ? "match-team-error" : undefined
              }
              onChange={(event) => {
                setTeamId(event.target.value);
                setSelected({});
              }}
            >
              <option value="">{t("chooseTeam")}</option>
              {teams.data.map((team) => (
                <option key={team.id} value={team.id}>
                  {[team.name, team.category, team.season]
                    .filter(Boolean)
                    .join(" · ")}
                </option>
              ))}
            </select>
          </label>
          {invalid && !teamValid && (
            <p className={st.error} id="match-team-error" role="alert">
              {t("teamRequired")}
            </p>
          )}
          <TextInputField
            name="opponentName"
            label={t("opponent")}
            requiredLabel={t("required")}
            required
            inputRef={opponentInput}
            autoComplete="off"
            value={opponentName}
            disabled={pending}
            error={
              invalid && !opponentName.trim()
                ? t("opponentRequired")
                : undefined
            }
            placeholder={t("opponentPlaceholder")}
            onChange={(event) => setOpponentName(event.target.value)}
          />
          <TextInputField
            name="scheduledDate"
            label={t("date")}
            requiredLabel={t("required")}
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            error={
              invalid &&
              scheduledDate &&
              !createMatchInputSchema.shape.scheduledDate.safeParse(
                scheduledDate,
              ).success
                ? t("dateInvalid")
                : undefined
            }
            inputRef={dateInput}
            value={scheduledDate}
            disabled={pending}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
          <label className={st.select} htmlFor="match-venue">
            {t("venueRole")}
            <select
              id="match-venue"
              value={venueRole}
              disabled={pending}
              onChange={(event) => setVenueRole(event.target.value)}
            >
              <option value="">{t("unspecified")}</option>
              {(["home", "away", "neutral"] as const).map((value) => (
                <option key={value} value={value}>
                  {t(value)}
                </option>
              ))}
            </select>
          </label>
          {!initial && <p className={st.hint}>{t("chooseTeamFirst")}</p>}
          <div ref={callUp} tabIndex={-1}>
            <MatchPlayerSelection
              key={teamId}
              teamId={teamId}
              value={selected}
              onChange={setSelected}
              disabled={pending}
              {...(initial ? { existingPlayers: initial.players } : {})}
            />
          </div>
        </EntityForm>
      )}
    </>
  );
}
