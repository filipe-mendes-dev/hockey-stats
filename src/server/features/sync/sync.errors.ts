export class SyncConflictError extends Error {
  constructor(
    public readonly code:
      | "operation_conflict"
      | "player_conflict"
      | "team_conflict"
      | "match_conflict"
      | "membership_conflict"
      | "revision_conflict"
      | "reference_unavailable",
  ) {
    super(code);
    this.name = "SyncConflictError";
  }
}
