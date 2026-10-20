"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
import { MatchForm } from "../../../features/matches/MatchForm/MatchForm";
import { useCreateMatch } from "../../../features/matches/mutations/matches.mutations";
import { MatchReferencesUnavailableError } from "../../../features/matches/matches.service";
export function NewMatchPage() {
  const t = useTranslations("matches");
  const router = useRouter();
  const creation = useCreateMatch();
  return (
    <EntityPage
      backHref="/app/matches"
      backLabel={t("back")}
      title={t("newTitle")}
      description={t("newDescription")}
      storageNotice={t("storageNotice")}
    >
      <MatchForm
        pending={creation.isPending}
        failed={creation.isError}
        failedLabel={
          creation.error instanceof MatchReferencesUnavailableError
            ? t("referencesUnavailable")
            : t("saveFailed")
        }
        submitLabel={t("create")}
        onSave={async (input) => {
          const snapshot = await creation.mutateAsync(input);
          router.replace(`/app/matches/view?id=${snapshot.match.id}`);
        }}
      />
    </EntityPage>
  );
}
