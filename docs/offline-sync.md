# Offline persistence and synchronization

## Authority and local durability

PostgreSQL is authoritative for accepted shared records. The Next.js API is the access boundary, not itself a database.

IndexedDB is the browser's durable working store for downloaded account/game data, local changes, the outbox and undo history. It is suitable for this production role, with storage limits that must be handled explicitly. It is not a replacement for server storage or a guarantee against device/browser data loss.

Offline operation requires more than buffering events. The recorder also needs the game's roster, starters, period settings, event history and local corrections to reconstruct what the observer sees. Keep prepared match data available after successful upload; do not immediately delete it because the queue is empty.

## /offline scope and preparation

Use `/offline` as the explicit limited offline entry. It supports selecting a prepared game, recording, lineup movements, clock controls, timeline, undo and historical corrections using saved data. Account/team/player management, game creation, roster expansion and uncached remote browsing require the online application.

Prepare games online. Store the account-scoped game, roster snapshots, starters, period settings, confirmed revision and event history locally. Mark a game ready only after its data and the required cached assets are available. Keep that prepared baseline and subsequent local changes through reload.

An unknown/unprepared game ID shows an unavailable message with an online preparation instruction; it does not attempt to invent roster/configuration or create a game offline. Validated selection/query parameters cannot bypass local account scope.

## Recording writes

Use the same local-first recording path online and offline:

1. Validate the completed UI command.
2. Commit local changes, operation history and its outbox entry in one IndexedDB transaction.
3. Show saved locally and clear the visible creation draft.
4. Attempt upload when connectivity and authentication permit.
5. Commit the accepted command and idempotency receipt in one PostgreSQL transaction.
6. Persist acknowledgement locally and reconcile confirmed data without overwriting later pending work.
7. Show synced.

This avoids an unreliable split between direct online writes and a separate offline-only queue. It does not create a distributed transaction. A server rejection can leave a valid local recording needing explicit reconciliation.

## Local records

Keep account-scoped stores for entities, confirmed versions, pending projections, operation history, outbox commands, sync cursors and persisted clock state. The exact table layout is selected during the first recording slice.

Maintain a confirmed server base separately from pending local intent. The visible projection applies pending commands over that base. Receiving an older acknowledgement must not replace a newer local edit. Test that behavior before adding broad UI features.

Zustand may display pending/error summaries but does not own the only copy of any mutation. An event pending upload is a committed local event, not an invisible creation draft.

Generate stable event/command IDs before local writes so later edits and retries refer to the same record. Queue recording, clock and correction commands for already prepared games. Deliver an event creation before dependent edits or inverses. Game/roster creation is an online operation followed by local preparation, not an offline outbox feature.

## Command protocol

Use versioned HTTP contracts with, at minimum:

- Stable command ID, account scope and schema version.
- Aggregate identity and explicit command kind/payload.
- Expected confirmed revision or a declared dependent revision chain.
- Stable entity IDs and local ordering metadata where required.

For the first recorder protocol, serialize mutations per game and use an expected game-aggregate revision. A queued chain can expect successive revisions when each accepted command increments the aggregate once. The initial expected revision comes from the confirmed base; do not silently advance it from an unrelated remote change to bypass a conflict.

Prepared games have a confirmed server identity/revision before offline recording starts. Online team/player/game management has its own mutation scope. Do not create one global account revision that makes unrelated games conflict.

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

Do not silently apply last-write-wins to movement history, starter changes, event edits or clock corrections. Working V1 policy is one active recorder per game; a second device can read and refresh accepted data. Concurrent writing is detected and resolved explicitly, not advertised as collaboration.

## Undo and historical edits

Persist undo and inverse commands locally. Serialize inverse operations after their original operation, even if its acknowledgement was lost. A server may already have accepted it.

Undoing an accepted event requires another authorized, revision-checked API mutation. Do not remove only the local row and leave the server event intact. Preserve tombstones in download and upload flows.

The historical-correction command distinguishes explicit accepted contradictions from invalid live entry. Both sides run the same replay diagnostics. Do not infer automatic substitution or card consequences during sync.

Both sides require game time for player-in/out, including corrected movements. Reject commands that omit or clear it; other event types may remain untimed.

## Authentication and account isolation

- Use an established authentication integration; provider selection precedes the account/API phase.
- Keep online session credentials out of Zustand, IndexedDB and exported domain records.
- Authorize every handler/service against the current session and account scope.
- Include account scope in local keys, queues, receipts and queries.
- Initial sign-in and uncached account provisioning require connectivity.
- Session expiry must not erase data or prevent an already prepared local match from being recorded offline.
- Explicit sign-out locks local data views and clears transient drafts. A different user cannot see or upload another account's pending commands.
- Offline access cannot check fresh revocation. Upload always revalidates current access.

Detailed shared-device retention and local unlock policy must be selected before account-switching release, not invented inside a UI component.

## Service worker and routing

Cache application assets separately from user records. Cache `/offline` and its complete required asset graph, including recorder/timeline controls, fonts and both language catalogs. User data remains in account-scoped IndexedDB. Local language switching requires no translation download or server refresh.

Prove all of these against a production build:

- Reload a prepared game with the network disabled.
- Follow an account/game recorder URL offline through its fallback.
- Open `/offline` directly and select a prepared game. Reject unknown/unprepared game IDs without a write.
- Continue after the online session expires, without an auth redirect breaking local boot.
- Move between required offline views without requesting an unavailable server component payload.
- Keep one account's cached data unavailable to a different signed-in account.
- Switch English/Portuguese offline without losing a draft, clock or pending records.

Do not cache arbitrary personalized HTML, API responses or authentication redirects to solve routing failures. The offline shell itself contains no private server-rendered account data.

Show offline readiness only after required assets and match data are available. First-ever access to an uncached application cannot work offline.

Use prompted service-worker updates. Defer activation/reload while recording, while the add-event UI is open or while a local transaction is in progress. Keep old required assets until a safe activation point.

## Migrations and local concurrency

Version IndexedDB schemas, SQL migrations and wire contracts independently. Test existing games, pending commands and undo history through upgrades. Do not reset storage to recover from a failed migration.

Handle blocked IndexedDB upgrades with an explanation about other tabs. Use transactional revision checks as the correctness boundary; tab notifications or locks are supplementary. A second recorder tab is read-only by default.

Wait for complete IndexedDB transaction success before reporting local save. Evaluate strict durability support in the chosen wrapper/browser combination; document actual guarantees rather than promising survival of every power/device failure.

## Limits and deferred backup

Request persistent browser storage where supported and handle refusal. Storage estimates are approximate. Unsynced changes exist only on the device until uploaded and can be lost if its storage is cleared or the device fails.

Manual export/import, automatic backup and recovery tooling remain in the backlog at the user's request. They are not prerequisites of the current implementation phases. Acknowledged server storage improves recovery but is not itself a complete backup policy.

Source: [Browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), [IndexedDB transaction durability](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase/transaction).
