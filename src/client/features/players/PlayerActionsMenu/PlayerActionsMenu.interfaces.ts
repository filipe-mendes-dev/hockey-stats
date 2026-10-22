import type { Player } from "../../../../domain/players/player.schema";

export interface PlayerActionsMenuProps {
  player: Player;
  onDeleted?(): void;
}
