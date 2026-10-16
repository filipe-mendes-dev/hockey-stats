import type { ButtonHTMLAttributes, ComponentProps } from "react";
import type Link from "next/link";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: "primary" | "secondary";
}
