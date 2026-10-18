import type { ReactNode } from "react";
import type { LocalAccount } from "../../../../contracts/players-sync.schema";

export interface LocalAccountSetupProps {
  children: ReactNode;
}

export interface AccountSetupState {
  status: "loading" | "ready" | "signIn" | "import" | "failed";
  account: LocalAccount | null;
  playerCount: number;
}
