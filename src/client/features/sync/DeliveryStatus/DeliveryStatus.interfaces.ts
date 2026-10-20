import type { SyncCommand } from "../../../../contracts/sync.schema";
export interface DeliveryStatusProps {
  compact?: boolean;
  kind: SyncCommand["kind"];
  entityId: string;
  eventId?: string;
}
