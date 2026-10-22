"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { Plus } from "lucide-react";
import { SearchField } from "../SearchField/SearchField";
import type { SearchToolbarProps } from "./SearchToolbar.interfaces";
import st from "./SearchToolbar.module.css";

export function SearchToolbar({
  actionHref,
  actionLabel,
  compactActionLabel,
  ...search
}: SearchToolbarProps) {
  return (
    <SearchField {...search}>
      <Button
        component={Link}
        href={actionHref}
        prefetch={false}
        size="sm"
        className={st.action}
        aria-label={actionLabel}
        leftSection={<Plus size={17} aria-hidden="true" />}
      >
        <span className={st.fullLabel}>{actionLabel}</span>
        <span className={st.compactLabel}>{compactActionLabel}</span>
      </Button>
    </SearchField>
  );
}
