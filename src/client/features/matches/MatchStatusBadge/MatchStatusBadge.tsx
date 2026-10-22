"use client";

import { Badge } from "@mantine/core";
import { useTranslations } from "next-intl";
import type { MatchStatusBadgeProps } from "./MatchStatusBadge.interfaces";
import st from "./MatchStatusBadge.module.css";

export function MatchStatusBadge({ status }: MatchStatusBadgeProps) {
  const t = useTranslations("matches");
  return (
    <Badge className={st.badge} data-status={status} variant="outline">
      {t(status)}
    </Badge>
  );
}
