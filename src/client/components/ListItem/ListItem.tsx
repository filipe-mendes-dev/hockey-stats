import Link from "next/link";
import type { ListItemProps } from "./ListItem.interfaces";
import st from "./ListItem.module.css";

export function ListItem({ title, href, children }: ListItemProps) {
  const content = (
    <>
      <span className={st.itemTitle}>{title}</span>
      {children && <div className={st.itemDescription}>{children}</div>}
    </>
  );

  return (
    <li>
      {href ? (
        <Link className={st.listItem} href={href} prefetch={false}>
          {content}
        </Link>
      ) : (
        <div className={st.listItem}>{content}</div>
      )}
    </li>
  );
}
