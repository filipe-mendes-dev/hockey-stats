# Account schema and authentication flow

Status: implemented on 2026-10-14. This increment provides username/password authentication, admin-created users and a minimal protected shell. Workspace provisioning and account settings remain deferred. See the [implementation handoff](phase-1-handoff.md#authentication-increment) for verification.

## Sessions and identities

A session records a login on the server. The browser sends an opaque session identifier in an HttpOnly cookie; Better Auth validates the corresponding PostgreSQL session and its expiry. Use database-backed sessions without cookie caching for this increment. JWT is a token format, not a synonym for authentication. No JWT plugin or separate bearer-token flow is needed for this browser application. [Better Auth sessions](https://better-auth.com/docs/concepts/session-management).

`auth_user` identifies the person who logs in. `auth_account` holds that person's password credential or provider identity. The proposed `app_account` is a future workspace owning teams, players and games. Defer its table, provisioning requests and `/accounts/[accountId]` UI until product data needs ownership. Keep that future domain model separate from authentication roles.

## Better Auth and database schema

Use Better Auth with the `username` and `admin` plugins and its PostgreSQL Drizzle adapter. Generate the complete auth schema from the actual configuration, including required plugin fields. Preserve its foreign keys and indexes; do not build separate password, session, role or permission tables.

| SQL table           | Purpose                                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| `auth_user`         | Identity, unique normalized username, generated core fields and admin role fields. |
| `auth_account`      | Better Auth-managed password credential.                                           |
| `auth_session`      | Database-backed login session, expiry and generated plugin fields.                 |
| `auth_verification` | Required core verification structure; no email flow is enabled.                    |

Use only `user` and `admin`. Default new users to `user`. An admin can create users through Better Auth's permission checks; a normal user cannot manage other users or assign their own role. Use the plugin's access-control configuration for the required creation permission. Add management permissions when their workflows are introduced. Being an authentication admin does not automatically grant access to another user's future hockey data. [Better Auth admin plugin](https://better-auth.com/docs/plugins/admin).

Better Auth's username plugin still requires the core email field for user creation. Generate a unique internal value such as a random UUID at `users.benchline.invalid`. Treat it as an immutable compatibility field, never a contact address. Do not derive it from a mutable username. No user enters an email, and no mail service, verification callback or email reset flow is configured. Keep the library's password authenticator enabled internally; expose username/password login. Disable public signup and unused email flows. [Username plugin](https://better-auth.com/docs/plugins/username).

Drizzle ORM with a server-only `pg` pool handles database access. Drizzle Kit generates and applies checked-in SQL migrations for all auth tables. Use one migration history and explicit migration commands before serving dependent code, not migrations during requests or `drizzle-kit push`. Select compatible stable package versions during implementation. [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle).

## User creation

Create the first admin through a trusted terminal bootstrap using Better Auth's user-creation API. Prompt for credentials rather than putting passwords in command arguments or committed files. Do not expose an unauthenticated admin-creation endpoint or silently promote an existing user.

Until the admin screen exists, provide a small terminal helper for creating normal users. It authenticates with the administrator's username/password and calls Better Auth's admin creation API with the session, the new username/password and the internal email value. Validate and normalize usernames consistently, reject duplicates and let Better Auth hash passwords. The supplied initial password is communicated outside the application. The helper does not sign the browser in as the newly created user.

## Login and layout

| Route                | Behavior                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- |
| `/sign-in`           | Public username/password form. An already authenticated user redirects to `/`.     |
| `/`                  | Protected home. A visitor without a valid server session redirects to `/sign-in`.  |
| `/api/auth/[...all]` | Better Auth Route Handler; protected operations enforce session/permission checks. |

Login validates credentials through Better Auth, establishes the session cookie and navigates to `/`. Refreshing the protected page checks the session again. Sign-out invalidates the session and returns to `/sign-in`; report a failed request instead of claiming success. Public registration and forgot-password links are absent.

Use one shared shell with a small header and a `main` region. Put the product name on the left and sign-out on the right for authenticated users. Retain the existing language choice. The login content is one narrow form with username, password, submit, pending state and an inline error. Authenticated content is a simple placeholder. No sidebar, tabs, dashboard cards or account selector are needed.

Keep one root App Router layout. Route files compose client components under `src/client`; each component uses adjacent `styles.module.css` imported as `st`. Keep Better Auth configuration, the session helper and Drizzle code under `src/server`. Use labeled inputs, password-manager autocomplete, visible keyboard focus and flexible layouts for narrow screens and long Portuguese labels. Add all UI messages to both catalogs.

Validate sessions in protected server pages and independently in protected handlers. Role visibility in the browser does not authorize an operation. Do not store credentials or session tokens in localStorage, Zustand or IndexedDB. [Next.js integration](https://better-auth.com/docs/integrations/next).

## Backlog and limits

- Account settings, including changing password while signed in with the current password and revoking other sessions through Better Auth. No email is needed for this operation. [Password change](https://better-auth.com/docs/authentication/email-password#update-password).
- Admin navigation button and user-management screen, visible only to users with the relevant admin permission. Keep server permission enforcement even when the button is hidden.
- Administrator-assisted password recovery and any initial-password-change requirement. Do not claim forced rotation or password recovery in this increment.
- Personal workspace provisioning, account-scoped product persistence and command receipts belong to Phase 3's first synchronized recording slice.

The existing offline/session-expiry requirements remain unchanged for later recorder work. This increment introduces no local recorder storage or service worker. Phase 1 is complete for the agreed authentication/database scope. Workspace isolation and receipt acceptance belong to Phase 3.

## Implementation order and checks

Implement in small increments: Drizzle connection/schema/migrations; Better Auth plugins and user-creation helpers; login/protected shell and sign-out. Check migrations against the running PostgreSQL database, manually verify login/redirect/reload/sign-out and admin-versus-user creation permissions, then run formatting, lint, typecheck and a production build. Test files or test runs require explicit user instruction.

Implementation uses Better Auth/adapter/CLI 1.7.8, Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 and `pg` 8.23.1. The generated schema and initial migration are checked in. Bootstrap and user creation use the commands documented in the [README](../README.md#authentication-and-migrations). Admin permission is limited to creating normal users; assigning roles and other management actions remain disabled by the access-control policy. Credentials and profile validation run before auth user creation.
