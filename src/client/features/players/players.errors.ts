export class PlayerChangedError extends Error {
  constructor() {
    super(
      "The player changed or was removed. Reopen the form to load the latest version.",
    );
    this.name = "PlayerChangedError";
  }
}
