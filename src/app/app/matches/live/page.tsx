import { Suspense } from "react";
import { LiveMatchPage } from "../../../../client/pages/matches/LiveMatchPage/LiveMatchPage";
export default function Page() {
  return (
    <Suspense>
      <LiveMatchPage />
    </Suspense>
  );
}
