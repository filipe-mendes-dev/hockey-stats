export interface ScoreCorrectionFormProps {
  formId: string;
  ownName: string;
  opponentName: string;
  ownScore: number;
  opponentScore: number;
  value: number | string;
  onChange: (value: number | string) => void;
  onApply: () => void;
}
