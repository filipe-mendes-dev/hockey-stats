"use client";

import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { StartMatchInput } from "../../../../domain/matches/match.schema";
import { getHalfDurationMinutes } from "../../../../domain/matches/matchFormat";
import { useMatch } from "../../../features/matches/queries/matches.queries";
import { useStartMatch } from "../../../features/matches/mutations/matches.mutations";
import { MatchChangedError } from "../../../features/matches/matches.service";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { EntityDataStatus } from "../../../components/EntityDataStatus/EntityDataStatus";
import { StartMatchForm } from "../../../features/matches/StartMatchForm/StartMatchForm";
import st from "./StartMatchPage.module.css";

export function StartMatchPage() {
  const t = useTranslations("matches");
  const params = useSearchParams();
  const router = useRouter();
  const query = useMatch(params.get("id") ?? undefined);
  const start = useStartMatch();
  const snapshot = query.data;
  const duration = snapshot
    ? getHalfDurationMinutes(snapshot.match.periods)
    : undefined;
  const backHref = snapshot
    ? `/app/matches/view?id=${encodeURIComponent(snapshot.match.id)}`
    : "/app/matches";
  async function save(input: StartMatchInput): Promise<void> {
    const saved = await start.mutateAsync(input);
    router.replace(
      `/app/matches/live?id=${encodeURIComponent(saved.match.id)}`,
    );
  }
  return (
    <section className={st.page}>
      <PageHeader
        title={t("prepareTitle")}
        description={
          snapshot
            ? [
                t("matchLabel", {
                  team: snapshot.match.teamNameAtMatch,
                  opponent: snapshot.match.opponentName,
                }),
                duration !== undefined
                  ? t("matchFormat", { minutes: duration })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : ""
        }
        back={{
          href: backHref,
          label: t(snapshot ? "backToDetails" : "back"),
          disabled: start.isPending,
        }}
      />
      {query.isPending || query.isError ? (
        <EntityDataStatus
          loadingLabel={t("loading")}
          failedLabel={t("loadFailed")}
          retryLabel={t("retry")}
          failed={query.isError}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : !snapshot ? (
        <p>{t("unavailableDescription")}</p>
      ) : snapshot.match.status !== "setup" ? (
        <Button
          component={Link}
          href={`/app/matches/${snapshot.match.status === "completed" ? "view" : "live"}?id=${encodeURIComponent(snapshot.match.id)}`}
          prefetch={false}
          size="sm"
        >
          {t(snapshot.match.status === "completed" ? "summaryTitle" : "resume")}
        </Button>
      ) : (
        <StartMatchForm
          key={snapshot.match.id}
          snapshot={snapshot}
          pending={start.isPending}
          error={
            start.isError
              ? t(
                  start.error instanceof MatchChangedError
                    ? "changed"
                    : "startFailed",
                )
              : null
          }
          onStart={save}
        />
      )}
      {start.isError && snapshot?.match.status !== "setup" && (
        <Alert color="red" role="alert">
          {t("changed")}
        </Alert>
      )}
    </section>
  );
}
