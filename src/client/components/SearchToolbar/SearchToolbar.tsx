"use client";

import { useRef } from "react";
import Link from "next/link";
import { ActionIcon, Button, TextInput } from "@mantine/core";
import { Plus, Search, X } from "lucide-react";
import type { SearchToolbarProps } from "./SearchToolbar.interfaces";
import st from "./SearchToolbar.module.css";

export function SearchToolbar({
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
  actionHref,
  actionLabel,
  compactActionLabel,
}: SearchToolbarProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={st.toolbar}>
      <TextInput
        ref={input}
        className={st.search}
        classNames={{ input: st.input }}
        type="search"
        variant="unstyled"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        leftSection={<Search size={19} aria-hidden="true" />}
        leftSectionPointerEvents="none"
        rightSectionWidth={value ? 44 : 0}
        onChange={(event) => onChange(event.currentTarget.value)}
        rightSection={
          value ? (
            <ActionIcon
              aria-label={clearLabel}
              onClick={() => {
                onChange("");
                input.current?.focus();
              }}
            >
              <X size={17} aria-hidden="true" />
            </ActionIcon>
          ) : null
        }
      />
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
    </div>
  );
}
