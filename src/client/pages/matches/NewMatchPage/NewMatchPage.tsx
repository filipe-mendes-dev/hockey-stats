"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import st from "./NewMatchPage.module.css";
import { NewMatchWizard } from "../../../features/matches/NewMatchWizard/NewMatchWizard";
import { useCreateMatch } from "../../../features/matches/mutations/matches.mutations";
import { MatchReferencesUnavailableError } from "../../../features/matches/matches.service";
export function NewMatchPage() {
  const t = useTranslations("matches");
  const router = useRouter();
  const creation = useCreateMatch();
  return (
    <section className={st.page}>
      <PageHeader
        back={{
          href: "/app/matches",
          label: t("back"),
          disabled: creation.isPending,
        }}
        title={t("newTitle")}
        description={t("newDescription")}
      />
      <NewMatchWizard
        pending={creation.isPending}
        error={
          creation.isError
            ? creation.error instanceof MatchReferencesUnavailableError
              ? t("referencesUnavailable")
              : t("saveFailed")
            : null
        }
        onDraftChange={() => {
          if (creation.isError) creation.reset();
        }}
        onSave={async (input) => {
          const snapshot = await creation.mutateAsync(input);
          router.replace(`/app/matches/view?id=${snapshot.match.id}`);
        }}
      />
    </section>
  );
}
