import "server-only";
import { applyMatchControl } from "../../../domain/matches/matchControl";
import type { MatchCommand } from "../../../contracts/matches-sync.schema";
import type { Match, MatchPlayer } from "../../../domain/matches/match.schema";
import type { DatabaseTransaction } from "../../db/client.ts";
import { SyncConflictError } from "../sync/sync.errors";
import {
  getOwnedMatchForUpdate,
  hasOwnedMatchReferences,
  insertMatchSnapshot,
  getMatchSnapshotForOwner,
  updateMatchSnapshot,
  updateMatchControl,
} from "./matches.repository";
function samePlayerDetails(before: MatchPlayer, after: MatchPlayer): boolean {
  return (
    before.id === after.id &&
    before.matchId === after.matchId &&
    before.playerId === after.playerId &&
    before.playerNameAtMatch === after.playerNameAtMatch &&
    before.jerseyNumber === after.jerseyNumber &&
    before.role === after.role
  );
}
export async function applyMatchCommand(
  transaction: DatabaseTransaction,
  ownerUserId: string,
  command: MatchCommand,
): Promise<void> {
  if (command.kind === "match.create") {
    if (!(await hasOwnedMatchReferences(transaction, ownerUserId, command)))
      throw new SyncConflictError("reference_unavailable");
    if (!(await insertMatchSnapshot(transaction, ownerUserId, command)))
      throw new SyncConflictError("match_conflict");
    return;
  }
  if (command.kind === "match.control") {
    const match = await getOwnedMatchForUpdate(
      transaction,
      ownerUserId,
      command.match.id,
    );
    if (
      !match ||
      match.revision !== command.expectedRevision ||
      match.status !== "live"
    )
      throw new SyncConflictError("revision_conflict");
    const snapshot = await getMatchSnapshotForOwner(
      transaction,
      ownerUserId,
      match.id,
    );
    if (!snapshot) throw new SyncConflictError("reference_unavailable");
    let next: Match;
    try {
      next = applyMatchControl(match, command.action, command.match.updatedAt);
    } catch {
      throw new SyncConflictError("match_conflict");
    }
    if (
      JSON.stringify(next) !== JSON.stringify(command.match) ||
      JSON.stringify(snapshot.players.map((player) => player.id).sort()) !==
        JSON.stringify(command.players.map((player) => player.id).sort()) ||
      !command.players.every((player) =>
        snapshot.players.some(
          (before) =>
            samePlayerDetails(before, player) &&
            before.isStarter === player.isStarter,
        ),
      )
    )
      throw new SyncConflictError("match_conflict");
    if (
      !(await updateMatchControl(
        transaction,
        ownerUserId,
        next,
        command.expectedRevision,
      ))
    )
      throw new SyncConflictError("revision_conflict");
    return;
  }
  const current = await getMatchSnapshotForOwner(
    transaction,
    ownerUserId,
    command.match.id,
  );
  if (
    !current ||
    current.match.status !== "setup" ||
    current.match.revision !== command.expectedRevision
  )
    throw new SyncConflictError("revision_conflict");
  for (const player of command.players) {
    const existing = current.players.find(
      (entry) => entry.playerId === player.playerId,
    );
    if (
      existing &&
      (existing.id !== player.id ||
        existing.playerNameAtMatch !== player.playerNameAtMatch)
    )
      throw new SyncConflictError("match_conflict");
  }
  if (command.kind === "match.updateSetup") {
    const added = command.players.filter(
      (player) =>
        !current.players.some((entry) => entry.playerId === player.playerId),
    );
    if (
      !(await hasOwnedMatchReferences(transaction, ownerUserId, {
        match: command.match,
        players: added,
      }))
    )
      throw new SyncConflictError("reference_unavailable");
  } else {
    if (
      command.match.opponentName !== current.match.opponentName ||
      command.match.scheduledDate !== current.match.scheduledDate ||
      command.match.venueRole !== current.match.venueRole ||
      command.players.length !== current.players.length ||
      !command.players.every((player) =>
        current.players.some((entry) => samePlayerDetails(entry, player)),
      )
    )
      throw new SyncConflictError("match_conflict");
  }
  if (
    !(await updateMatchSnapshot(
      transaction,
      ownerUserId,
      command,
      command.expectedRevision,
    ))
  )
    throw new SyncConflictError("revision_conflict");
}
