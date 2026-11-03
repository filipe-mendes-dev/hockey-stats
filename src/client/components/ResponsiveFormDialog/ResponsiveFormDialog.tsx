"use client";

import { useId } from "react";
import { Alert, Button } from "@mantine/core";
import { DialogFrame } from "../DialogFrame/DialogFrame";
import type { ResponsiveFormDialogProps } from "./ResponsiveFormDialog.interfaces";
import st from "./ResponsiveFormDialog.module.css";

export function ResponsiveFormDialog({
  opened,
  title,
  metadata,
  closeLabel,
  submitLabel,
  cancelLabel,
  pending,
  layout = "compact",
  submitDisabled = false,
  destructive = false,
  secondaryAction,
  error,
  children,
  onSubmit,
  onClose,
}: ResponsiveFormDialogProps) {
  const formId = useId();

  function close(): void {
    if (!pending) onClose();
  }

  return (
    <DialogFrame
      opened={opened}
      title={title}
      metadata={metadata}
      closeLabel={closeLabel}
      pending={pending}
      wide={layout === "flow"}
      onClose={close}
      footer={
        <>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={pending}
            onClick={() => {
              if (!pending) {
                if (secondaryAction) secondaryAction.onClick();
                else close();
              }
            }}
          >
            {secondaryAction?.label ?? cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            {...(destructive ? { color: "red" } : {})}
            data-destructive={destructive || undefined}
            size="sm"
            loading={pending}
            disabled={pending || submitDisabled}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        className={st.form}
        aria-label={title}
        aria-busy={pending}
        noValidate
        onSubmit={onSubmit}
      >
        {children}
        {error && (
          <Alert color="red" role="alert">
            {error}
          </Alert>
        )}
      </form>
    </DialogFrame>
  );
}
