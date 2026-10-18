import { getCommandFeature } from "../../../contracts/sync.schema";
import type { OutboxOperation } from "./outbox.schema";

export function getBlockingOperation(
  operation: OutboxOperation,
  operations: OutboxOperation[],
): OutboxOperation | undefined {
  return operations.find((entry) => {
    if (entry.operationId === operation.operationId) return false;
    if (
      entry.entityId === operation.entityId &&
      getCommandFeature(entry.command) ===
        getCommandFeature(operation.command) &&
      (entry.sequence ?? 0) < (operation.sequence ?? 0)
    )
      return true;
    if (operation.command.kind !== "teamPlayer.create") return false;
    const membership = operation.command.teamPlayer;
    return (
      (entry.command.kind === "team.create" &&
        entry.entityId === membership.teamId) ||
      (entry.command.kind === "player.create" &&
        entry.entityId === membership.playerId)
    );
  });
}
