import type { MatchSharingErrorCode } from "../../../contracts/match-sharing.schema";

export class MatchSharingError extends Error {
  constructor(
    public readonly code: MatchSharingErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "MatchSharingError";
  }
}
