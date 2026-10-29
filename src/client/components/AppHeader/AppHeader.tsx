"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Burger, Button, Drawer } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "../LanguagePicker/LanguagePicker";
import { AppNavigation } from "../AppNavigation/AppNavigation";
import { BrandLogo } from "../BrandLogo/BrandLogo";
import type { AppHeaderProps } from "./AppHeader.interfaces";
import st from "./AppHeader.module.css";

export function AppHeader({
  accountAction,
  homeHref = "/app",
}: AppHeaderProps) {
  const t = useTranslations();
  const [opened, setOpened] = useState(false);
  const compact = useMediaQuery("(max-width: 73.75em)");
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
    <header className={st.header} data-auth-page={homeHref === "/sign-in"}>
      <div className={st.content}>
        <Link className={st.brand} href={homeHref} prefetch={false}>
          <BrandLogo priority />
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
              classNames={{ label: st.accountLabel }}
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
              color="var(--color-action)"
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
          <div className={st.drawerBottom}>
            <div className={st.drawerLanguage}>
              <LanguagePicker />
            </div>
            {accountAction && (
              <Button
                className={st.drawerAccountAction}
                classNames={{ label: st.accountLabel }}
                variant="subtle"
                size="sm"
                leftSection={<LogOut size={18} aria-hidden="true" />}
                disabled={accountAction.pending}
                onClick={() => {
                  signOutAfterClose.current = true;
                  setOpened(false);
                }}
              >
                {accountAction.label}
              </Button>
            )}
          </div>
        </Drawer>
      )}
    </header>
  );
}
