import type { SelectableListItemProps } from "./SelectableListItem.interfaces";
import st from "./SelectableListItem.module.css";
export function SelectableListItem({
  title,
  checked,
  disabled,
  description,
  onChange,
  children,
}: SelectableListItemProps) {
  return (
    <li className={st.item}>
      <label className={st.label}>
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          {title}
          {description && <small>{description}</small>}
        </span>
      </label>
      {children && <div className={st.fields}>{children}</div>}
    </li>
  );
}
