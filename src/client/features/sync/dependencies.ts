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
    if (
      "deletedAt" in operation.command &&
      (entry.sequence ?? 0) < (operation.sequence ?? 0)
    ) {
      const deletion = operation.command;
      const candidate = entry.command;
      if (
        deletion.kind === "player.delete" ||
        deletion.kind === "team.delete"
      ) {
        if (
          "teamPlayer" in candidate &&
          (deletion.kind === "player.delete"
            ? candidate.teamPlayer.playerId === deletion.id
            : candidate.teamPlayer.teamId === deletion.id)
        )
          return true;
        if (
          (candidate.kind === "match.create" ||
            candidate.kind === "match.updateSetup") &&
          (deletion.kind === "team.delete"
            ? candidate.match.teamId === deletion.id
            : candidate.players.some(
                (player) => player.playerId === deletion.id,
              ))
        )
          return true;
      }
    }
    if (
      operation.command.kind === "match.create" ||
      operation.command.kind === "match.updateSetup"
    ) {
      const { match, players } = operation.command;
      return (
        (entry.command.kind === "team.create" &&
          entry.entityId === match.teamId) ||
        (entry.command.kind === "player.create" &&
          players.some((player) => player.playerId === entry.entityId)) ||
        (entry.command.kind === "teamPlayer.create" &&
          entry.command.teamPlayer.teamId === match.teamId &&
          players.some(
            (player) =>
              entry.command.kind === "teamPlayer.create" &&
              player.playerId === entry.command.teamPlayer.playerId,
          ))
      );
    }
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
