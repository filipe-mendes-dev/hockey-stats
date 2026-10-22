"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "../../../i18n/LanguageProvider";
import { MembershipFields } from "../../../components/MembershipFields/MembershipFields";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { SearchField } from "../../../components/SearchField/SearchField";
import { SelectableEntityRow } from "../../../components/SelectableEntityRow/SelectableEntityRow";
import { PlayerAvatar } from "../../players/PlayerAvatar/PlayerAvatar";
import { useAddTeamPlayers } from "../mutations/teams.mutations";
import { normalizeSearch } from "../../../utils/search";
import type {
  PlayerAssignmentDialogProps,
  PlayerAssignmentDraft,
} from "./PlayerAssignmentDialog.interfaces";
import st from "./PlayerAssignmentDialog.module.css";

export function PlayerAssignmentDialog({
  teamId,
  players,
  members,
  onClose,
  onSaved,
}: PlayerAssignmentDialogProps) {
  const t = useTranslations("teamPlayers");
  const { locale } = useLanguage();
  const addition = useAddTeamPlayers();
  const [step, setStep] = useState<"select" | "configure">("select");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, PlayerAssignmentDraft>>(
    {},
  );
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const memberIds = new Set(members.map((member) => member.playerId));
  const collator = new Intl.Collator(locale, { sensitivity: "base" });
  const available = players
    .filter((player) => !memberIds.has(player.id))
    .sort((a, b) => collator.compare(a.name, b.name));
  const filtered = available.filter((player) =>
    normalizeSearch(player.name, locale).includes(
      normalizeSearch(search, locale),
    ),
  );
  const selected = available.flatMap((player) => {
    const draft = drafts[player.id];
    return draft?.selected ? [{ player, draft }] : [];
  });
  const numbers = [
    ...members.map((member) => member.jerseyNumber),
    ...selected.map(({ draft }) => draft.jerseyNumber.trim()),
  ].filter(Boolean);
  const duplicate = new Set(numbers).size !== numbers.length;

  useEffect(() => {
    heading.current?.focus();
  }, [step]);

  function toggle(id: string, checked: boolean): void {
    setDrafts((current) => ({
      ...current,
      [id]: {
        jerseyNumber: "",
        role: "field-player",
        ...current[id],
        selected: checked,
      },
    }));
  }

  function change(id: string, fields: Partial<PlayerAssignmentDraft>): void {
    setDrafts((current) => {
      const draft = current[id];
      return draft ? { ...current, [id]: { ...draft, ...fields } } : current;
    });
  }

  function close(): void {
    if (!submitting.current && !addition.isPending) onClose();
  }

  async function add(): Promise<void> {
    if (!selected.length || submitting.current) return;
    submitting.current = true;
    try {
      await addition.mutateAsync({
        teamId,
        players: selected.map(({ player, draft }) => ({
          playerId: player.id,
          jerseyNumber: draft.jerseyNumber,
          role: draft.role,
        })),
      });
      onSaved();
    } catch {
      /* Keep the configuration and drafts available for retry. */
    } finally {
      submitting.current = false;
    }
  }

  return (
    <ResponsiveFormDialog
      opened
      layout="flow"
      title={t("add")}
      closeLabel={t("cancel")}
      cancelLabel={t("cancel")}
      submitLabel={
        step === "select"
          ? t("continue")
          : t("addCount", { count: selected.length })
      }
      submitDisabled={selected.length === 0}
      pending={addition.isPending}
      error={step === "configure" && addition.isError ? t("failed") : null}
      {...(step === "configure"
        ? {
            secondaryAction: {
              label: t("backToSelection"),
              onClick: () => setStep("select"),
            },
          }
        : {})}
      onClose={close}
      onSubmit={(event) => {
        event.preventDefault();
        if (submitting.current || !selected.length) return;
        if (step === "select") setStep("configure");
        else void add();
      }}
    >
      <div className={st.step}>
        <p className={st.progress}>
          {t("step", { step: step === "select" ? "1" : "2", total: "2" })}
        </p>
        <h3 ref={heading} tabIndex={-1} className={st.heading}>
          {t(step === "select" ? "selectPlayers" : "configureMemberships")}
        </h3>
        <p className={st.count} role="status">
          {t("selected", { count: selected.length })}
        </p>
      </div>
      {step === "select" ? (
        <>
          <SearchField
            label={t("search")}
            placeholder={t("search")}
            clearLabel={t("clear")}
            value={search}
            onChange={setSearch}
          />
          {available.length === 0 ? (
            <p className={st.notice} role="status">
              {t("noAvailable")}
            </p>
          ) : filtered.length === 0 ? (
            <p className={st.notice} role="status">
              {t("noMatches")}
            </p>
          ) : (
            <ul className={st.list} aria-label={t("selectPlayers")}>
              {filtered.map((player) => (
                <SelectableEntityRow
                  key={player.id}
                  title={player.name}
                  avatar={<PlayerAvatar name={player.name} />}
                  checked={Boolean(drafts[player.id]?.selected)}
                  onChange={(checked) => toggle(player.id, checked)}
                />
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className={st.configuration}>
            {selected.map(({ player, draft }) => (
              <section
                key={player.id}
                className={st.membership}
                aria-labelledby={`assignment-${player.id}`}
              >
                <div className={st.identity}>
                  <PlayerAvatar name={player.name} />
                  <h4 id={`assignment-${player.id}`} title={player.name}>
                    {player.name}
                  </h4>
                </div>
                <MembershipFields
                  jerseyNumber={draft.jerseyNumber}
                  role={draft.role}
                  disabled={addition.isPending}
                  onNumberChange={(jerseyNumber) =>
                    change(player.id, { jerseyNumber })
                  }
                  onRoleChange={(role) => change(player.id, { role })}
                />
              </section>
            ))}
          </div>
          {selected.length === 0 && (
            <p className={st.notice} role="status">
              {t("noAvailable")}
            </p>
          )}
          {duplicate && (
            <p className={st.notice} role="status">
              {t("duplicate")}
            </p>
          )}
        </>
      )}
    </ResponsiveFormDialog>
  );
}
