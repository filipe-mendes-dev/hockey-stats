export interface SignOutDialogProps {
  opened: boolean;
  pending: boolean;
  cleanupOnly: boolean;
  error: "signOutFailed" | "signOutCleanupFailed" | null;
  onClose(): void;
  onConfirm(): Promise<void>;
}
