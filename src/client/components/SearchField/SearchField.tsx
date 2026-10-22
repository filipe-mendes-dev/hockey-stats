"use client";

import { useRef } from "react";
import { ActionIcon, TextInput } from "@mantine/core";
import { Search, X } from "lucide-react";
import type { SearchFieldProps } from "./SearchField.interfaces";
import st from "./SearchField.module.css";

export function SearchField({
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
  children,
}: SearchFieldProps) {
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
      {children}
    </div>
  );
}
