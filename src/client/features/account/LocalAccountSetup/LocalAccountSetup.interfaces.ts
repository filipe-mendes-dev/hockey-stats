import type { ReactNode } from "react";
import type { AuthenticatedUser } from "../account.schema";

export interface LocalAccountSetupProps {
  children: ReactNode;
}

export interface AccountSetupState {
  status: "loading" | "ready" | "signIn" | "import" | "failed";
  account: AuthenticatedUser | null;
  playerCount: number;
}
