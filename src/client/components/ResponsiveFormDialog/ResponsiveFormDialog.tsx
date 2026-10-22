"use client";

import { useEffect, useRef } from "react";
import { Alert, Button, Modal } from "@mantine/core";
import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { X } from "lucide-react";
import type { ResponsiveFormDialogProps } from "./ResponsiveFormDialog.interfaces";
import st from "./ResponsiveFormDialog.module.css";

export function ResponsiveFormDialog({
  opened,
  title,
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
  const phone = useMediaQuery("(max-width: 36rem)");
  const reducedMotion = useReducedMotion();
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!opened || !phone || !viewport) return;
    const dialogContent = content.current;
    function resize(): void {
      const height = window.visualViewport?.height;
      if (height !== undefined) {
        dialogContent?.style.setProperty("--form-dialog-height", `${height}px`);
      }
    }
    resize();
    viewport.addEventListener("resize", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      dialogContent?.style.removeProperty("--form-dialog-height");
    };
  }, [opened, phone]);

  function close(): void {
    if (!pending) onClose();
  }

  return (
    <Modal
      ref={content}
      opened={opened}
      onClose={close}
      title={title}
      size={layout === "flow" ? "lg" : "sm"}
      data-layout={layout}
      fullScreen={phone}
      centered={!phone}
      closeOnClickOutside={false}
      closeOnEscape={!pending}
      closeButtonProps={{
        "aria-label": closeLabel,
        disabled: pending,
        icon: <X size={16} strokeWidth={1.6} />,
      }}
      transitionProps={{
        transition: "fade",
        duration: reducedMotion ? 0 : 150,
      }}
      classNames={{
        root: st.root,
        content: st.content,
        body: st.body,
        header: st.header,
        title: st.title,
        close: st.close,
        overlay: st.overlay,
      }}
    >
      <form
        className={st.form}
        aria-label={title}
        aria-busy={pending}
        noValidate
        onSubmit={onSubmit}
      >
        <div className={st.fields}>
          {children}
          {error && (
            <Alert color="red" role="alert">
              {error}
            </Alert>
          )}
        </div>
        <div className={st.actions}>
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
            className={st.cancel}
          >
            {secondaryAction?.label ?? cancelLabel}
          </Button>
          <Button
            type="submit"
            {...(destructive ? { color: "red" } : {})}
            data-destructive={destructive || undefined}
            size="sm"
            loading={pending}
            disabled={pending || submitDisabled}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
