"use client";

import Link from "next/link";
import { Alert, Button } from "@mantine/core";
import type { FormLayoutProps } from "./FormLayout.interfaces";
import st from "./FormLayout.module.css";

export function FormLayout({
  label,
  children,
  pending,
  error,
  submitLabel,
  cancelLabel,
  cancelHref,
  onSubmit,
}: FormLayoutProps) {
  return (
    <form
      className={st.form}
      noValidate
      aria-label={label}
      aria-busy={pending}
      onSubmit={onSubmit}
    >
      <div className={st.fields}>{children}</div>
      {error && (
        <Alert color="red" role="alert" className={st.error}>
          {error}
        </Alert>
      )}
      <div className={st.actions}>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          {submitLabel}
        </Button>
        {pending ? (
          <Button type="button" variant="subtle" size="sm" disabled>
            {cancelLabel}
          </Button>
        ) : (
          <Button
            component={Link}
            href={cancelHref}
            prefetch={false}
            variant="subtle"
            size="sm"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}
