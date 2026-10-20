# Offline persistence and synchronization

## Ownership and local durability

Keep one IndexedDB dataset bound to one metadata ownerUserId. This is a local account-mixing guard, not an authorization credential. Require one successful online sign-in, then allow local workflows through network loss and session expiry. A different authenticated account cannot adopt/upload the dataset.

Existing unowned prototype Players require explicit import naming the destination account. Import preserves IDs/timestamps and atomically establishes ownership and pending commands. Not now retains records and leaves setup incomplete. Fresh empty storage initializes after verified online sign-in.

IndexedDB is the working store online and offline. PostgreSQL is authoritative for accepted shared copies. Save domain changes, required local Undo history and immutable outbox intent in one local transaction before showing success. TanStack Query is temporary UI state; Zustand contains only the open draft.

## Local database

`benchline-stats` uses Dexie schema version 9. Stores are players, teams, teamPlayers, matches, matchPlayers, matchEvents, matchHistory, metadata and outbox. Keys/indexes are declared in `src/client/storage/database.ts`; record properties are validated by Zod at input/read/transport boundaries.

Earlier upgrades preserve prototype Players, remove workspace fields, migrate outbox playerId to entityId, remove obsolete membership status and add entity/event stores. Do not alter applied versions or reset storage on failure. Validate existing values; let invalid upgrades abort visibly without deleting data.

Initialization verifies read/write transaction access and reports preparing, ready, failed, unsupported, blocked or closed state. Request persistent storage separately. Refusal permits use with a retention notice. Strict transaction durability is requested where supported; it is not a cross-browser power-loss or backup guarantee.

## Shared outbox and protocol

One ordered outbox serves Players, Teams, TeamPlayers, Matches and events. Each operation has a stable operationId, entityId, monotonic local sequence, immutable typed command and pending/blocked status. Never change payload while reusing its ID.

Player/Team/TeamPlayer creates precede dependent work. Commands for one Team, TeamPlayer or Match follow their revision chain. Match creation, setup, Start, clock/lifecycle controls, events and Undo share the Match aggregate ID and expectedRevision. Do not silently rebase a stale command.

| Boundary                     | Current contract                                                                              |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `POST /api/sync/commands`    | Authenticated typed command acceptance.                                                       |
| `GET /api/sync/players`      | Full owner-scoped Players collection.                                                         |
| `GET /api/sync/teams`        | Full owner-scoped Teams collection.                                                           |
| `GET /api/sync/team-players` | Full owner-scoped memberships.                                                                |
| `GET /api/sync/matches`      | Complete Match snapshots/events, including tombstones, from one repeatable-read SQL snapshot. |

Handlers validate the session and X-Expected-User-Id header independently. Authorization derives from the session, never a supplied owner. POST also checks the configured application origin. Responses are no-store and are not cached by the worker.

Entity/setup/control commands use version 1; current event create/Undo commands use version 3. Event versions 1/2 remain shape-compatible for preceding queued work. Once powerplay-protocol events exist, older event-protocol writes conflict; an already accepted operation still replays its exact receipt. The acknowledgement/download envelopes remain version 1. Database, command and application-cache versions are independent.

The server reserves an owner/operation receipt in the same SQL transaction as the mutation. Concurrent duplicate reservations wait and replay the committed result. Reusing an ID with different content conflicts. Failed workflows roll back receipt and data together. Match event/control workflows lock the owned Match and check revision/domain rules.

## Foreground delivery

One coordinator cycle pushes pending operations, durably applies each acknowledgement, then downloads Players, Teams, memberships and Matches. Web Locks serialize cycles across same-origin tabs. The existing lock name remains `benchline.players-sync` for compatibility with older open tabs; it protects all command kinds.

Trigger delivery after local writes/import, startup, successful authentication, reconnection, focus/visibility and manual retry. Refresh every 60 seconds while visible. Requests have a 15-second timeout. Transient retries back off from one second to at most 60 seconds, respecting bounded server Retry-After values. Browser online status is only a hint.

Authentication failure pauses sync; mismatch preserves local data and reports the owner problem. Permanent validation/revision conflicts remain blocked. Dependent operations wait while independent entities can continue. Unsupported Web Locks retains local work and reports synchronization unavailable. Background Sync and server push are not required.

## Acknowledgements and downloads

Apply acknowledgement data and remove only its outbox operation in one IndexedDB transaction. Recheck owner and abort state inside the transaction. A failed local acknowledgement leaves the operation available for safe receipt replay. Do not overwrite a higher local entity/event/Match revision with an older acknowledgement.

Downloads merge complete records without deleting local entities absent from the response. Pending and blocked entities are protected. A pending Match protects its entire snapshot/event history. Replace accepted Match snapshot and events together only when its revision is not older and no local Match commands remain. The local Undo journal stays local.

The shared localDataEvents module sends a DOM notification to this tab and BroadcastChannel invalidation to other tabs. SyncLifecycle refreshes entity/outbox queries. Notifications do not replace transaction checks and contain no records or credentials.

## Failure and cleanup policy

| Failure                                     | Behavior                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Local transaction failure/quota             | Roll back all records/history/outbox changes; retain visible form/draft and report unsaved. |
| Timeout/server failure/lost acknowledgement | Preserve local records and command; retry the same ID.                                      |
| Local acknowledgement failure               | Retain command even if SQL committed; replay receipt safely.                                |
| Expired session                             | Preserve local use and request sign-in for synchronization.                                 |
| Wrong authenticated owner                   | Reject synchronization; preserve the dataset.                                               |
| Permanent command rejection/stale revision  | Mark blocked; retain local work and stop its dependent chain.                               |
| Failed/blocked sign-out deletion            | Show cleanup retry; never claim that data was removed.                                      |

Explicit sign-out first stops synchronization and invalidates the server session. On success it closes local writes, notifies tabs, deletes the complete application IndexedDB, then navigates to clear transient Query/Zustand state. It includes unsynced work. Other tabs close/navigate on notification or deletion. Late responses are aborted and owner-checked. Generic cached files remain.

If the server sign-out request fails, including while offline, the current UI retains local data and reports failure. An offline-only clear/revocation workflow is not implemented. Session expiry itself never clears records.

## Offline routing and updates

`/app` is the public static launch target. Precache generic documents and full RSC payloads for the paths in `src/offline-pages.ts`, including Players/Teams details and Match creation/view/Start/live. Query IDs select IndexedDB records without requiring separate cached URLs. Initial application installation must happen online, and feature data must have been downloaded or created locally.

Never cache personalized server HTML, auth redirects or API responses. Unsupported routes and speculative/segmented prefetches have no generic fallback. Distinguish HTML navigation from full RSC responses. Both language catalogs and feature code ship in the required asset graph.

Offline readiness requires verified cached files plus successful storage initialization. Native installation alone is insufficient. Unknown IDs show unavailable. Legacy dynamic Player/Team documents remain outside the offline guarantee.

Worker registration runs only in production. Updates remain waiting until all application tabs/windows close, then activate on reopening. Do not force reload during tracking. Use HTTPS outside localhost/loopback, and match browser origin to BETTER_AUTH_URL. Separate origins have separate IndexedDB/caches, even when normal authentication cookies are shared.

## Current limits

One active observer per Match is the product assumption. Same-origin transactions serialize local writes and Web Locks serialize uploads, but a second recorder tab is not automatically read-only. Concurrent remote writers can produce blocked revision conflicts; no merge/resolution UI exists yet.

Full downloads, local history retention and personal-device access are deliberate prototype choices. Incremental downloads, cross-device Undo, export/backup, encrypted/shared-device unlock and conflict recovery remain in the [Backlog](backlog.md). See [Development plan](development-plan.md) for verification limits.
