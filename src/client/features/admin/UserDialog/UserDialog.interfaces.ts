import type {
  AdminUser,
  AdminUserAction,
} from "../../../../contracts/admin-users.schema";

export interface UserDialogSelection {
  action: Exclude<AdminUserAction["action"], "create">;
  user: AdminUser;
}

export interface UserDialogProps {
  selection: UserDialogSelection;
  administratorId: string;
  onClose(): void;
  onSaved(): void;
}
