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
  submitDisabled = false,
  secondaryAction,
  actionsLayout = "default",
}: FormLayoutProps) {
  return (
    <form
      className={st.form}
      data-actions-layout={actionsLayout}
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
        <Button
          className={st.submit}
          type="submit"
          size="sm"
          loading={pending}
          disabled={pending || submitDisabled}
        >
          {submitLabel}
        </Button>
        {secondaryAction && (
          <Button
            type="button"
            variant="subtle"
            size="sm"
            disabled={pending}
            className={st.secondary}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
        {pending ? (
          <Button
            className={st.cancel}
            type="button"
            variant="subtle"
            size="sm"
            disabled
          >
            {cancelLabel}
          </Button>
        ) : (
          <Button
            className={st.cancel}
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
