"use client";

import { useId } from "react";
import type { SearchInputFieldProps } from "./SearchInputField.interfaces";
import st from "./SearchInputField.module.css";

export function SearchInputField({
  label,
  placeholder,
  clearLabel,
  value,
  onChange,
}: SearchInputFieldProps) {
  const id = useId();

  return (
    <div className={st.search}>
      <label className={st.visuallyHidden} htmlFor={id}>
        {label}
      </label>
      <svg
        className={st.searchIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="m16 16 5 5" />
      </svg>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {value && (
        <button
          className={st.clearSearch}
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            onChange("");
            document.getElementById(id)?.focus();
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
