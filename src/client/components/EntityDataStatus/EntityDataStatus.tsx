import { Button } from "../Button/Button";
import type { EntityDataStatusProps } from "./EntityDataStatus.interfaces";
import st from "./EntityDataStatus.module.css";

export function EntityDataStatus({
  failed = false,
  loadingLabel,
  failedLabel,
  retryLabel,
  onRetry,
}: EntityDataStatusProps) {
  return (
    <div className={st.feedback}>
      <p role={failed ? "alert" : "status"}>
        {failed ? failedLabel : loadingLabel}
      </p>
      {failed && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
