import { AppShell } from "../../client/components/AppShell/AppShell";
import { LocalAccountSetup } from "../../client/features/account/LocalAccountSetup/LocalAccountSetup";
import { SyncLifecycle } from "../../client/features/sync/SyncLifecycle";
import { SyncStatusPanel } from "../../client/features/sync/SyncStatusPanel/SyncStatusPanel";
import { QueryProvider } from "../../client/query/QueryProvider";

export default function LocalApplicationLayout({
  children,
}: LayoutProps<"/app">) {
  return (
    <QueryProvider>
      <AppShell authenticated>
        <LocalAccountSetup>
          <SyncLifecycle />
          <SyncStatusPanel />
          {children}
        </LocalAccountSetup>
      </AppShell>
    </QueryProvider>
  );
}
