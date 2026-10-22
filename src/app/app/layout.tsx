import { LocalAccountSetup } from "../../client/features/account/LocalAccountSetup/LocalAccountSetup";
import { SyncLifecycle } from "../../client/features/sync/SyncLifecycle";
import { QueryProvider } from "../../client/query/QueryProvider";

export default function LocalApplicationLayout({
  children,
}: LayoutProps<"/app">) {
  return (
    <QueryProvider>
      <LocalAccountSetup>
        <SyncLifecycle />
        {children}
      </LocalAccountSetup>
    </QueryProvider>
  );
}
