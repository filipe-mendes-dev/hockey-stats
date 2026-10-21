"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import { useTranslations } from "next-intl";
import {
  createMatchInputSchema,
  isValidMatchCallUp,
  matchCallUpLimits,
} from "../../../../domain/matches/match.schema";
import type { CreateMatchInput } from "../../../../domain/matches/match.schema";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { usePlayers } from "../../players/queries/players.queries";
import { useTeams, useTeamPlayers } from "../../teams/queries/teams.queries";
import { MatchFlowProgress } from "../MatchFlowProgress/MatchFlowProgress";
import { getMatchCallUpCandidates } from "../getMatchCallUpCandidates";
import { MatchDetailsFields } from "../MatchDetailsFields/MatchDetailsFields";
import type { MatchDetailsValues } from "../MatchDetailsFields/MatchDetailsFields.interfaces";
import { MatchCallUpSelection } from "../MatchCallUpSelection/MatchCallUpSelection";
import type { MatchCallUpPlayer } from "../MatchCallUpSelection/MatchCallUpSelection.interfaces";
import { MatchCallUpReview } from "../MatchCallUpReview/MatchCallUpReview";
import { MatchCallUpSummary } from "../MatchCallUpSummary/MatchCallUpSummary";
import { MatchReviewSummary } from "../MatchReviewSummary/MatchReviewSummary";
import type { NewMatchWizardProps } from "./NewMatchWizard.interfaces";
import st from "./NewMatchWizard.module.css";

export function NewMatchWizard({
  pending,
  error,
  onSave,
  onDraftChange,
}: NewMatchWizardProps) {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const teams = useTeams();
  const players = usePlayers();
  const [fields, setFields] = useState<MatchDetailsValues>({
    teamId: "",
    opponentName: "",
    scheduledDate: "",
    venueRole: "",
  });
  const memberships = useTeamPlayers(fields.teamId);
  const [selected, setSelected] = useState<Record<string, MatchCallUpPlayer>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const [invalid, setInvalid] = useState(false);
  const [proposedTeam, setProposedTeam] = useState<string | null>(null);
  const submitting = useRef(false);
  const teamInput = useRef<HTMLInputElement>(null);
  const opponentInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const team = teams.data?.find((entry) => entry.id === fields.teamId);
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const available = getMatchCallUpCandidates(
    memberships.data ?? [],
    players.data ?? [],
  ).sort((a, b) => collator.compare(a.name, b.name));
  const chosen = Object.values(selected).sort((a, b) =>
    collator.compare(a.name, b.name),
  );
  const callUpValid =
    isValidMatchCallUp(chosen) && chosen.length <= matchCallUpLimits.total;
  const numbers = chosen
    .map((player) => player.jerseyNumber.trim())
    .filter(Boolean);
  const duplicate = new Set(numbers).size !== numbers.length;
  const loadingPlayers = memberships.isPending || players.isPending;
  const failedPlayers = memberships.isError || players.isError;
  const labels = [t("detailsStep"), t("callUpStep"), t("reviewStep")];
  const compactLabels = [
    t("detailsStepCompact"),
    t("callUpStep"),
    t("reviewStep"),
  ];

  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);

  function validateDetails(): boolean {
    const valid =
      Boolean(team) &&
      createMatchInputSchema.omit({ players: true }).safeParse(fields).success;
    setInvalid(!valid);
    if (!valid) {
      if (!team) teamInput.current?.focus();
      else if (!fields.opponentName.trim()) opponentInput.current?.focus();
    }
    return valid;
  }

  function move(next: number): void {
    if (pending || submitting.current || next === step) return;
    if (next > 0 && !validateDetails()) return;
    if (next === 2 && (loadingPlayers || failedPlayers)) return;
    setStep(next);
    setVisited((current) => Math.max(current, next));
  }

  function changeTeam(teamId: string): void {
    if (teamId === fields.teamId) return;
    if (chosen.length) setProposedTeam(teamId);
    else applyTeam(teamId);
  }

  function applyTeam(teamId: string): void {
    setFields((current) => ({ ...current, teamId }));
    setSelected({});
    setSearch("");
    setVisited(0);
    setProposedTeam(null);
    onDraftChange();
  }

  function toggle(player: MatchCallUpPlayer, checked: boolean): void {
    if (pending || (checked && chosen.length >= matchCallUpLimits.total))
      return;
    setSelected((current) => {
      const next = { ...current };
      if (checked) next[player.playerId] = player;
      else delete next[player.playerId];
      return next;
    });
    onDraftChange();
  }

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending || submitting.current) return;
    if (step < 2) {
      move(step + 1);
      return;
    }
    const input = createMatchInputSchema.safeParse({
      ...fields,
      players: chosen.map(({ playerId, jerseyNumber, role }) => ({
        playerId,
        jerseyNumber,
        role,
      })),
    });
    if (!input.success || !team) {
      setInvalid(true);
      if (!team || !fields.opponentName.trim()) move(0);
      return;
    }
    submitting.current = true;
    void save(input.data);
  }

  async function save(input: CreateMatchInput): Promise<void> {
    try {
      await onSave(input);
    } catch {
      submitting.current = false;
    }
  }

  if (teams.isPending || teams.isError)
    return (
      <EntityDataStatus
        loadingLabel={t("loading")}
        failedLabel={t("loadFailed")}
        retryLabel={t("retry")}
        failed={teams.isError}
        onRetry={() => {
          void teams.refetch();
        }}
      />
    );
  if (teams.data.length === 0)
    return (
      <div className={st.empty}>
        <p>{t("noTeams")}</p>
        <Button
          component={Link}
          href="/app/teams"
          prefetch={false}
          variant="subtle"
          size="sm"
        >
          {t("manageTeams")}
        </Button>
      </div>
    );

  return (
    <div className={st.wizard}>
      <MatchFlowProgress
        labels={labels}
        compactLabels={compactLabels}
        active={step}
        visited={visited}
        disabled={pending}
        onStepChange={move}
      />
      <FormLayout
        actionsLayout="wizard"
        label={t("newTitle")}
        pending={pending}
        error={error}
        submitLabel={
          step === 2 ? t(pending ? "saving" : "create") : t("continue")
        }
        submitDisabled={
          (step === 1 && (loadingPlayers || failedPlayers)) ||
          (step === 2 && !callUpValid)
        }
        cancelLabel={t("cancel")}
        cancelHref="/app/matches"
        {...(step > 0
          ? {
              secondaryAction: {
                label: t("previousStep"),
                onClick: () => move(step - 1),
              },
            }
          : {})}
        onSubmit={submit}
      >
        <section className={st.stepContent} aria-labelledby="new-match-step">
          <h2
            ref={heading}
            id="new-match-step"
            className={st.heading}
            tabIndex={-1}
          >
            {labels[step]}
          </h2>
          {step === 0 ? (
            <MatchDetailsFields
              values={fields}
              teams={teams.data}
              disabled={pending}
              invalid={invalid}
              teamInput={teamInput}
              opponentInput={opponentInput}
              onTeamChange={changeTeam}
              onChange={(values) => {
                setFields(values);
                onDraftChange();
              }}
            />
          ) : (
            <>
              {step === 2 && (
                <MatchReviewSummary
                  team={team}
                  opponent={fields.opponentName}
                  scheduledDate={fields.scheduledDate}
                  venueRole={fields.venueRole}
                />
              )}
              <MatchCallUpSummary players={chosen} />
              {!callUpValid && (
                <Alert color="red" role="alert">
                  {t("invalidCallUp")}
                </Alert>
              )}
              {duplicate && (
                <p className={st.hint} role="status">
                  {assignment("duplicate")}
                </p>
              )}
              {step === 1 ? (
                loadingPlayers || failedPlayers ? (
                  <EntityDataStatus
                    loadingLabel={t("loading")}
                    failedLabel={t("loadFailed")}
                    retryLabel={t("retry")}
                    failed={failedPlayers}
                    onRetry={() => {
                      void memberships.refetch();
                      void players.refetch();
                    }}
                  />
                ) : (
                  <MatchCallUpSelection
                    available={available}
                    selected={selected}
                    search={search}
                    disabled={pending}
                    onSearchChange={setSearch}
                    onToggle={toggle}
                  />
                )
              ) : (
                <MatchCallUpReview
                  players={chosen}
                  disabled={pending}
                  onChange={(player) => {
                    setSelected((current) => ({
                      ...current,
                      [player.playerId]: player,
                    }));
                    onDraftChange();
                  }}
                />
              )}
            </>
          )}
        </section>
      </FormLayout>
      <ResponsiveFormDialog
        opened={proposedTeam !== null}
        title={t("changeTeamTitle")}
        closeLabel={t("cancel")}
        cancelLabel={t("cancel")}
        submitLabel={t("changeTeamConfirm")}
        pending={pending}
        error={null}
        onClose={() => setProposedTeam(null)}
        onSubmit={(event) => {
          event.preventDefault();
          if (proposedTeam !== null) applyTeam(proposedTeam);
        }}
      >
        <p className={st.hint}>{t("changeTeamDescription")}</p>
      </ResponsiveFormDialog>
    </div>
  );
}
