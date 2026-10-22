import { Avatar } from "@mantine/core";
import type { PlayerAvatarProps } from "./PlayerAvatar.interfaces";
import st from "./PlayerAvatar.module.css";

export function PlayerAvatar({ name, size = 40 }: PlayerAvatarProps) {
  return (
    <Avatar
      name={name}
      size={size}
      radius="50%"
      className={st.avatar}
      classNames={{ placeholder: st.placeholder }}
      aria-hidden="true"
    />
  );
}
