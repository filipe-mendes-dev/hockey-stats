"use client";

import { ActionIcon, Avatar, Menu } from "@mantine/core";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { EntityRow } from "../../../components/EntityRow/EntityRow";
import { DeliveryStatus } from "../../sync/DeliveryStatus/DeliveryStatus";
import type { PlayerRowProps } from "./PlayerRow.interfaces";
import st from "./PlayerRow.module.css";

export function PlayerRow({ player }: PlayerRowProps) {
  const t = useTranslations("players");
  return (
    <EntityRow
      title={player.name}
      href={`/app/players/view?id=${encodeURIComponent(player.id)}`}
      avatar={
        <Avatar
          name={player.name}
          radius="xl"
          size={40}
          className={st.avatar}
          classNames={{ placeholder: st.avatarPlaceholder }}
        />
      }
      meta={
        <DeliveryStatus compact kind="player.create" entityId={player.id} />
      }
      actions={
        <Menu position="bottom-end" withinPortal width={220}>
          <Menu.Target>
            <ActionIcon aria-label={t("actionsFor", { name: player.name })}>
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
      }
    />
  );
}
