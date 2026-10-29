import Image from "next/image";
import { useTranslations } from "next-intl";
import type { BrandLogoProps } from "./BrandLogo.interfaces";
import st from "./BrandLogo.module.css";

export function BrandLogo({
  prominent = false,
  priority = false,
}: BrandLogoProps) {
  const t = useTranslations("shell");

  return (
    <span
      className={st.logo}
      data-prominent={prominent || undefined}
      role="img"
      aria-label={t("title")}
    >
      <Image
        className={st.symbol}
        src="/brand/symbol-glass.svg"
        width={208}
        height={168}
        alt=""
        priority={priority}
        unoptimized
      />
      <span className={st.wordmark} aria-hidden="true">
        <span className={st.name}>BENCHLINE</span>
        <span className={st.descriptor}>STATS</span>
      </span>
    </span>
  );
}
