import { Suspense } from "react";
import { MatchDetailsPage } from "../../../../client/pages/matches/MatchDetailsPage/MatchDetailsPage";
export default function Page() {
  return (
    <Suspense>
      <MatchDetailsPage />
    </Suspense>
  );
}
