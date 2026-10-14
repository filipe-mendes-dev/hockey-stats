import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const accessControl = createAccessControl(defaultStatements);
export const roles = {
  user: accessControl.newRole({}),
  admin: accessControl.newRole({ user: ["create"] }),
};
