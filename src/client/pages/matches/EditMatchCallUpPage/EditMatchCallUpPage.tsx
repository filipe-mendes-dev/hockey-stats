"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { Alert } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  updateMatchSetupInputSchema,
  isValidMatchCallUp,
  matchCallUpLimits,
} from "../../../../domain/matches/match.schema";
import type { UpdateMatchSetupInput } from "../../../../domain/matches/match.schema";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { usePlayers } from "../../../features/players/queries/players.queries";
import { useTeamPlayers } from "../../../features/teams/queries/teams.queries";
import { useUpdateMatchSetup } from "../../../features/matches/mutations/matches.mutations";
import {
  MatchChangedError,
  MatchReferencesUnavailableError,
} from "../../../features/matches/matches.service";
import { getMatchCallUpCandidates } from "../../../features/matches/getMatchCallUpCandidates";
import { MatchFlowProgress } from "../../../features/matches/MatchFlowProgress/MatchFlowProgress";
import { MatchCallUpSelection } from "../../../features/matches/MatchCallUpSelection/MatchCallUpSelection";
import type { MatchCallUpPlayer } from "../../../features/matches/MatchCallUpSelection/MatchCallUpSelection.interfaces";
import { MatchCallUpReview } from "../../../features/matches/MatchCallUpReview/MatchCallUpReview";
import { MatchCallUpSummary } from "../../../features/matches/MatchCallUpSummary/MatchCallUpSummary";
import type { EditMatchCallUpPageProps } from "./EditMatchCallUpPage.interfaces";
import st from "./EditMatchCallUpPage.module.css";

export function EditMatchCallUpPage({ snapshot }: EditMatchCallUpPageProps) {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const router = useRouter();
  const [initial] = useState(snapshot);
  const update = useUpdateMatchSetup();
  const memberships = useTeamPlayers(initial.match.teamId);
  const players = usePlayers();
  const [selected, setSelected] = useState<Record<string, MatchCallUpPlayer>>(
    () =>
      Object.fromEntries(
        initial.players.map((player) => [
          player.playerId,
          {
            playerId: player.playerId,
            name: player.playerNameAtMatch,
            role: player.role,
            jerseyNumber: player.jerseyNumber ?? "",
          },
        ]),
      ),
  );
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(0);
  const [visited, setVisited] = useState(0);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const backHref = `/app/matches/view?id=${encodeURIComponent(initial.match.id)}`;
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const chosen = Object.values(selected).sort((a, b) =>
    collator.compare(a.name, b.name),
  );
  const available = getMatchCallUpCandidates(
    memberships.data ?? [],
    players.data ?? [],
    initial.players,
  ).sort((a, b) => collator.compare(a.name, b.name));
  const callUpValid =
    isValidMatchCallUp(chosen) && chosen.length <= matchCallUpLimits.total;
  const numbers = chosen
    .map((player) => player.jerseyNumber.trim())
    .filter(Boolean);
  const duplicate = new Set(numbers).size !== numbers.length;
  const loading = memberships.isPending || players.isPending;
  const failed = memberships.isError || players.isError;
  const labels = [t("callUpStep"), t("reviewStep")];

  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);

  function move(next: number): void {
    if (
      update.isPending ||
      submitting.current ||
      (next === 1 && (loading || failed))
    )
      return;
    setStep(next);
    setVisited((current) => Math.max(current, next));
  }
  function toggle(player: MatchCallUpPlayer, checked: boolean): void {
    if (
      update.isPending ||
      (checked && chosen.length >= matchCallUpLimits.total)
    )
      return;
    setSelected((current) => {
      const next = { ...current };
      if (checked) next[player.playerId] = player;
      else delete next[player.playerId];
      return next;
    });
    if (update.isError) update.reset();
  }
  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (update.isPending || submitting.current) return;
    if (step === 0) {
      move(1);
      return;
    }
    const input = updateMatchSetupInputSchema.safeParse({
      id: initial.match.id,
      expectedRevision: initial.match.revision,
      teamId: initial.match.teamId,
      opponentName: initial.match.opponentName,
      scheduledDate: initial.match.scheduledDate,
      venueRole: initial.match.venueRole,
      players: chosen.map(({ playerId, role, jerseyNumber }) => ({
        playerId,
        role,
        jerseyNumber,
      })),
    });
    if (!input.success) return;
    submitting.current = true;
    void save(input.data);
  }
  async function save(input: UpdateMatchSetupInput): Promise<void> {
    try {
      await update.mutateAsync(input);
      router.replace(backHref);
    } catch {
      submitting.current = false;
    }
  }
  return (
    <section className={st.page}>
      <PageHeader
        title={t("editCallUp")}
        description={t("matchLabel", {
          team: initial.match.teamNameAtMatch,
          opponent: initial.match.opponentName,
        })}
        back={{
          href: backHref,
          label: t("backToDetails"),
          disabled: update.isPending,
        }}
      />
      {initial.match.status !== "setup" ? (
        <Alert color="red" role="alert">
          {t("changed")}
        </Alert>
      ) : (
        <div className={st.flow}>
          <MatchFlowProgress
            labels={labels}
            active={step}
            visited={visited}
            disabled={update.isPending}
            onStepChange={move}
          />
          <FormLayout
            actionsLayout="wizard"
            label={t("editCallUp")}
            pending={update.isPending}
            error={
              update.isError
                ? update.error instanceof MatchChangedError
                  ? t("changed")
                  : update.error instanceof MatchReferencesUnavailableError
                    ? t("referencesUnavailable")
                    : t("saveFailed")
                : null
            }
            submitLabel={
              step === 0
                ? t("continue")
                : t(update.isPending ? "saving" : "saveCallUp")
            }
            submitDisabled={step === 0 ? loading || failed : !callUpValid}
            cancelLabel={t("cancel")}
            cancelHref={backHref}
            {...(step === 1
              ? {
                  secondaryAction: {
                    label: t("previousStep"),
                    onClick: () => move(0),
                  },
                }
              : {})}
            onSubmit={submit}
          >
            <section className={st.step} aria-labelledby="edit-call-up-step">
              <h2
                ref={heading}
                tabIndex={-1}
                id="edit-call-up-step"
                className={st.heading}
              >
                {labels[step]}
              </h2>
              <MatchCallUpSummary players={chosen} />
              {!callUpValid && (
                <Alert color="red" role="alert">
                  {t("invalidCallUp")}
                </Alert>
              )}
              {duplicate && (
                <p className={st.notice} role="status">
                  {assignment("duplicate")}
                </p>
              )}
              {step === 0 ? (
                loading || failed ? (
                  <EntityDataStatus
                    loadingLabel={t("loading")}
                    failedLabel={t("loadFailed")}
                    retryLabel={t("retry")}
                    failed={failed}
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
                    disabled={update.isPending}
                    onSearchChange={setSearch}
                    onToggle={toggle}
                  />
                )
              ) : (
                <MatchCallUpReview
                  players={chosen}
                  disabled={update.isPending}
                  onChange={(player) => {
                    setSelected((current) => ({
                      ...current,
                      [player.playerId]: player,
                    }));
                    if (update.isError) update.reset();
                  }}
                />
              )}
            </section>
          </FormLayout>
        </div>
      )}
    </section>
  );
}
