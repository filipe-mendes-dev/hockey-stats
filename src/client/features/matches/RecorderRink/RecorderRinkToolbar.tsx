"use client";

import { ActionIcon, Tooltip, UnstyledButton } from "@mantine/core";
import { ArrowLeftRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RecorderRinkToolbarProps } from "./RecorderRinkToolbar.interfaces";
import st from "./RecorderRinkToolbar.module.css";

export function RecorderRinkToolbar({
  hint,
  disabled,
  onChangeDirection,
  onClear,
}: RecorderRinkToolbarProps) {
  const t = useTranslations("recorder");
  return (
    <div className={st.footer}>
      <div className={st.toolbar}>
        <span className={st.hint}>{hint}</span>
        <div className={st.actions}>
          <Tooltip
            label={t("changeDirection")}
            events={{ hover: true, focus: true, touch: false }}
          >
            <UnstyledButton
              className={st.direction}
              disabled={disabled}
              onClick={onChangeDirection}
              aria-label={t("changeDirection")}
            >
              <ArrowLeftRight size={18} aria-hidden="true" />
              <span className={st.directionLabel}>{t("changeDirection")}</span>
            </UnstyledButton>
          </Tooltip>
          {onClear && (
            <Tooltip
              label={t("rinkClearPosition")}
              events={{ hover: true, focus: true, touch: false }}
            >
              <ActionIcon
                variant="subtle"
                disabled={disabled}
                aria-label={t("rinkClearPosition")}
                onClick={onClear}
              >
                <X size={18} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
