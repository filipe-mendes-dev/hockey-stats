import type { Player } from "../../../../domain/players/player.schema";

export interface EditPlayerDialogProps {
  player: Player;
  onClose(): void;
}
