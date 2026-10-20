"use client";

import { Text, Title } from "@mantine/core";
import { BackLink } from "../BackLink/BackLink";
import type { PageHeaderProps } from "./PageHeader.interfaces";
import st from "./PageHeader.module.css";

export function PageHeader({
  title,
  avatar,
  actions,
  description,
  eyebrow,
  back,
}: PageHeaderProps) {
  return (
    <header className={st.header} data-with-back={Boolean(back)}>
      {back && <BackLink {...back} />}
      <div className={st.headingRow}>
        {avatar && <div className={st.avatar}>{avatar}</div>}
        <div className={st.copy}>
          {eyebrow && <Text className={st.eyebrow}>{eyebrow}</Text>}
          <Title order={1} className={st.title}>
            {title}
          </Title>
          {description && <Text className={st.description}>{description}</Text>}
        </div>
        {actions && <div className={st.actions}>{actions}</div>}
      </div>
    </header>
  );
}
