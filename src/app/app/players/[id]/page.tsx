import { Suspense } from "react";
import { PlayerDetailsPage } from "../../../../client/pages/players/PlayerDetailsPage/PlayerDetailsPage";

export default function PlayerDetailsRoute() {
  return (
    <Suspense>
      <PlayerDetailsPage />
    </Suspense>
  );
}
