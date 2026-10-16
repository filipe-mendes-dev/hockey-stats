# Offline persistence and synchronization

## Authority and local durability

PostgreSQL is authoritative for accepted shared records. The Next.js API is the access boundary, not itself a database.

IndexedDB is the primary working store for local teams, players, memberships, games, roster snapshots, recording, retained history and later synchronization metadata. Local workflows operate without a server account or a prior upload. PostgreSQL is authoritative for server-accepted copies, not a prerequisite for creating local records. Browser storage limits and failures must be handled explicitly; local storage is not a guarantee against device/browser data loss.

Offline operation includes creating teams/players and setting up a new game using retained data or new local entries. Retain the game's roster, starters, settings, history and corrections to reconstruct recording after reload. Successful upload does not remove working data. Keep team/player data and locally retained games usable offline; bounded history retention must never silently remove unsynced work. Exact retention controls are deferred.

## Offline scope and installation readiness

Use one generic cached application entry for every local hockey workflow. Team/player management, new-match setup, roster selection, recording, clock, timeline, undo, corrections and locally retained history must work offline as those features are implemented. Account management, sign-in and server synchronization require connectivity. A limited prepared-games-only `/offline` mode is no longer the product requirement.

During the initial online application download, precache the complete required code/asset set and initialize the local database. Report application readiness only after both complete. The browser's installation prompt does not prove readiness; users need not open every feature first. Each later release must include newly added offline feature code in that asset set. User data comes from local entry or an explicit server download, not from the application manifest.

Create stable workspace/entity IDs on the device. Starting a new game never requires prior online preparation or a confirmed server revision. Selecting an unknown existing-game ID shows unavailable without inventing a game; the explicit creation workflow remains available offline. Remote history not yet downloaded cannot be shown offline. Route/query parameters cannot bypass local workspace scope.

## Recording writes

Use the same local-first write path online and offline for management, match setup and recording as features arrive:

1. Validate the completed UI command.
2. Commit local changes and the required durable operation/sync intent in one IndexedDB transaction. An unbound local workspace retains intent without selecting a server account automatically.
3. Show saved locally and clear the visible creation draft.
4. Attempt upload only after explicit workspace/account binding and when connectivity and authentication permit.
5. Commit the accepted command and idempotency receipt in one PostgreSQL transaction.
6. Persist acknowledgement locally and reconcile confirmed data without overwriting later pending work.
7. Show synced.

This avoids an unreliable split between direct online writes and a separate offline-only queue. It does not create a distributed transaction. A server rejection can leave a valid local recording needing explicit reconciliation.

## Local records

Keep local-workspace-scoped entities, confirmed versions, pending projections, operation history, sync intent, cursors and persisted clock state. Server account binding is separate from the local workspace identity. Never-uploaded records have no confirmed server version. Select feature tables and wire contracts during the first product/synchronization slice; Phase 2 only establishes database initialization, versioning and failure handling.

Maintain a confirmed server base separately from pending local intent. The visible projection applies pending commands over that base. Receiving an older acknowledgement must not replace a newer local edit. Test that behavior before adding broad UI features.

Zustand may display pending/error summaries but does not own the only copy of any mutation. An event pending upload is a committed local event, not an invisible creation draft.

Generate stable entity/command IDs before local writes so later edits and retries refer to the same record. Team/player creation, membership changes, game/roster setup, recording, clock and corrections all originate locally. Synchronization delivers prerequisite creates before dependent commands, including edits and inverses. Preserve unsynced creation intent until a server binding and acknowledgements exist.

## Command protocol

Use versioned HTTP contracts with, at minimum:

- Stable command ID, account scope and schema version.
- Aggregate identity and explicit command kind/payload.
- Expected confirmed revision or a declared dependent revision chain.
- Stable entity IDs and local ordering metadata where required.

For the first recorder protocol, serialize mutations per game and use an expected game-aggregate revision. A queued chain can expect successive revisions when each accepted command increments the aggregate once. The initial expected revision comes from the confirmed base; do not silently advance it from an unrelated remote change to bypass a conflict.

A game can be created and recorded locally before server contact. Synchronization must accept its stable client ID through an idempotent create command, after team/player prerequisites, and establish a confirmed revision before delivering dependent game mutations. Do not fabricate confirmed revisions for local-only records. Team/player management has its own mutation scope; do not create one global account revision that makes unrelated games conflict. Define the exact creation/dependency protocol in Phase 3, not the Phase 2 foundation.

Server handling:

1. Authenticate and authorize account access.
2. Look up the account-scoped command receipt.
3. If already accepted, verify the request matches the original and return its recorded result.
4. Otherwise check the expected revision, references and domain rules.
5. Commit mutation, aggregate revision, change-log entry and receipt atomically.
6. Return authoritative revisions and acknowledgement.

Do not change a command's payload while reusing its ID. Explicit conflict resolution that changes intent creates a new command. Client before-images cannot authorize arbitrary server row replacement.

Separate event order from aggregate revision and server acceptance time. Concurrent devices do not get an automatic merged lineup. A stale writer receives a conflict and preserves its pending data.

## Delivery and reconciliation

- Upload commands serially within a game and in prerequisite order.
- Trigger delivery on app startup, return to foreground, successful sign-in and reconnect; also provide manual retry.
- Treat connectivity events as hints. A request failure determines delivery status.
- Use bounded exponential retry backoff for transient failures.
- Retain pending commands until acknowledgement is durably stored locally.
- Advance confirmed revisions monotonically. An old acknowledgement must not replace a newer confirmed base already received through download.
- Download accepted changes using an account-scoped server change cursor, including tombstones.
- Apply page data and its cursor atomically. Repeating a page must be safe.
- Do not advance a cursor past a failed page or overwrite pending projections with a download.
- Resume after reload from persisted queue, receipts and cursor.
- Do not require Background Sync support, WebSockets or a permanently running worker.

An acknowledgement can be lost after the PostgreSQL commit. Retry the same command ID; the existing receipt returns the result without applying the event again.

## Failure policy

| Failure | Required behavior |
| --- | --- |
| IndexedDB transaction fails. | Roll back all local changes; keep visible draft open; report unsaved. |
| Network timeout or server unavailable. | Keep local event and queue; retry without duplicate effects. |
| Authentication expires. | Pause upload for that account; retain recording and queue; offer sign-in when online. |
| Account access revoked. | Server rejects upload; preserve local pending work under its original account and show action required. |
| Revision conflict. | Block the affected command chain; retain local intent and fetch authoritative state for explicit resolution. |
| Invalid command rejected. | Preserve it as action-required; do not retry forever or discard dependent work. |
| Lost acknowledgement. | Retry the original ID and use the recorded server receipt. |
| Local quota/storage denied. | Never report saved; preserve the current visible draft while the page stays open. |

Do not silently apply last-write-wins to movement history, starter changes, event edits or clock corrections. Working V1 policy is one active recorder per game; a second device can download accepted data for viewing. Concurrent writing is detected and resolved explicitly, not advertised as collaboration.

## Undo and historical edits

Persist undo and inverse commands locally. Serialize inverse operations after their original operation, even if its acknowledgement was lost. A server may already have accepted it.

Undoing an accepted event requires another authorized, revision-checked API mutation. Do not remove only the local row and leave the server event intact. Preserve tombstones in download and upload flows.

The historical-correction command distinguishes explicit accepted contradictions from invalid live entry. Both sides run the same replay diagnostics. Do not infer automatic substitution or card consequences during sync.

Both sides require game time for player-in/out, including corrected movements. Reject commands that omit or clear it; other event types may remain untimed.

## Authentication and account isolation

- Use an established authentication integration; provider selection precedes the account/API phase.
- Keep online session credentials out of Zustand, IndexedDB and exported domain records.
- Authorize every handler/service against the current session and account scope.
- Include local workspace scope in local reads/writes. Bind server-bound queues, receipts and queries to an explicitly authorized account.
- Initial sign-in and uncached account provisioning require connectivity.
- No login is required to manage local teams/players, create a match, record or view locally retained games. Connection loss and session expiry preserve local data and pause only synchronization.
- Explicit sign-out must remove the signing-out account's private local dataset and clear transient state, while retaining generic installed app assets. A different account must never automatically adopt or upload those records.
- Offline access cannot check fresh revocation. Upload always revalidates current access.

The agreed target is personal devices across phones, tablets and computers. Local use survives ordinary reloads, app restarts, connection loss and expired server sessions. The user's explicit sign-out requirement supersedes the earlier lock-and-retain policy: remove private local data instead of retaining it for a later local unlock. This is a planned behavior change; the current Phase 1 code is unchanged.

Before implementing destructive cleanup, resolve unsynced-work handling. The recommended flow synchronizes pending work before deletion when possible. If work remains or the device is offline, ordinary sign-out must not silently delete it: offer cancellation or a separate explicit discard-and-sign-out decision describing the loss. This safeguard is a proposal awaiting agreement, not permission to delete current records.

Stop writes/uploads before cleanup and coordinate other tabs so old in-memory state cannot restore deleted data. Delete the account's local working records, pending commands, undo and derived private state together; clear its binding and transient state. Keep generic HTML/JavaScript/CSS/icons/translations and unrelated workspace data. If cleanup fails, do not report completed removal or allow another account to reuse stale state. Later signing back in can restore only server-accepted data, not discarded unsynced work.

Without connectivity, the application can remove private local data but cannot confirm server-session revocation. Report that distinction and ensure a surviving cookie cannot automatically reconnect the removed dataset. Exact offline revocation handling belongs to the later account/sync flow. This policy trusts the unlocked personal device and does not encrypt IndexedDB; advanced shared-device controls remain deferred.

## Service worker and routing

Cache generic application assets separately from user records. The implemented public entry and manifest launch target is `/app`. Precache its complete required asset graph, including code for unvisited local views, styles, fonts/icons and both catalogs. User data will remain in workspace-scoped IndexedDB when that increment is implemented. Local language switching requires no translation download or server refresh. See [current verification and limits](phase-2-handoff.md).

Prove all of these against a production build:

- Cold-launch and reload the normal local application with the network disabled and no authenticated session.
- Navigate between all implemented local views without first visiting each one online.
- After their feature phases, create teams/players, set up a new match, record, reload and view retained history entirely offline. Reject unknown existing IDs without an implicit write.
- Continue all local workflows after the online session expires, without an auth redirect breaking local boot.
- Move between required offline views without requesting an unavailable server component payload.
- Prevent account switching from reassigning or uploading another account's local data; verify sign-out cleanup and unsynced-work safeguards when implemented.
- Switch English/Portuguese offline without losing a draft, clock or pending records.

Do not cache arbitrary personalized HTML, API responses or authentication redirects to solve routing failures. The offline shell itself contains no private server-rendered account data.

Show offline readiness only after required assets and database initialization succeed; do not require a pre-existing game. First-ever access to an uncached application cannot work offline. Recheck readiness after interrupted installation or storage loss. Local data and application caches belong to the current origin/browser context; a hostname change does not migrate them.

Use prompted service-worker updates. Defer activation/reload while recording, while the add-event UI is open or while a local transaction is in progress. Keep old required assets until a safe activation point.

## Migrations and local concurrency

Version IndexedDB schemas, SQL migrations and wire contracts independently. Test existing games, pending commands and undo history through upgrades. Do not reset storage to recover from a failed migration.

Handle blocked IndexedDB upgrades with an explanation about other tabs. Use transactional revision checks as the correctness boundary; tab notifications or locks are supplementary. A second recorder tab is read-only by default.

Wait for complete IndexedDB transaction success before reporting local save. Evaluate strict durability support in the chosen wrapper/browser combination; document actual guarantees rather than promising survival of every power/device failure.

## Limits and deferred backup

Request persistent browser storage where supported and handle refusal. Storage estimates are approximate. Unsynced changes exist only on the device until uploaded and can be lost if its storage is cleared or the device fails.

Manual export/import, automatic backup and recovery tooling remain in the backlog at the user's request. They are not prerequisites of the current implementation phases. Acknowledged server storage improves recovery but is not itself a complete backup policy.

Source: [Browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [IndexedDB transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction).
