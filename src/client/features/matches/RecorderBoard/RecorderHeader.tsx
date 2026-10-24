"use client";
import { useState } from "react";
import Link from "next/link";
import { ActionIcon, Menu } from "@mantine/core";
import { ArrowLeft, Ellipsis, Globe, Info, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import { SyncStatusPanel } from "../../sync/SyncStatusPanel/SyncStatusPanel";
import { LanguagePicker } from "../../../components/LanguagePicker/LanguagePicker";
import { RecorderDialog } from "../RecorderDialog/RecorderDialog";
import type { RecorderHeaderProps } from "./RecorderHeader.interfaces";
import st from "./RecorderHeader.module.css";
export function RecorderHeader({
  match,
  disabled,
  scoreDisabled,
  onScoreAdjust,
}: RecorderHeaderProps) {
  const t = useTranslations("recorder");
  const matches = useTranslations("matches");
  const [panel, setPanel] = useState<"sync" | "language" | null>(null);
  const matchId = match.id;
  return (
    <nav className={st.nav} aria-label={t("matchOptions")}>
      <ActionIcon
        component={Link}
        href={`/app/matches/view?id=${matchId}`}
        prefetch={false}
        variant="subtle"
        aria-label={matches("backToDetails")}
      >
        <ArrowLeft size={18} />
      </ActionIcon>
      <h1>{t("liveBoard")}</h1>
      <DeliveryStatus compact kind="match.control" entityId={matchId} />
      <Menu position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            disabled={disabled}
            aria-label={t("matchOptions")}
          >
            <Ellipsis size={20} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            disabled={scoreDisabled}
            leftSection={<Trophy size={16} />}
            onClick={onScoreAdjust}
          >
            {t("score-adjustment")}
          </Menu.Item>
          <Menu.Item
            leftSection={<Info size={16} />}
            onClick={() => setPanel("sync")}
          >
            {t("syncDetails")}
          </Menu.Item>
          <Menu.Item
            leftSection={<Globe size={16} />}
            onClick={() => setPanel("language")}
          >
            {t("language")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {panel && (
        <RecorderDialog
          title={t(panel === "sync" ? "syncDetails" : "language")}
          onClose={() => setPanel(null)}
        >
          {panel === "sync" ? <SyncStatusPanel details /> : <LanguagePicker />}
        </RecorderDialog>
      )}
    </nav>
  );
}
