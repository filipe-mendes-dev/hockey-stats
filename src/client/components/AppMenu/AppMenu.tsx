import { ListItem } from "../ListItem/ListItem";
import type { AppMenuProps } from "./AppMenu.interfaces";
import st from "./AppMenu.module.css";

export function AppMenu({ label, comingSoonLabel, items }: AppMenuProps) {
  return (
    <nav aria-label={label}>
      <ul className={st.list}>
        {items.map((item) => (
          <ListItem
            key={item.id}
            title={item.title}
            {...(item.href ? { href: item.href } : {})}
          >
            <p className={st.description}>{item.description}</p>
            {!item.href && <p className={st.comingSoon}>{comingSoonLabel}</p>}
          </ListItem>
        ))}
      </ul>
    </nav>
  );
}
