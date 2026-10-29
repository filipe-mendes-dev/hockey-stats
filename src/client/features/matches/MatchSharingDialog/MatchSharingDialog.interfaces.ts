export interface MatchSharingDialogProps {
  matchId: string;
}

export interface SharingControlsProps extends MatchSharingDialogProps {
  onClose(): void;
}
