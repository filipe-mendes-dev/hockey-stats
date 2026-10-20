"use client";

import { Text, Title } from "@mantine/core";
import { BackLink } from "../BackLink/BackLink";
import type { PageHeaderProps } from "./PageHeader.interfaces";
import st from "./PageHeader.module.css";

export function PageHeader({
  title,
  description,
  eyebrow,
  back,
}: PageHeaderProps) {
  return (
    <header className={st.header} data-with-back={Boolean(back)}>
      {back && <BackLink {...back} />}
      {eyebrow && <Text className={st.eyebrow}>{eyebrow}</Text>}
      <Title order={1} className={st.title}>
        {title}
      </Title>
      {description && <Text className={st.description}>{description}</Text>}
    </header>
  );
}
