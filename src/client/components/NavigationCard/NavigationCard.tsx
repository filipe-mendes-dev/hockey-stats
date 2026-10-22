import Link from "next/link";
import { Paper, Text, Title } from "@mantine/core";
import { ArrowUpRight } from "lucide-react";
import type { NavigationCardProps } from "./NavigationCard.interfaces";
import st from "./NavigationCard.module.css";

export function NavigationCard({
  title,
  description,
  href,
  icon,
  featured = false,
}: NavigationCardProps) {
  return (
    <Paper
      component={Link}
      href={href}
      prefetch={false}
      className={st.card}
      data-featured={featured || undefined}
    >
      <div className={st.top} aria-hidden="true">
        <span className={st.icon}>{icon}</span>
        <ArrowUpRight size={21} className={st.arrow} />
      </div>
      <div>
        <Title order={featured ? 2 : 3} className={st.title}>
          {title}
        </Title>
        <Text className={st.description}>{description}</Text>
      </div>
    </Paper>
  );
}
