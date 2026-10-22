import type { AdminUser } from "../../../../contracts/admin-users.schema";
import type { UserDialogSelection } from "../UserDialog/UserDialog.interfaces";

export interface UsersListProps {
  users: AdminUser[];
  busy: boolean;
  onSelect(selection: UserDialogSelection): void;
}
