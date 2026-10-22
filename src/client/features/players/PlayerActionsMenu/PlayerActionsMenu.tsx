"use client";

import { ActionIcon, Menu } from "@mantine/core";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlayerActionsMenuProps } from "./PlayerActionsMenu.interfaces";

export function PlayerActionsMenu({ name }: PlayerActionsMenuProps) {
  const t = useTranslations("players");
  return (
    <Menu position="bottom-end" withinPortal width={220}>
      <Menu.Target>
        <ActionIcon aria-label={t("actionsFor", { name })}>
          <Ellipsis size={20} strokeWidth={1.7} aria-hidden="true" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t("actionsUnavailable")}</Menu.Label>
        <Menu.Item
          disabled
          leftSection={<Pencil size={16} aria-hidden="true" />}
        >
          {t("edit")}
        </Menu.Item>
        <Menu.Item
          disabled
          color="red"
          leftSection={<Trash2 size={16} aria-hidden="true" />}
        >
          {t("delete")}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
