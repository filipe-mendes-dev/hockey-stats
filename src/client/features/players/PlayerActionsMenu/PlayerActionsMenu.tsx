"use client";

import { useRef, useState } from "react";
import type { Player } from "../../../../domain/players/player.schema";
import { EditPlayerDialog } from "../EditPlayerDialog/EditPlayerDialog";
import { DeleteEntityDialog } from "../../removal/DeleteEntityDialog/DeleteEntityDialog";
import type { DeletionTarget } from "../../removal/DeleteEntityDialog/DeleteEntityDialog.interfaces";
import { ActionIcon, Menu } from "@mantine/core";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PlayerActionsMenuProps } from "./PlayerActionsMenu.interfaces";

export function PlayerActionsMenu({
  player,
  onDeleted,
}: PlayerActionsMenuProps) {
  const { name } = player;
  const [editing, setEditing] = useState<Player | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);

  function closeEditor(): void {
    setEditing(null);
    requestAnimationFrame(() =>
      (trigger.current ?? searchInput.current)?.focus({ preventScroll: true }),
    );
  }
  const [target, setTarget] = useState<DeletionTarget | null>(null);
  const t = useTranslations("players");
  return (
    <>
      <Menu position="bottom-end" withinPortal width={220}>
        <Menu.Target>
          <ActionIcon ref={trigger} aria-label={t("actionsFor", { name })}>
            <Ellipsis size={20} strokeWidth={1.7} aria-hidden="true" />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            onClick={() => {
              searchInput.current =
                trigger.current
                  ?.closest("section")
                  ?.querySelector<HTMLInputElement>('input[type="search"]') ??
                null;
              setEditing(player);
            }}
            leftSection={<Pencil size={16} aria-hidden="true" />}
          >
            {t("edit")}
          </Menu.Item>
          <Menu.Item
            onClick={() =>
              setTarget({
                feature: "players",
                id: player.id,
                expectedRevision: player.revision,
                name,
              })
            }
            color="red"
            leftSection={<Trash2 size={16} aria-hidden="true" />}
          >
            {t("delete")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {editing && <EditPlayerDialog player={editing} onClose={closeEditor} />}
      {target && (
        <DeleteEntityDialog
          target={target}
          onClose={() => setTarget(null)}
          {...(onDeleted ? { onDeleted } : {})}
        />
      )}
    </>
  );
}
