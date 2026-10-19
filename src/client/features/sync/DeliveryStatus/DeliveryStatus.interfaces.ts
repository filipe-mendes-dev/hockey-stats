import type { SyncCommand } from "../../../../contracts/sync.schema";
export interface DeliveryStatusProps {
  kind: SyncCommand["kind"];
  entityId: string;
  eventId?: string;
}
