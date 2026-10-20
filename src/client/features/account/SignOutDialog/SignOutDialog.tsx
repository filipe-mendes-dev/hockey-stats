"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Group, Modal, Text } from "@mantine/core";
import { useTranslations } from "next-intl";
import { listOutboxOperations } from "../../sync/outbox.repository";
import { subscribeLocalDataChanges } from "../../../storage/localDataEvents";
import type { SignOutDialogProps } from "./SignOutDialog.interfaces";
import st from "./SignOutDialog.module.css";

function SignOutContent({
  pending,
  cleanupOnly,
  error,
  onClose,
  onConfirm,
}: SignOutDialogProps) {
  const t = useTranslations("auth");
  const [count, setCount] = useState<number | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cleanupOnly || pending) return;
    let active = true;
    let revision = 0;
    async function readCount(): Promise<void> {
      const current = ++revision;
      try {
        const operations = await listOutboxOperations();
        if (active && current === revision) {
          setCount(operations.length);
          setCheckFailed(false);
        }
      } catch {
        if (active && current === revision) {
          setCount(null);
          setCheckFailed(true);
        }
      }
    }
    void readCount();
    const unsubscribe = subscribeLocalDataChanges(() => void readCount());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [cleanupOnly, pending, attempt]);

  return (
    <>
      <Text className={st.description}>{t("signOutDescription")}</Text>
      {!cleanupOnly && (
        <div className={st.feedback} role="status">
          {checkFailed ? (
            <>
              <Text className={st.warning}>{t("unsyncedCheckFailed")}</Text>
              <Button
                size="sm"
                variant="subtle"
                onClick={() => setAttempt((value) => value + 1)}
              >
                {t("retryCheck")}
              </Button>
            </>
          ) : count === null ? (
            t("checkingUnsynced")
          ) : count > 0 ? (
            <Text className={st.warning}>
              {t("unsyncedWarning", { count })}
            </Text>
          ) : (
            <Text>{t("allSynced")}</Text>
          )}
        </div>
      )}
      {error && (
        <Alert color="red" role="alert" className={st.feedback}>
          {t(error)}
        </Alert>
      )}
      <Group justify="flex-end" className={st.actions}>
        <Button
          variant="default"
          size="sm"
          onClick={onClose}
          disabled={pending}
          data-autofocus
        >
          {t("cancelSignOut")}
        </Button>
        <Button
          color="red"
          size="sm"
          data-destructive
          loading={pending}
          disabled={!cleanupOnly && (count === null || checkFailed)}
          onClick={() => void onConfirm()}
        >
          {t(pending ? "signingOut" : "signOut")}
        </Button>
      </Group>
    </>
  );
}

export function SignOutDialog(props: SignOutDialogProps) {
  const t = useTranslations("auth");
  return (
    <Modal
      opened={props.opened}
      onClose={props.onClose}
      title={t(props.cleanupOnly ? "signOutCleanupTitle" : "confirmSignOut")}
      closeButtonProps={{ "aria-label": t("cancelSignOut") }}
      closeOnEscape={!props.pending}
      closeOnClickOutside={!props.pending}
      withCloseButton={!props.pending}
    >
      {props.opened && <SignOutContent {...props} />}
    </Modal>
  );
}
