"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navigationDestinations } from "./navigation";
import type { AppNavigationProps } from "./AppNavigation.interfaces";
import st from "./AppNavigation.module.css";

export function AppNavigation({
  vertical = false,
  onNavigate,
}: AppNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  return (
    <nav
      aria-label={t("label")}
      className={st.navigation}
      data-vertical={vertical}
    >
      {navigationDestinations.map(({ id, href, icon: Icon }) => {
        const active =
          pathname === href ||
          (id !== "home" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={id}
            href={href}
            prefetch={false}
            className={st.link}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate?.()}
          >
            <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
            <span>{t(id)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
