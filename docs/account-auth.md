# Account authentication

Completed-match sharing management requires a current enabled owner session. Public visitors authorize access through the specific share token without creating an account. Disabling an owner temporarily hides their shared pages; re-enabling restores existing unrevoked links. Permanent account deletion removes Matches and their sharing permissions. See [Completed-match sharing](match-sharing.md).

Better Auth handles username/password login, PostgreSQL sessions and admin-created users. There is no separate product account/workspace provisioning flow. Initial online sign-in establishes the local dataset owner; later session expiry affects synchronization rather than offline hockey workflows.

## Identity and authorization

| SQL table           | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `auth_user`         | Login identity, normalized unique username and role.         |
| `auth_account`      | Better Auth-managed credential/provider record.              |
| `auth_session`      | Database session and expiry.                                 |
| `auth_verification` | Generated core auth structure; no email workflow is enabled. |

The browser uses an HttpOnly session cookie. Cookie session caching is disabled. Do not put passwords or session tokens in IndexedDB, localStorage, Zustand or domain records. Metadata ownerUserId only prevents local account mixing; every API request independently authenticates and checks ownership.

Roles are user and admin. An admin can list accounts and manage normal users through the online-only Users page. Admin accounts are protected from all management actions. Role assignment and impersonation are unavailable. Admin status does not grant access to another user's hockey records.

The username plugin requires Better Auth's core email field internally. Creation generates an immutable random address at users.benchline.invalid. Users do not provide email and no messages are sent. Public signup, email login/reset/verification and unused profile routes are disabled.

## Routes and local ownership

- `/sign-in` renders the login form; an existing authenticated session redirects to `/app`.
- `/` is the server-protected home and redirects unauthenticated visitors to sign-in.
- `/app` hockey pages are generic static shells. LocalAccountSetup first checks established local ownership. Without a local identity and with a confirmed missing session, replace the current route with `/sign-in`. With a valid session, finish initialization automatically or show the existing-data import decision. Storage, network and initialization errors remain visible with retry; they do not trigger an authentication redirect. An established local identity permits local use after session expiry or network loss. While that browser check is pending, render only a neutral loading indicator, without setup headings or actions. The sign-in page header logo links back to sign-in, avoiding a needless trip through `/app`. The server cannot inspect the IndexedDB identity; keep `/app` prerendered and cacheable rather than adding a server session requirement that would block initialized offline use.
- `/api/auth/[...all]` delegates to Better Auth. Sync handlers authorize the current user and expected local owner.

The shared header shows Sign out only when the client has a session, sign-out is in progress, or local cleanup needs retry. The pathname alone does not establish authentication. Session checks in the header are presentation only and never gate offline hockey access.

A different authenticated account cannot adopt or synchronize an existing owner's local data. The application reports mismatch and retains that dataset. Offline use trusts the unlocked personal device and cannot check fresh revocation.

Explicit sign-out requires confirmation. The dialog reads all pending and blocked outbox operations before enabling confirmation and warns about local-data deletion. Cancel leaves the session, synchronization and local records intact. Confirm requires a successful server request, then deletes the complete application IndexedDB, including unsynced work. Cleanup failures offer retry and late sync responses cannot recreate deleted data. Failed network sign-out retains data and reports failure. See [Offline cleanup policy](offline-sync.md#failure-and-cleanup-policy).

## Account creation and setup

The [README](../README.md#authentication-and-migrations) documents environment, migrations and the interactive terminal commands:

- `auth:bootstrap-admin` creates the first admin and refuses to promote/replace an existing user or create another admin.
- `auth:create-user` prompts for admin credentials and the new user's details, delegates to Better Auth and revokes its temporary helper session.

Usernames are 3–30 letters, numbers, underscores or dots and normalized to lowercase. New and replacement passwords are 12–128 characters and cannot be blank-only. Existing passwords remain valid for sign-in. Prompts mask passwords; never put them in command arguments or committed files. Initial and replacement passwords are communicated outside the application. Usernames remain fixed. Self-service password changes and forced initial password changes remain deferred.

## Closed-beta user management

`/app/admin/users` requires a current, non-disabled admin session. A Users link appears in the shared navigation and home menu only for admins. The page lists accounts with server pagination and name/username search. Desktop uses a table; compact screens use account rows with identity, role/access and actions. Admin rows remain visible but protected. Management guidance uses a keyboard- and touch-accessible help popover.

`/api/admin/users` validates strict inputs, authenticates every request and returns no-store responses containing only directory fields. Mutations check the configured origin and reject targets whose role is not user. Better Auth's native admin HTTP endpoints are disabled; server API calls remain available to the application and terminal helpers.

- Create opens `/app/admin/users/new`, using the shared page form layout with name, username, password and matching password confirmation. The normal role is assigned automatically. A visible subtitle explains creation; one help popover adds credential-sharing and fixed-username details. Inputs inherit the shared theme radius and new-password length is shown with the field.
- Edit changes the display name only.
- Set password stays in a responsive dialog with an action heading and account-specific subtitle, shares the Mantine password/confirmation fields with creation, replaces credentials through Better Auth and revokes existing sessions. If revocation fails after replacement, report the partial result and allow an explicit retry.
- Disable uses an indefinite Better Auth ban and revokes sessions. Enable restores login access. Hockey data is retained.
- Permanent deletion requires a disabled normal account and an exact username confirmation. A server transaction removes owned event history before Matches, Teams and Players, then removes receipts and authentication records. Restrictive references abort and roll back deletion rather than leaving partial data loss.

The account directory and administrative writes never enter IndexedDB, the outbox or service-worker caches. Passwords exist only in the open form and request, and are cleared on success or dismissal. Disabling or deleting an account cannot wipe another browser's IndexedDB or revoke offline personal-device access. Existing offline hockey workflows remain available under their current policy.

Generate auth schema only when configuration/plugins change. Drizzle uses one checked-in SQL migration history; apply migrations explicitly before serving dependent code. Never migrate during a request or rewrite applied migration files.
