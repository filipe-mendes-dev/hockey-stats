import { LocalApp } from "../../client/pwa/local-app";
import { AppShell } from "../../client/shell/app-shell";

export default function LocalAppPage() {
  return (
    <AppShell>
      <LocalApp />
    </AppShell>
  );
}
