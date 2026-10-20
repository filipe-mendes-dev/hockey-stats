import Link from "next/link";
import type { EntityRowProps } from "./EntityRow.interfaces";
import st from "./EntityRow.module.css";

export function EntityRow({
  title,
  href,
  avatar,
  description,
  meta,
  actions,
}: EntityRowProps) {
  return (
    <li className={st.row}>
      <Link href={href} prefetch={false} className={st.main} title={title}>
        <span className={st.avatar} aria-hidden="true">
          {avatar}
        </span>
        {description ? (
          <span className={st.copy}>
            <span className={st.title}>{title}</span>
            <span className={st.description} title={description}>
              {description}
            </span>
          </span>
        ) : (
          <span className={st.title}>{title}</span>
        )}
      </Link>
      {meta && <div className={st.meta}>{meta}</div>}
      {actions && <div className={st.actions}>{actions}</div>}
    </li>
  );
}
