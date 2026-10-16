import Link from "next/link";
import type { ButtonProps, ButtonLinkProps } from "./Button.interfaces";
import st from "./Button.module.css";

function actionClassName(
  variant: "primary" | "secondary",
  className?: string,
): string {
  return [st.action, st[variant], className].filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={actionClassName(variant, className)}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  className,
  prefetch = false,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      prefetch={prefetch}
      className={actionClassName(variant, className)}
    />
  );
}
