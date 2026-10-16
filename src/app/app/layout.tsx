import { AppShell } from "../../client/components/AppShell/AppShell";
import { PlayersPreviewProvider } from "../../client/features/players/PlayersPreviewProvider";

export default function LocalApplicationLayout({
  children,
}: LayoutProps<"/app">) {
  return (
    <AppShell>
      <PlayersPreviewProvider>{children}</PlayersPreviewProvider>
    </AppShell>
  );
}
