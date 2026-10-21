export interface ScoreCorrectionFormProps {
  ownName: string;
  opponentName: string;
  ownScore: number;
  opponentScore: number;
  onApply: (opponentDelta: number) => void;
}
