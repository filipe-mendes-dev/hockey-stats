"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCreateTeam } from "../../../features/teams/mutations/teams.mutations";
import { TeamForm } from "../../../features/teams/TeamForm/TeamForm";
import { EntityPage } from "../../../components/EntityPage/EntityPage";
export function NewTeamPage() {
  const creation = useCreateTeam();
  const router = useRouter();
  const t = useTranslations("teams");
  return (
    <EntityPage
      backHref="/app/teams"
      backLabel={t("back")}
      title={t("newTitle")}
      description={t("newDescription")}
      storageNotice={t("storageNotice")}
    >
      <TeamForm
        pending={creation.isPending}
        failed={creation.isError}
        failedLabel={t("saveFailed")}
        submitLabel={t("create")}
        onSave={async (input) => {
          const team = await creation.mutateAsync(input);
          router.replace(`/app/teams/view?id=${team.id}`);
        }}
      />
    </EntityPage>
  );
}
