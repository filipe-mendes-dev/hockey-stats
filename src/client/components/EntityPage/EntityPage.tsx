import Link from "next/link";
import type { EntityPageProps } from "./EntityPage.interfaces";
import st from "./EntityPage.module.css";

export function EntityPage({
  backHref,
  backLabel,
  title,
  description,
  storageNotice,
  children,
}: EntityPageProps) {
  return (
    <section className={st.page}>
      <Link className={st.back} href={backHref} prefetch={false}>
        {backLabel}
      </Link>
      <header className={st.header}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      {children}
      <p className={st.storageNotice}>{storageNotice}</p>
    </section>
  );
}
