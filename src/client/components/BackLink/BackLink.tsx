"use client";

import Link from "next/link";
import { Button } from "@mantine/core";
import { ArrowLeft } from "lucide-react";
import type { BackLinkProps } from "./BackLink.interfaces";
import st from "./BackLink.module.css";

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Button
      component={Link}
      href={href}
      prefetch={false}
      variant="subtle"
      size="sm"
      className={st.link}
      leftSection={<ArrowLeft size={16} aria-hidden="true" />}
    >
      {label}
    </Button>
  );
}
