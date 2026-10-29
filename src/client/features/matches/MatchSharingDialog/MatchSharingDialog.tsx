"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, Modal, TextInput, Tooltip } from "@mantine/core";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  MatchSharingStatus,
  MatchSharingErrorCode,
} from "../../../../contracts/match-sharing.schema";
import { useOutboxOperations } from "../../sync/queries/outbox.queries";
import {
  MatchSharingRequestError,
  requestMatchSharing,
} from "../matchSharing.api";
import type {
  MatchSharingDialogProps,
  SharingControlsProps,
} from "./MatchSharingDialog.interfaces";
import st from "./MatchSharingDialog.module.css";

export function MatchSharingDialog({ matchId }: MatchSharingDialogProps) {
  const t = useTranslations("sharing");
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Tooltip
        label={t("share")}
        events={{ hover: true, focus: true, touch: true }}
      >
        <ActionIcon
          aria-label={t("share")}
          aria-haspopup="dialog"
          onClick={() => setOpened(true)}
        >
          <Share2 size={17} strokeWidth={1.6} aria-hidden="true" />
        </ActionIcon>
      </Tooltip>
      {opened && (
        <SharingControls matchId={matchId} onClose={() => setOpened(false)} />
      )}
    </>
  );
}

function SharingControls({ matchId, onClose }: SharingControlsProps) {
  const t = useTranslations("sharing");
  const operations = useOutboxOperations();
  const [status, setStatus] = useState<MatchSharingStatus>();
  const [error, setError] = useState<MatchSharingErrorCode>();
  const [pending, setPending] = useState(true);
  const [feedback, setFeedback] = useState<
    "copied" | "copyFailed" | "stopped"
  >();
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const urlInput = useRef<HTMLInputElement>(null);
  const unsynced = operations.data?.some(
    (operation) => operation.entityId === matchId,
  );
  const syncUnavailable = operations.isPending || operations.isError;

  useEffect(() => {
    const lifetime = new AbortController();
    controller.current = lifetime;
    busy.current = true;
    void requestMatchSharing(matchId, "GET", lifetime.signal)
      .then((next) => {
        if (!lifetime.signal.aborted) setStatus(next);
      })
      .catch((failure: unknown) => {
        if (!lifetime.signal.aborted)
          setError(
            failure instanceof MatchSharingRequestError
              ? failure.code
              : "unavailable",
          );
      })
      .finally(() => {
        if (!lifetime.signal.aborted) {
          busy.current = false;
          setPending(false);
        }
      });
    return () => lifetime.abort();
  }, [matchId]);

  async function manage(method: "GET" | "POST" | "DELETE"): Promise<void> {
    const signal = controller.current?.signal;
    if (!signal || signal.aborted || busy.current) return;
    busy.current = true;
    setPending(true);
    setError(undefined);
    setFeedback(undefined);
    try {
      const next = await requestMatchSharing(matchId, method, signal);
      if (signal.aborted) return;
      setStatus(next);
      if (method === "DELETE") setFeedback("stopped");
      if (method === "POST" && next.url) {
        try {
          await navigator.clipboard.writeText(next.url);
          if (!signal.aborted) setFeedback("copied");
        } catch {
          if (!signal.aborted) {
            setFeedback("copyFailed");
            urlInput.current?.focus();
            urlInput.current?.select();
          }
        }
      }
    } catch (failure: unknown) {
      if (!signal.aborted)
        setError(
          failure instanceof MatchSharingRequestError
            ? failure.code
            : "unavailable",
        );
    } finally {
      busy.current = false;
      if (!signal.aborted) setPending(false);
    }
  }

  return (
    <Modal
      opened
      onClose={() => {
        if (!pending) onClose();
      }}
      title={t("title")}
      closeButtonProps={{ "aria-label": t("close") }}
      closeOnClickOutside={!pending}
      closeOnEscape={!pending}
    >
      <div className={st.content}>
        <p>{t("description")}</p>
        <p className={st.hint}>{t("accessNotice")}</p>
        {status?.url && (
          <TextInput
            ref={urlInput}
            label={t("link")}
            value={status.url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
        )}
        {unsynced && (
          <p className={st.hint} role="status">
            {t("errors.sync_required")}
          </p>
        )}
        {error && (
          <p className={st.error} role="alert">
            {t(`errors.${error}`)}
          </p>
        )}
        {feedback && (
          <p className={st.hint} role="status">
            {t(feedback)}
          </p>
        )}
        <div className={st.actions}>
          {status?.url && (
            <Button
              variant="subtle"
              color="red"
              disabled={pending}
              onClick={() => {
                void manage("DELETE");
              }}
            >
              {t("stop")}
            </Button>
          )}
          {!status ? (
            <Button
              loading={pending}
              onClick={() => {
                void manage("GET");
              }}
            >
              {t("retry")}
            </Button>
          ) : (
            <Button
              disabled={pending || Boolean(unsynced) || syncUnavailable}
              loading={pending}
              onClick={() => {
                void manage("POST");
              }}
            >
              {t(status.url ? "copy" : "create")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
