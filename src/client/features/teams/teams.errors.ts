export class LocalRevisionConflictError extends Error {
  constructor() {
    super("The record changed. Reopen the form to load the latest version.");
    this.name = "LocalRevisionConflictError";
  }
}
export class TeamPlayersError extends Error {
  constructor() {
    super(
      "The team or player is unavailable, or the player is already a member.",
    );
    this.name = "TeamPlayersError";
  }
}
