"use client";

import { ActionIcon, Button, Popover } from "@mantine/core";
import { CircleHelp } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecorderRinkPicker } from "./RecorderRinkPicker";
import { HockeyRink } from "../../../components/HockeyRink/HockeyRink";
import type { RecorderRinkProps } from "./RecorderRink.interfaces";
import st from "./RecorderRink.module.css";

export function RecorderRink({
  onOpen,
  presentation,
  ...picker
}: RecorderRinkProps) {
  const t = useTranslations("recorder");
  const compact = presentation === "compact";
  return (
    <section
      className={compact ? st.compact : st.desktop}
      aria-label={t("rinkTitle")}
    >
      {compact ? (
        <button
          type="button"
          className={st.entry}
          disabled={picker.disabled ?? false}
          onClick={onOpen}
        >
          <span className={st.entryRink} aria-hidden="true">
            <HockeyRink label={t("rinkTitle")} />
          </span>
          <span className={st.entryLabel}>{t("recordOnRink")}</span>
        </button>
      ) : (
        <>
          {picker.direction ? (
            <RecorderRinkPicker
              {...picker}
              compactHint
              hintAccessory={
                <Popover
                  width={280}
                  position="bottom-end"
                  withArrow
                  trapFocus
                  returnFocus
                >
                  <Popover.Target>
                    <ActionIcon
                      variant="subtle"
                      size="md"
                      aria-label={t("rinkHelp")}
                    >
                      <CircleHelp size={17} aria-hidden="true" />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown className={st.help}>
                    {t("rinkHint")}
                  </Popover.Dropdown>
                </Popover>
              }
            />
          ) : (
            <Button
              variant="default"
              onClick={onOpen}
              disabled={picker.disabled ?? false}
            >
              {t("rinkSetDirection")}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
