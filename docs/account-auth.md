# Account authentication

Better Auth handles username/password login, PostgreSQL sessions and admin-created users. There is no separate product account/workspace provisioning flow. Initial online sign-in establishes the local dataset owner; later session expiry affects synchronization rather than offline hockey workflows.

## Identity and authorization

| SQL table           | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `auth_user`         | Login identity, normalized unique username and role.         |
| `auth_account`      | Better Auth-managed credential/provider record.              |
| `auth_session`      | Database session and expiry.                                 |
| `auth_verification` | Generated core auth structure; no email workflow is enabled. |

The browser uses an HttpOnly session cookie. Cookie session caching is disabled. Do not put passwords or session tokens in IndexedDB, localStorage, Zustand or domain records. Metadata ownerUserId only prevents local account mixing; every API request independently authenticates and checks ownership.

Roles are user and admin. An admin can create normal users, with no role-assignment or other management permission. Admin status does not grant access to another user's hockey records.

The username plugin requires Better Auth's core email field internally. Creation generates an immutable random address at users.benchline.invalid. Users do not provide email and no messages are sent. Public signup, email login/reset/verification and unused profile routes are disabled.

## Routes and local ownership

- `/sign-in` renders the login form; an existing authenticated session redirects to `/app`.
- `/` is the server-protected home and redirects unauthenticated visitors to sign-in.
- `/app` pages are generic static shells. LocalAccountSetup gates access using established local ownership and initial online sign-in.
- `/api/auth/[...all]` delegates to Better Auth. Sync handlers authorize the current user and expected local owner.

A different authenticated account cannot adopt or synchronize an existing owner's local data. The application reports mismatch and retains that dataset. Offline use trusts the unlocked personal device and cannot check fresh revocation.

Explicit sign-out requires a successful server request, then deletes the complete application IndexedDB, including unsynced work. Cleanup failures offer retry and late sync responses cannot recreate deleted data. Failed network sign-out retains data and reports failure. See [Offline cleanup policy](offline-sync.md#failure-and-cleanup-policy).

## Account creation and setup

The [README](../README.md#authentication-and-migrations) documents environment, migrations and the interactive terminal commands:

- `auth:bootstrap-admin` creates the first admin and refuses to promote/replace an existing user or create another admin.
- `auth:create-user` prompts for admin credentials and the new user's details, delegates to Better Auth and revokes its temporary helper session.

Usernames are 3–30 letters, numbers, underscores or dots and normalized to lowercase. Passwords are 8–128 characters. Prompts mask passwords; never put them in command arguments or committed files. The initial password is communicated outside the application. Password changes/recovery and admin UI remain deferred.

Generate auth schema only when configuration/plugins change. Drizzle uses one checked-in SQL migration history; apply migrations explicitly before serving dependent code. Never migrate during a request or rewrite applied migration files.
