"use client";

import { useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCreateTeam } from "../../../features/teams/mutations/teams.mutations";
import { createTeamInputSchema } from "../../../../domain/teams/validation/teamInput.schema";
import type { CreateTeamInput } from "../../../../domain/teams/validation/teamInput.schema";
import { TeamFields } from "../../../features/teams/TeamFields/TeamFields";
import type { TeamFieldValues } from "../../../features/teams/TeamFields/TeamFields.interfaces";
import { PageHeader } from "../../../components/PageHeader/PageHeader";
import { FormLayout } from "../../../components/FormLayout/FormLayout";
import st from "./NewTeamPage.module.css";

export function NewTeamPage() {
  const creation = useCreateTeam();
  const router = useRouter();
  const t = useTranslations("teams");
  const [fields, setFields] = useState<TeamFieldValues>(() => {
    const year = new Date().getFullYear();
    return {
      name: "",
      category: "",
      season: `${year}/${String(year + 1)
        .slice(-2)
        .padStart(2, "0")}`,
    };
  });
  const [invalid, setInvalid] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);

  function submit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitted.current || creation.isPending) return;
    const input = createTeamInputSchema.safeParse(fields);
    if (!input.success) {
      setInvalid(true);
      nameInput.current?.focus();
      return;
    }
    submitted.current = true;
    void save(input.data);
  }

  async function save(input: CreateTeamInput): Promise<void> {
    try {
      const team = await creation.mutateAsync(input);
      router.replace(`/app/teams/view?id=${team.id}`);
    } catch {
      submitted.current = false;
    }
  }

  return (
    <section className={st.page}>
      <PageHeader
        back={{ href: "/app/teams", label: t("back") }}
        title={t("newTitle")}
        description={t("newDescription")}
      />
      <FormLayout
        label={t("newTitle")}
        pending={creation.isPending}
        error={creation.isError ? t("saveFailed") : null}
        submitLabel={t(creation.isPending ? "saving" : "create")}
        cancelLabel={t("cancel")}
        cancelHref="/app/teams"
        actionsLayout="creation"
        onSubmit={submit}
      >
        <TeamFields
          values={fields}
          disabled={creation.isPending}
          invalidName={invalid}
          nameInputRef={nameInput}
          onChange={(values) => {
            setFields(values);
            if (creation.isError) creation.reset();
            if (invalid && values.name.trim()) setInvalid(false);
          }}
        />
      </FormLayout>
    </section>
  );
}
