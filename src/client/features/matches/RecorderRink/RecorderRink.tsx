"use client";

import { ActionIcon, Button, Popover } from "@mantine/core";
import { CircleHelp, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecorderRinkPicker } from "./RecorderRinkPicker";
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
        <Button
          fullWidth
          variant="default"
          leftSection={<MapPin size={18} />}
          disabled={picker.disabled ?? false}
          onClick={onOpen}
        >
          {t("recordOnRink")}
        </Button>
      ) : (
        <>
          <div className={st.headingRow}>
            <h2 className={st.heading}>{t("rinkTitle")}</h2>
            <Popover width={280} position="bottom-end" withArrow>
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
          </div>
          {picker.direction ? (
            <RecorderRinkPicker {...picker} compactHint />
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
