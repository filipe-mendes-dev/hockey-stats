"use client";

import { Checkbox } from "@mantine/core";
import type { SelectableEntityRowProps } from "./SelectableEntityRow.interfaces";
import st from "./SelectableEntityRow.module.css";

export function SelectableEntityRow({
  title,
  avatar,
  checked,
  description,
  disabled = false,
  onChange,
}: SelectableEntityRowProps) {
  return (
    <li className={st.item}>
      <Checkbox.Card
        className={st.row}
        withBorder={false}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={title}
      >
        <span className={st.avatar}>{avatar}</span>
        <span className={st.copy}>
          <span className={st.title} title={title}>
            {title}
          </span>
          {description && (
            <span className={st.description} title={description}>
              {description}
            </span>
          )}
        </span>
        <Checkbox.Indicator className={st.indicator} aria-hidden="true" />
      </Checkbox.Card>
    </li>
  );
}
