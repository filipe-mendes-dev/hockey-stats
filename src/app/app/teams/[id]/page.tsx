import { Suspense } from "react";
import { TeamDetailsPage } from "../../../../client/pages/teams/TeamDetailsPage/TeamDetailsPage";

export default function TeamDetailsPageRoute() {
  return (
    <Suspense>
      <TeamDetailsPage />
    </Suspense>
  );
}
