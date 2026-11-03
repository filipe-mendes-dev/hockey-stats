import type { MatchStatisticsView } from "../../../../contracts/match-statistics-view.schema";

export interface SharedMatchPageProps {
  view: MatchStatisticsView;
}

export interface SharedMatchUnavailableProps {
  failed?: boolean;
}
