"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../../components/Button/Button";
import type { PlayersDataStatusProps } from "./PlayersDataStatus.interfaces";
import st from "./PlayersDataStatus.module.css";

export function PlayersDataStatus({
  failed = false,
  onRetry,
}: PlayersDataStatusProps) {
  const t = useTranslations("players");

  return (
    <div className={st.feedback}>
      <p role={failed ? "alert" : "status"}>
        {t(failed ? "loadFailed" : "loading")}
      </p>
      {failed && (
        <Button variant="secondary" onClick={onRetry}>
          {t("retry")}
        </Button>
      )}
    </div>
  );
}
