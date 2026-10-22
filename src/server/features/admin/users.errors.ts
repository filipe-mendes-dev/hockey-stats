import type { AdminUsersErrorCode } from "../../../contracts/admin-users.schema";

export class AdminUsersError extends Error {
  constructor(
    public readonly code: AdminUsersErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "AdminUsersError";
  }
}
