"use client";

import { useEffect, useRef } from "react";
import { Modal } from "@mantine/core";
import { useMediaQuery, useReducedMotion } from "@mantine/hooks";
import { X } from "lucide-react";
import type { DialogFrameProps } from "./DialogFrame.interfaces";
import st from "./DialogFrame.module.css";

export function DialogFrame({
  opened,
  title,
  closeLabel,
  pending = false,
  wide = false,
  topAligned = false,
  metadata,
  children,
  footer,
  onClose,
}: DialogFrameProps) {
  const phone = useMediaQuery("(max-width: 36rem)");
  const reducedMotion = useReducedMotion();
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!opened || !phone || !viewport) return;
    const element = content.current;
    function resize(): void {
      element?.style.setProperty("--dialog-height", `${viewport?.height}px`);
    }
    resize();
    viewport.addEventListener("resize", resize);
    return () => {
      viewport.removeEventListener("resize", resize);
      element?.style.removeProperty("--dialog-height");
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
      title={
        <span className={st.titleContent}>
          <span className={st.titleText}>{title}</span>
          {metadata}
        </span>
      }
      size={wide ? "var(--dialog-wide-width)" : "var(--dialog-standard-width)"}
      fullScreen={phone}
      centered={!phone && !topAligned}
      yOffset={topAligned ? "2rem" : undefined}
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
