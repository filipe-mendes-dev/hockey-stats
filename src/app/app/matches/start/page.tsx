import { Suspense } from "react";
import { StartMatchPage } from "../../../../client/pages/matches/StartMatchPage/StartMatchPage";
export default function Page() {
  return (
    <Suspense>
      <StartMatchPage />
    </Suspense>
  );
}
