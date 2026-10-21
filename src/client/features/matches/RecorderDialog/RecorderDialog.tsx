"use client";
import { useEffect, useRef } from "react";
import { Modal } from "@mantine/core";
import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { RecorderDialogProps } from "./RecorderDialog.interfaces";
import st from "./RecorderDialog.module.css";

export function RecorderDialog({
  title,
  pending = false,
  onClose,
  children,
  footer,
}: RecorderDialogProps) {
  const t = useTranslations("recorder");
  const phone = useMediaQuery("(max-width: 36rem)");
  const reducedMotion = useReducedMotion();
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = content.current;
    if (!phone || !viewport) return;
    function resize(): void {
      element?.style.setProperty(
        "--recorder-dialog-height",
        `${viewport?.height ?? window.innerHeight}px`,
      );
    }
    resize();
    viewport.addEventListener("resize", resize);
    return () => viewport.removeEventListener("resize", resize);
  }, [phone]);
  return (
    <Modal
      ref={content}
      opened
      title={title}
      onClose={() => {
        if (!pending) onClose();
      }}
      fullScreen={phone}
      centered={!phone}
      size="md"
      closeOnClickOutside={false}
      closeOnEscape={!pending}
      closeButtonProps={{
        "aria-label": t("cancel"),
        disabled: pending,
        icon: <X size={16} />,
      }}
      transitionProps={{
        transition: "fade",
        duration: reducedMotion ? 0 : 150,
      }}
      classNames={{
        root: st.root,
        content: st.content,
        header: st.header,
        title: st.title,
        close: st.close,
        body: st.body,
        overlay: st.overlay,
      }}
    >
      <div className={st.scroll} aria-busy={pending}>
        {children}
      </div>
      {footer && <div className={st.footer}>{footer}</div>}
    </Modal>
  );
}
