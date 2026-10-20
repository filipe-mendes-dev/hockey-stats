export interface EntityDataStatusProps {
  failed?: boolean;
  loadingLabel: string;
  failedLabel: string;
  retryLabel: string;
  onRetry(): void;
}
