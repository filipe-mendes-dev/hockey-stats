"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Burger, Button, Drawer } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Activity, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "../LanguagePicker/LanguagePicker";
import { AppNavigation } from "../AppNavigation/AppNavigation";
import type { AppHeaderProps } from "./AppHeader.interfaces";
import st from "./AppHeader.module.css";

export function AppHeader({
  accountAction,
  homeHref = "/app",
}: AppHeaderProps) {
  const t = useTranslations();
  const [opened, setOpened] = useState(false);
  const compact = useMediaQuery("(max-width: 68em)");
  const signOutAfterClose = useRef(false);
  const showNavigation = homeHref !== "/sign-in";

  function closeNavigation(): void {
    signOutAfterClose.current = false;
    setOpened(false);
  }

  function finishClosing(): void {
    setOpened(false);
    if (signOutAfterClose.current) {
      signOutAfterClose.current = false;
      accountAction?.onClick();
    }
  }

  return (
    <header className={st.header}>
      <div className={st.content}>
        <Link className={st.brand} href={homeHref} prefetch={false}>
          <span className={st.mark} aria-hidden="true">
            <Activity size={21} strokeWidth={2} />
          </span>
          <span className={st.brandText}>
            <span className={st.name}>{t("shell.title")}</span>
            <span className={st.description}>{t("shell.description")}</span>
          </span>
        </Link>
        {showNavigation && (
          <div className={st.desktopNavigation}>
            <AppNavigation />
          </div>
        )}
        <div className={st.actions}>
          <div className={st.language}>
            <LanguagePicker />
          </div>
          {accountAction && (
            <Button
              className={st.desktopAccountAction}
              variant="subtle"
              size="sm"
              leftSection={<LogOut size={16} aria-hidden="true" />}
              onClick={accountAction.onClick}
              disabled={accountAction.pending}
            >
              {accountAction.label}
            </Button>
          )}
          {showNavigation && (
            <Burger
              className={st.burger}
              opened={opened}
              onClick={() => setOpened(!opened)}
              size="sm"
              aria-label={t(opened ? "navigation.close" : "navigation.open")}
              aria-expanded={opened}
              aria-controls="app-navigation-drawer"
            />
          )}
        </div>
      </div>
      {showNavigation && (
        <Drawer
          opened={opened && compact}
          onClose={closeNavigation}
          onExitTransitionEnd={finishClosing}
          title={t("navigation.label")}
          position="right"
          size="100%"
          id="app-navigation-drawer"
          closeButtonProps={{ "aria-label": t("navigation.close") }}
          classNames={{
            content: st.drawer,
            header: st.drawerHeader,
            body: st.drawerBody,
            close: st.drawerClose,
          }}
        >
          <div className={st.drawerLinks}>
            <AppNavigation vertical onNavigate={closeNavigation} />
          </div>
          {accountAction && (
            <div className={st.drawerAccount}>
              <Button
                variant="subtle"
                fullWidth
                leftSection={<LogOut size={18} aria-hidden="true" />}
                disabled={accountAction.pending}
                onClick={() => {
                  signOutAfterClose.current = true;
                  setOpened(false);
                }}
              >
                {accountAction.label}
              </Button>
            </div>
          )}
        </Drawer>
      )}
    </header>
  );
}
