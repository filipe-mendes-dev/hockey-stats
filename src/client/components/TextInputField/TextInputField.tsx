"use client";

import { useId } from "react";
import type { TextInputFieldProps } from "./TextInputField.interfaces";
import st from "./TextInputField.module.css";

export function TextInputField({
  label,
  requiredLabel,
  error,
  inputRef,
  id,
  required,
  "aria-describedby": describedBy,
  ...props
}: TextInputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const errorId = `${fieldId}-error`;
  const description =
    [describedBy, error ? errorId : undefined].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className={st.field}>
      <label htmlFor={fieldId}>
        {label}
        {required && <span className={st.required}>{requiredLabel}</span>}
      </label>
      <input
        {...props}
        ref={inputRef}
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={description}
      />
      {error && (
        <p className={st.error} id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
