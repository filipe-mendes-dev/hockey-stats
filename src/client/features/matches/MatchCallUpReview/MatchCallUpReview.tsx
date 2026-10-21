"use client";

import { useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { MembershipFields } from "../../../components/MembershipFields/MembershipFields";
import { ResponsiveFormDialog } from "../../../components/ResponsiveFormDialog/ResponsiveFormDialog";
import { PlayerAvatar } from "../../players/PlayerAvatar/PlayerAvatar";
import type { MatchCallUpPlayer } from "../MatchCallUpSelection/MatchCallUpSelection.interfaces";
import type { MatchCallUpReviewProps } from "./MatchCallUpReview.interfaces";
import st from "./MatchCallUpReview.module.css";

export function MatchCallUpReview({
  players,
  disabled,
  onChange,
}: MatchCallUpReviewProps) {
  const t = useTranslations("matches");
  const assignment = useTranslations("teamPlayers");
  const [draft, setDraft] = useState<MatchCallUpPlayer | null>(null);
  return (
    <>
      {players.length === 0 ? (
        <p className={st.notice}>{t("emptyCallUp")}</p>
      ) : (
        <ul className={st.list} aria-label={t("callUp")}>
          {players.map((player) => (
            <li key={player.playerId} className={st.row}>
              <PlayerAvatar name={player.name} />
              <div className={st.copy}>
                <span className={st.name} title={player.name}>
                  {player.name}
                </span>
                <span className={st.description}>
                  {[
                    assignment(player.role),
                    player.jerseyNumber.trim()
                      ? `#${player.jerseyNumber.trim()}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <Tooltip label={t("editCallUpPlayer")}>
                <ActionIcon
                  type="button"
                  disabled={disabled}
                  aria-label={t("editCallUpName", { name: player.name })}
                  aria-haspopup="dialog"
                  onClick={() => setDraft(player)}
                >
                  <Pencil size={17} strokeWidth={1.6} aria-hidden="true" />
                </ActionIcon>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
      <ResponsiveFormDialog
        opened={Boolean(draft)}
        title={t("editCallUpPlayer")}
        closeLabel={t("cancel")}
        cancelLabel={t("cancel")}
        submitLabel={t("applyChanges")}
        pending={disabled}
        error={null}
        onClose={() => setDraft(null)}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (!draft || disabled) return;
          onChange({ ...draft, jerseyNumber: draft.jerseyNumber.trim() });
          setDraft(null);
        }}
      >
        {draft && (
          <>
            <div className={st.playerContext}>
              <div className={st.identity}>
                <PlayerAvatar name={draft.name} />
                <span>{draft.name}</span>
              </div>
              <p className={st.notice}>{t("matchOnlyChanges")}</p>
            </div>
            <MembershipFields
              jerseyNumber={draft.jerseyNumber}
              role={draft.role}
              disabled={disabled}
              onNumberChange={(jerseyNumber) =>
                setDraft({ ...draft, jerseyNumber })
              }
              onRoleChange={(role) => setDraft({ ...draft, role })}
            />
          </>
        )}
      </ResponsiveFormDialog>
    </>
  );
}
