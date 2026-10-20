"use client";
import { useEffect, useId, useRef } from "react";
import type { ModalProps } from "./Modal.interfaces";
import st from "./Modal.module.css";
export function Modal({
  title,
  locked,
  onDismiss,
  returnFocusTo,
  children,
}: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const backdrop = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    heading.current?.focus();
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocusTo?.isConnected) returnFocusTo.focus();
    };
  }, [returnFocusTo]);
  return (
    <dialog
      ref={dialog}
      className={st.dialog}
      aria-labelledby={titleId}
      aria-busy={locked}
      onCancel={(event) => {
        event.preventDefault();
        if (!locked) onDismiss();
      }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        backdrop.current =
          event.target === event.currentTarget &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom);
      }}
      onPointerUp={(event) => {
        if (backdrop.current && event.target === event.currentTarget && !locked)
          onDismiss();
        backdrop.current = false;
      }}
    >
      <h2 ref={heading} tabIndex={-1} id={titleId}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}
