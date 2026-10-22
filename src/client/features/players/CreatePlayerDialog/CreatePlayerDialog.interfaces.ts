import type { Player } from "../../../../domain/players/player.schema";

export interface CreatePlayerDialogProps {
  onClose(): void;
  onCreated(player: Player): void;
}
