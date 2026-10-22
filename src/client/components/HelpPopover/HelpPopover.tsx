"use client";

import { ActionIcon, Popover, Text } from "@mantine/core";
import { Info } from "lucide-react";
import type { HelpPopoverProps } from "./HelpPopover.interfaces";
import st from "./HelpPopover.module.css";

export function HelpPopover({ label, children, icon }: HelpPopoverProps) {
  return (
    <Popover
      width={280}
      position="bottom-end"
      withinPortal
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <ActionIcon type="button" variant="subtle" aria-label={label}>
          {icon ?? <Info size={17} strokeWidth={1.7} aria-hidden="true" />}
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown className={st.help}>
        <Text size="sm">{children}</Text>
      </Popover.Dropdown>
    </Popover>
  );
}
