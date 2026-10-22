import { NavigationCard } from "../NavigationCard/NavigationCard";
import type { AppMenuProps } from "./AppMenu.interfaces";
import st from "./AppMenu.module.css";

export function AppMenu({ label, items }: AppMenuProps) {
  return (
    <nav aria-label={label}>
      <ul className={st.list}>
        {items.map(({ id, ...item }) => (
          <li key={id}>
            <NavigationCard {...item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}
