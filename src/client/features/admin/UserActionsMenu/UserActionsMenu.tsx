"use client";

import { ActionIcon, Menu } from "@mantine/core";
import {
  Ellipsis,
  KeyRound,
  LockKeyhole,
  Pencil,
  Trash2,
  UnlockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserActionsMenuProps } from "./UserActionsMenu.interfaces";
import { HelpPopover } from "../../../components/HelpPopover/HelpPopover";

export function UserActionsMenu({ user, onSelect }: UserActionsMenuProps) {
  const t = useTranslations("adminUsers");
  if (user.role !== "user")
    return (
      <HelpPopover
        label={t("protected")}
        icon={<ShieldCheck size={18} aria-hidden="true" />}
      >
        {t("protectedHint")}
      </HelpPopover>
    );
  return (
    <Menu position="bottom-end" withinPortal width={240}>
      <Menu.Target>
        <ActionIcon aria-label={t("actionsFor", { name: user.name })}>
          <Ellipsis size={20} aria-hidden="true" />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<Pencil size={16} aria-hidden="true" />}
          onClick={() => onSelect({ action: "edit", user })}
        >
          {t("actions.edit")}
        </Menu.Item>
        <Menu.Item
          leftSection={<KeyRound size={16} aria-hidden="true" />}
          onClick={() => onSelect({ action: "password", user })}
        >
          {t("actions.password")}
        </Menu.Item>
        <Menu.Item
          leftSection={
            user.disabled ? (
              <UnlockKeyhole size={16} aria-hidden="true" />
            ) : (
              <LockKeyhole size={16} aria-hidden="true" />
            )
          }
          onClick={() =>
            onSelect({ action: user.disabled ? "enable" : "disable", user })
          }
        >
          {t(user.disabled ? "actions.enable" : "actions.disable")}
        </Menu.Item>
        {user.disabled && (
          <>
            <Menu.Divider />
            <Menu.Item
              color="red"
              disabled={!user.username}
              leftSection={<Trash2 size={16} aria-hidden="true" />}
              onClick={() => onSelect({ action: "delete", user })}
            >
              {t("actions.delete")}
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
