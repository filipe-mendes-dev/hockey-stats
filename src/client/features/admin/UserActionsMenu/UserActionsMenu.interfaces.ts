import type { AdminUser } from "../../../../contracts/admin-users.schema";
import type { UserDialogSelection } from "../UserDialog/UserDialog.interfaces";

export interface UserActionsMenuProps {
  user: AdminUser;
  onSelect(selection: UserDialogSelection): void;
}
