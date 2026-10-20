"use client";

import { useEffect, useState } from "react";
import { Loader } from "@mantine/core";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "../../../components/Button/Button";
import { subscribeLocalDataChanges } from "../../../storage/localDataEvents";
import { getLocalIdentity } from "../account.repository";
import { getOnlineAccount, setUpLocalAccount } from "../account.service";
import { listStoredPlayers } from "../../players/players.repository";
import type {
  AccountSetupState,
  LocalAccountSetupProps,
} from "./LocalAccountSetup.interfaces";
import st from "./LocalAccountSetup.module.css";

export function LocalAccountSetup({ children }: LocalAccountSetupProps) {
  const t = useTranslations("localAccount");
  const [state, setState] = useState<AccountSetupState>({
    status: "loading",
    account: null,
    playerCount: 0,
  });
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [importFailed, setImportFailed] = useState(false);
  const [deferred, setDeferred] = useState(false);

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        if (await getLocalIdentity()) {
          if (active)
            setState({ status: "ready", account: null, playerCount: 0 });
          return;
        }
        const account = await getOnlineAccount();
        if (!account) {
          if (active) window.location.replace("/sign-in");
          return;
        }
        const players = await listStoredPlayers();
        if (players.length > 0) {
          if (active)
            setState({
              status: "import",
              account,
              playerCount: players.length,
            });
          return;
        }
        if (!active) return;
        await setUpLocalAccount(account, { importExistingData: false });
        if (active)
          setState({ status: "ready", account: null, playerCount: 0 });
      } catch {
        if (active)
          setState({ status: "failed", account: null, playerCount: 0 });
      }
    }
    void load();
    const unsubscribe = subscribeLocalDataChanges(() => {
      void load();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  async function importExistingData(): Promise<void> {
    if (!state.account || pending) return;
    setPending(true);
    setImportFailed(false);
    try {
      await setUpLocalAccount(state.account, { importExistingData: true });
      setState({ status: "ready", account: null, playerCount: 0 });
    } catch {
      setImportFailed(true);
    } finally {
      setPending(false);
    }
  }

  if (state.status === "ready") return children;
  if (state.status === "loading") {
    return (
      <div className={st.loading} role="status" aria-label={t("loading")}>
        <Loader size="sm" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section className={st.panel} aria-busy={pending}>
      <h1>{t("title")}</h1>
      {state.status === "import" && state.account ? (
        <>
          <p>
            {t("importDescription", {
              count: state.playerCount,
              account: state.account.username ?? state.account.name,
            })}
          </p>
          {deferred && <p role="status">{t("deferred")}</p>}
          {importFailed && (
            <p className={st.error} role="alert">
              {t("failed")}
            </p>
          )}
          <div className={st.actions}>
            <Button
              disabled={pending}
              onClick={() => {
                void importExistingData();
              }}
            >
              {t(pending ? "importing" : "import")}
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setDeferred(true)}
            >
              {t("notNow")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p role="alert">{t("failed")}</p>
          <div className={st.actions}>
            <ButtonLink href="/sign-in">{t("signIn")}</ButtonLink>
            <Button
              variant="secondary"
              onClick={() => setAttempt((value) => value + 1)}
            >
              {t("retry")}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
