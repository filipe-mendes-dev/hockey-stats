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
        className={st.image}
        src="/brand/horizontal-glass.svg"
        width={322}
        height={97}
        alt=""
        priority={priority}
        unoptimized
      />
    </span>
  );
}
