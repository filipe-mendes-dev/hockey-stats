# Persistence and synchronization review

Reviewed on 2026-10-30 against checkout `00ae733`. This is a source review of the browser database, local services/repositories, transport contracts, coordinator, authenticated sync routes, SQL services/repositories/schemas, removal, account cleanup, sharing and deployment recovery documentation. No application behavior or requirements change in this document. Proposed fixes require a separate implementation scope.

The architecture provides atomic local saves, revision-checked server writes and durable deduplication. Those are sound foundations for the documented personal-device, one-observer prototype. It does not yet provide complete conflict recovery, automatic convergence after every failure, shared-device confidentiality or verified disaster recovery. I found a concrete membership-convergence bug and several recovery/availability gaps. I did not identify a cross-account write bypass in the inspected sync paths. This is not a penetration-test certification.

Findings below distinguish code defects, missing recovery workflows, documented product limits and deployment controls that still need verification. Failure sequences are derived from source; they were not executed against browser or server data during this review. Existing tests were not read, added, modified or run.

## How the system works

| Component               | Responsibility and boundary                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| IndexedDB through Dexie | Working records online and offline, local Undo history, owner metadata, deletion markers and the durable outbox.     |
| Local feature services  | Validate workflows and commit all affected records plus immutable commands in one transaction.                       |
| Local repositories      | Read/write stored rows. They depend on the caller's transaction for multi-store atomicity.                           |
| TanStack Query          | Temporary views of durable data. Invalidating a query refreshes the UI; it does not synchronize databases.           |
| Zustand recorder draft  | Uncommitted input. A draft is not a durable event and does not have the saved-event guarantee.                       |
| Foreground coordinator  | Serializes delivery across same-origin tabs, sends commands, applies acknowledgements, then downloads accepted data. |
| Authenticated API       | Derives the owner from the session, checks the expected account, validates commands and checks mutation origin.      |
| PostgreSQL              | Authoritative accepted shared state, operation receipts and terminal deletion markers.                               |
| Service worker          | Caches generic application files for offline use. It does not deliver the outbox or cache sync responses.            |

A normal event follows this sequence:

1. The local service validates the current Match and chronological history.
2. One IndexedDB transaction inserts the event, advances the Match revision, saves Undo metadata and inserts its command. The UI reports success only after the service's transaction resolves.
3. Local notifications invalidate views and wake delivery. The outbox survives a lost notification or reload.
4. The coordinator takes `benchline.players-sync`, the shared Web Lock, and reads operations in local sequence order. It skips blocked commands and commands with unresolved dependencies.
5. It sends one command using the original operation ID and payload. The request carries the session cookie and `X-Expected-User-Id`.
6. The route validates origin, content type, session, account and runtime schema.
7. A SQL transaction reserves the owner/operation receipt, takes an entity advisory lock, checks deletion/revision/domain rules, and changes the data. Any failure rolls back the reservation and mutation together.
8. An identical accepted operation replays its original receipt. Reusing the operation ID with different validated content returns `operation_conflict`.
9. One IndexedDB transaction applies the acknowledgement and removes only that operation. It rechecks the owner and protects newer local revisions and deletion markers.
10. The coordinator downloads deletion markers, Players, Teams, memberships and complete Match recordings. Pending and blocked entities protect their local versions from ordinary downloads.

Evidence: [local event service](../src/client/features/matches/matchEvents.service.ts), [coordinator](../src/client/features/sync/syncCoordinator.ts), [server command service](../src/server/features/sync/commands.service.ts), [acknowledgement/download service](../src/client/features/sync/syncResults.service.ts). Dexie's transaction promise resolves at commit and rejects on transaction failure; repository calls inside the transaction participate in its scope. See [Dexie transactions](<https://dexie.org/docs/Dexie/Dexie.transaction()>).

### The guarantees to describe accurately

- Delivery uses retries and may send the same command multiple times. It is best described as at-least-once delivery attempts with an idempotent accepted database effect, while the receipt remains available. A blocked command or closed application has no eventual-delivery guarantee.
- There is no transaction spanning IndexedDB and PostgreSQL. Two separate atomic transactions, durable intent and receipt replay bridge the failure window.
- `operationId` identifies one immutable delivery intent. `entityId` selects its aggregate. Local `sequence` orders this browser dataset. `expectedRevision` detects stale state. These values solve different problems.
- Revisions establish accepted entity ordering. The protocol does not choose a winner by comparing wall-clock timestamps. It does impose timestamp monotonicity checks, which have separate drift risks.
- Server acceptance is serialized per aggregate. The whole account and all HTTP downloads are not one global serializable snapshot.
- The Match revision covers setup, controls, events and Undo together. Two devices adding different events still compete for that same revision.
- This is not CRDT replication or automatic event merging. Convergence depends on supported schemas, eventual successful delivery/download and explicit recovery of blocked work.

## High-priority findings

### F1. Duplicate memberships can repeatedly break subsequent downloads

Severity: high availability/convergence defect. Confidence: direct code-path analysis, not runtime reproduction.

Two offline devices can independently add the same Player to the same Team. Each generates a different membership UUID. The first upload succeeds; the second returns `membership_conflict` and becomes blocked. Its local membership remains.

During the second device's download, protection checks only pending/blocked membership IDs. The accepted remote ID differs from the local blocked ID, so `table.put(remoteMembership)` runs. IndexedDB's unique `[teamId+playerId]` index rejects that insertion. The membership transaction rolls back and the coordinator exits before Match downloads. Retry repeats the same sequence.

Evidence:

- [teamPlayers.service.ts](../src/client/features/teams/teamPlayers.service.ts), lines 37-66, checks only the local dataset and generates a random membership ID.
- [team_players_schema.ts](../src/server/db/team_players_schema.ts), line 38, enforces SQL uniqueness for the pair.
- [database.ts](../src/client/storage/database.ts), line 97, enforces the equivalent IndexedDB uniqueness.
- [syncResults.service.ts](../src/client/features/sync/syncResults.service.ts), lines 274-290, protects and looks up by ID, then puts the remote row.
- [syncCoordinator.ts](../src/client/features/sync/syncCoordinator.ts), lines 166-183, downloads memberships before Matches.

Proposed fix: detect pair collisions before writing downloaded memberships. Preserve the losing local membership and immutable commands in an inspectable conflict record, and allow unrelated records/downloads to continue. Resolution must explicitly adopt the accepted membership and, if desired, issue a fresh update for its role/number against the accepted revision. Do not rewrite the old command's ID or silently choose between different field values. Simply skipping the conflicting row prevents the exception but leaves reconciliation unfinished.

### F2. Revision conflicts are preserved but have no recovery workflow

Severity: high recovery gap, already acknowledged in product scope.

Example: devices A and B both hold Match revision 10. A uploads an event expecting 10 and the server advances to 11. B has its own event expecting 10 and may already have further offline commands expecting 11, 12 and 13. B's first upload returns 409 and becomes blocked. Later commands wait behind it. Ordinary downloads skip the whole Match, including the accepted remote event history.

Manual Retry does not unblock or revalidate the command. It starts another cycle that skips blocked entries again. Further local recording can extend the divergent chain because local workflows do not require an empty conflict set.

Evidence: [syncCoordinator.ts](../src/client/features/sync/syncCoordinator.ts), lines 105-138; [dependencies.ts](../src/client/features/sync/dependencies.ts), lines 10-16; [syncResults.service.ts](../src/client/features/sync/syncResults.service.ts), lines 225-235; [SyncStatusPanel.tsx](../src/client/features/sync/SyncStatusPanel/SyncStatusPanel.tsx), lines 57-66.

Deletion conflicts need special treatment. Local deletion immediately installs a terminal marker and removes Match/membership data. If the server rejects its expected revision, the local marker remains and continues suppressing downloads. The command is retained, but there is no cancel/recover flow for that provisional local deletion. See [removal.service.ts](../src/client/features/removal/removal.service.ts), lines 25-87.

Proposed fix: build conflict inspection before automatic merging. Capture a remote snapshot separately without overwriting local work, show the blocked operation and affected chain, and preserve/export local intent before any discard. Let the user accept remote state or explicitly reconstruct selected intent against its latest revision. Revalidate the entire resulting Match history and generate new operation IDs. Supersede old commands only through an atomic, recorded resolution. Distinguish rejected provisional local deletion markers from accepted terminal server markers; an accepted server deletion must remain terminal.

Changing only `expectedRevision`, resetting status to pending, deleting the database or applying last-write-wins would hide or lose intent. A Match event can affect lineup, score, penalties, chronology and later Undo eligibility.

### F3. One invalid server recording prevents the full Match download

Severity: high availability/recovery gap. The repository documents a real instance, whose current production status was not verified here.

The server loads every owned Match and all events, validates every recording, and returns one collection. A mapping or validation error in one recording throws before any Match response is returned. The handler maps every unexpected exception to `503 unavailable`, and the client retries without identifying the bad recording or failing invariant.

[backlog.md](backlog.md), line 12, records a manual historical repair that advanced `updatedAt` while leaving an earlier `completedAt`. The completed-Match validator requires those values to be equal. The documented guarded metadata correction to revision 658 was validated locally, but production execution and successful Retry remain unconfirmed. This review did not execute that correction.

Evidence: [match.schema.ts](../src/domain/matches/match.schema.ts), lines 110-117; [matches.repository.ts](../src/server/features/matches/matches.repository.ts), lines 26-51; [matchEvents.service.ts](../src/server/features/matches/matchEvents.service.ts), lines 145-160; [Match download route](../src/app/api/sync/matches/route.ts), lines 7-19.

Proposed fix: first verify the documented repair through the complete mapping/download path, with safe diagnostics. Record stage, correlation ID, safe entity identifier and validation issue codes without complete recordings or credentials. A later per-record or paginated recovery contract could deliver healthy recordings and explicitly report unavailable ones. It must not silently omit invalid data or mark partial results fully synchronized. Keep snapshot/events atomic per Match and keep validation strict.

### F4. Backup rollback can leave devices silently divergent

Severity: high disaster-recovery gap. Conditional scenario, not a claim that a restore has occurred.

Suppose a device has acknowledged revision 20 and removed its commands. PostgreSQL is restored to a backup containing revision 15, or lacking that entity entirely. The device has nothing to push. Download merging refuses the older revision and never interprets absence as deletion. A cycle can finish with zero pending/blocked operations and an up-to-date message while local and server state differ.

Restoring tombstones or receipts from a different point in time creates further risks. Missing tombstones weaken removed-ID protection; missing receipts remove exact replay knowledge. Restoring domain tables without the corresponding protocol metadata is unsafe.

Evidence: [syncResults.service.ts](../src/client/features/sync/syncResults.service.ts), lines 241-244 and 280-290; [syncCoordinator.ts](../src/client/features/sync/syncCoordinator.ts), lines 103-105 and 184-188. [deployment.md](deployment.md), lines 83-86, already requires backup/restore and update-recovery work before important data or invited users.

Proposed fix: rehearse coherent whole-database backups/restores, including authentication, receipts, tombstones and shares. Define recovery point/time objectives. After rollback, pause normal claims of convergence and explicitly reconcile surviving device data. Consider a server dataset generation changed by the restore procedure, tracked on clients, to detect this condition. An old backup alone cannot announce that it is old. Do not automatically upload every local row or clear devices during recovery.

## Medium-priority findings

### F5. One malformed outbox row prevents the queue from loading

Severity: medium availability/recovery gap.

`listOutboxOperations()` parses the complete queue with a throwing `rows.map`. A single invalid or no-longer-supported stored command makes the whole call reject. Counts, dependency checks, synchronization and the sign-out unsynced check depend on that call. A schema failure preserves data, but currently provides little route to recover it.

Evidence: [outbox.repository.ts](../src/client/features/sync/outbox.repository.ts), lines 5-11; [SignOutDialog.tsx](../src/client/features/account/SignOutDialog/SignOutDialog.tsx), lines 29-40 and 96-97. Migration parsing also intentionally aborts rather than deleting invalid data in [database.ts](../src/client/storage/database.ts), lines 88-115.

Proposed fix: distinguish an unreadable queue from an empty queue. Preserve raw failed records with diagnostic metadata and make them exportable/inspectable. Do not automatically skip an unknown command and execute potentially dependent commands: its dependencies may be unknowable. Allow independent work only where isolation can be established. A failed database upgrade needs an explicit recovery route that does not require opening the latest schema successfully.

### F6. A failing upload prevents unrelated downloads

Severity: medium availability limitation.

Only 400/409/415/422 are classified as permanent command rejection. Other failures, a timeout, a malformed acknowledgement or a local acknowledgement failure abort the cycle before deletion and entity downloads. A permanently failing command that keeps returning 503 can therefore prevent incoming changes indefinitely, although local work remains durable. A proxy's 413 is also currently retried as a transient failure. An origin mismatch returns 403 and repeatedly fails until configuration is fixed.

Evidence: [syncCoordinator.ts](../src/client/features/sync/syncCoordinator.ts), lines 124-150; [sync.transport.ts](../src/client/features/sync/sync.transport.ts); [command route](../src/app/api/sync/commands/route.ts), lines 14-18.

Proposed fix: distinguish command-specific permanent failures, protocol/configuration failures and transient infrastructure failures. Separate safe pull opportunities from push progress while retaining owner checks, pending protection and deletion handling. A timeout is an unknown acceptance outcome, so retain and replay the exact operation. Do not send dependent writes past it. Separate scheduling and failure isolation can use the existing coordinator; a new queue library is unnecessary.

### F7. Sync resource limits are not enforced in the application

Severity: medium security/availability finding. Rule IDs: `NEXT-DOS-001`, `NEXT-INPUT-001`. Edge protections were not inspected live.

The authenticated command route calls `request.json()` without an application byte bound. Player/Team names and several optional text fields have no maximum length in transport entity schemas. Full collection downloads and receipt JSON also have no account-size limit. An authenticated user or compromised account can submit/store disproportionate data and repeatedly trigger expensive full-history reads and validation. Match call-ups do have a ten-player bound; this finding does not claim all arrays are unbounded.

Evidence: [command route](../src/app/api/sync/commands/route.ts), lines 20-25; [player.schema.ts](../src/domain/players/player.schema.ts), lines 6-12; [team.schema.ts](../src/domain/teams/team.schema.ts); [receipt insertion](../src/server/features/sync/receipts.repository.ts), lines 33-40; [Match recording download](../src/server/features/matches/matchEvents.service.ts), lines 145-160.

Proposed fix: define reasonable domain text limits, bound actual request bytes before parsing, add owner/IP throttling and account resource budgets, and return a supported actionable error. A `Content-Length` check alone does not bound a chunked request. Verify deployed proxy controls before claiming they exist or are absent. Keep this scoped to sync; the authentication library has its own behavior and was not load-tested.

### F8. Clock drift can affect acceptance and live clock handoff

Severity: medium consistency/usability limitation, already on the backlog.

Timestamps originate on clients and are checked for monotonicity without a future-skew policy. An accidentally far-future timestamp can be accepted at the correct revision. A stale device may then produce a command with an earlier timestamp and receive a conflict. A device that downloads that timestamp uses `Math.max` to avoid going backward, which preserves monotonicity but propagates the future value. A saved `runningSince` ahead of another device's clock makes its projected elapsed time stop advancing until that wall clock catches up. Moving the OS clock forward can jump elapsed time toward the period cap.

Evidence: [player.schema.ts](../src/domain/players/player.schema.ts), lines 10-15; [server Player update](../src/server/features/players/players.repository.ts), lines 65-67; [local Player update](../src/client/features/players/players.service.ts); [matchControl.ts](../src/domain/matches/matchControl.ts), lines 33-44 and 64-89.

Proposed fix: keep revisions as concurrency authority and server acceptance time separate from captured occurrence time. Diagnose skew and define a correction policy compatible with legitimate offline work. A monotonic in-session clock can reduce local jumps, but reload/device handoff still needs a persisted anchor and explicit reconciliation. Do not silently clamp historical event times or replace them with upload time.

## Deliberate limits and security boundaries

### Local access and account ownership

The metadata owner prevents accidental dataset mixing. It is not a password, signature or server authorization token. [authenticateSync](../src/server/features/sync/sync-http.ts), lines 14-19, authorizes using the current session and checks the expected owner independently. Parent references and mutations also check SQL ownership. Changing local metadata does not grant access to another user's server rows.

Local records are available after session expiry by design. [LocalAccountSetup.tsx](../src/client/features/account/LocalAccountSetup/LocalAccountSetup.tsx), lines 33-36, opens an existing local dataset without requiring a fresh online session. Disabling/deleting an account cannot remotely erase an offline copy. A different logged-in account can encounter the previous dataset locally even though uploading it under that account is rejected.

No application-level encryption/unlock protects the dataset or outbox. Same-origin malicious JavaScript can read or modify it and can act using the current session. Runtime validation rejects malformed values; it cannot prove a valid-looking event was honestly observed. Adding command signatures with a key available to the same compromised JavaScript would not solve that threat. This matches [OWASP's IndexedDB guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#client-side-databases).

For the current product, describe a trusted personal-device boundary. Shared-device access, encryption and offline unlock require an explicit key/access policy. Verify deployed cookie flags and browser security headers. No raw HTML or dynamic-code sink was found in the searched application source, but that does not establish immunity to XSS or dependency compromise. General application CSP enforcement was not visible in `next.config.ts`; edge headers were not checked. A nonce policy would also need to accommodate the precached static shell rather than assuming fresh per-request HTML.

### Deletion, receipts and retention

Server deletion markers prevent a new command from recreating a removed ID. Old accepted receipts replay before deletion guards and do not execute the mutation again. Client markers stop ordinary acknowledgements/downloads from recreating removed rows.

Players/Teams remain archived for historical references. Match/membership rows are physically removed, but receipts retain command/result JSON and can retain historical content from those entities. Operational deletion therefore is not secure erasure. Account deletion cascades receipts through their owner foreign key. Do not add receipt/tombstone TTL cleanup without defining offline-device lifetime, replay guarantees, recovery and any generation/cursor reset policy.

Evidence: [commands.service.ts](../src/server/features/sync/commands.service.ts), lines 75-105; [sync_schema.ts](../src/server/db/sync_schema.ts); [removal service](../src/server/features/removal/removal.service.ts); [acknowledgements](../src/client/features/sync/syncResults.service.ts), lines 86-88 and 132-134.

### Transactions, tabs and remote concurrency

Overlapping IndexedDB write transactions serialize local mutations. Revision checks reject stale form submissions for edits/controls. Event addition deliberately reads current state inside its transaction, so two tabs can record two distinct events rather than gaining exclusive recorder ownership. Web Locks serialize sync cycles, not the recorder itself, and cannot coordinate separate devices.

On the server, receipt uniqueness, advisory entity locks, row locks, expected revisions and parent share locks have distinct purposes. Parent share locks prevent deletion while new references are being accepted. Multi-entity locking can still deadlock; PostgreSQL aborts one transaction, the API returns 503, and the durable command can retry. A 15-second browser timeout does not cancel or roll back a SQL transaction already running. Explicit database statement/lock timeouts are not configured in [db/client.ts](../src/server/db/client.ts), line 8; server-level settings were not inspected. See [PostgreSQL locking](https://www.postgresql.org/docs/current/explicit-locking.html).

Match snapshot/event downloads use one repeatable-read, read-only transaction. This prevents assembling the Match at one revision with events from a later committed revision. Players, Teams, memberships and deletion markers use separate requests, so a sync cycle may temporarily observe different committed points in time across collections. The next successful cycle normally repairs that lag; the membership collision and blocked-work exceptions above still apply. See [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

### Storage durability and cleanup

Quota/transaction failure rolls back the local workflow. Persistent storage requests reduce browser eviction risk if granted; they do not create a backup or stop explicit user deletion. The browser may refuse persistence. Unsynchronized work is unrecoverable if its only browser storage disappears. A PostgreSQL volume survives container recreation but does not protect against disk loss or a mistaken database deletion. See [StorageManager.persist](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist).

Explicit sign-out warns about all queued entries, stops sync, revokes the session, then deletes IndexedDB and navigates. It intentionally deletes unsynced work after confirmation. Offline sign-out currently fails and retains local data. Cleanup failure remains visible. Writes are not globally frozen across tabs during the initial session-revocation request, so the displayed queue count is a snapshot rather than a cross-tab freeze. Any future safer cleanup policy should quiesce writers before destructive cleanup and define what happens to newly committed work.

### Compatibility and scale

Database schema version 10, command versions, acknowledgement version 1 and worker-cache versions are independent. Supporting an old command is different from supporting an old client reading new downloads. Old cached clients may fail on a new event kind or reason and require an update. The worker waits for tabs/windows to close so it does not reload an active recording.

Event versions 1-7 retain recording-order validation paths; versions 8-9 apply chronological validation. A supplied version selects a supported contract, not a trusted device identity. The server cannot infer that every old-version submission really came from an old app. Supporting weaker historical semantics is a deliberate compatibility tradeoff, not a claim that all accepted writes meet today's strict chronology rules. Exact accepted receipts should remain replayable even if new-write compatibility is tightened later.

Current scale costs include full-account downloads after write-triggered cycles and every visible 60-second poll, serialized duplicate polling from multiple tabs, repeated full queue reads/dependency scans during delivery, repeated history replay for each Match event and unbounded receipt/tombstone retention. The queue path can do quadratic work across a large backlog. These are source-level cost observations, not measured capacity limits. Start by coalescing wakeups and separating upload/download cadence, then measure realistic data before adding cursors, pagination or batching. A changed-only cursor must be server-issued and cover deletions; client `updatedAt` is not a safe cursor.

## Interview failure-scenario checklist

| Scenario                                                       | Current outcome                                                                 | Qualification or next action                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Crash before local commit                                      | The workflow does not commit partially.                                         | The open draft may be lost because it is temporary.                                                        |
| Crash after local commit, before HTTP                          | The outbox retains the command.                                                 | Delivery resumes when the app is running and able to sync.                                                 |
| Server commits but response is lost                            | The original ID retries and receipt replay avoids another mutation.             | Requires retaining the receipt.                                                                            |
| Local acknowledgement transaction fails                        | The command remains although SQL may have committed.                            | Replay applies the durable result later.                                                                   |
| SQL mutation fails after receipt reservation                   | Both roll back in the SQL transaction.                                          | The reservation is not a false success receipt.                                                            |
| Identical command arrives concurrently                         | Receipt uniqueness serializes acceptance/replay.                                | No second accepted effect.                                                                                 |
| Same operation ID, changed payload                             | The server returns `operation_conflict`.                                        | Do not mutate commands to fix conflicts.                                                                   |
| Different operation IDs for one human double-click             | Generic deduplication does not identify the same intent.                        | Event creation additionally uses stable draft event/operation IDs; other creates need UI/input safeguards. |
| Edit occurs while an older response is in flight               | Acknowledgement revision checks preserve the newer local revision.              | Only the acknowledged operation is removed.                                                                |
| Two devices edit the same revision                             | One can succeed; the other blocks.                                              | F2, no automatic merge.                                                                                    |
| Two devices create the same membership pair                    | One blocks and the accepted download can violate the local unique index.        | F1.                                                                                                        |
| Two tabs record simultaneously                                 | Local transactions serialize writes; both may record events.                    | No exclusive recorder lock.                                                                                |
| A required parent create is blocked                            | Dependent membership/setup commands wait.                                       | Independent entities can continue after classified permanent rejections.                                   |
| First upload repeatedly times out or returns 503               | The cycle stops before pulls.                                                   | F6, a browser timeout does not prove rejection.                                                            |
| Session expires                                                | Local use continues and sync requests sign-in.                                  | No credential is saved in the outbox.                                                                      |
| A different account signs in                                   | API account checks reject mixing.                                               | Local confidentiality still follows the personal-device policy.                                            |
| Admin disables/deletes an offline user's account               | Future server access is rejected; the local copy remains.                       | Revocation is not remote erasure; already-started requests may race revocation.                            |
| Server deletes a Match while another device has pending events | The marker removes the recording and conflicting commands remain blocked.       | Preserve command intent for inspection; there is no automatic restoration.                                 |
| Device locally deletes a stale revision                        | Local removal stays visible, while SQL deletion can reject.                     | F2, provisional marker recovery is missing.                                                                |
| Old create receipt replays after deletion                      | The receipt returns its old result without reinserting SQL data.                | Local deletion guards prevent resurrection.                                                                |
| A record is absent from a download                             | The client keeps its local record.                                              | Only explicit markers mean deletion.                                                                       |
| Remote deletion occurs between collection requests             | The device may temporarily retain a stale record.                               | The following successful marker download repairs it.                                                       |
| Undo before the create uploads                                 | Ordered create and Undo commands both upload.                                   | The final event is a tombstone; order is not reused.                                                       |
| Undo after upload/reload on the same device                    | The local journal can retain eligibility.                                       | Only the latest active event and valid remaining history qualify.                                          |
| Undo on a different device                                     | Downloaded events do not bring local Undo ownership/history.                    | Cross-device Undo is deferred.                                                                             |
| A malformed outbox row or unsupported queued version exists    | Whole-queue parsing fails.                                                      | F5, preserve/export rather than reset.                                                                     |
| One server recording violates its schema                       | The full Match endpoint returns 503.                                            | F3, inspect and repair through the full download path.                                                     |
| Application closes or mobile OS suspends it                    | Foreground sync stops or pauses.                                                | No Background Sync delivery guarantee.                                                                     |
| Web Locks are unavailable                                      | Local work remains; sync reports unsupported.                                   | There is no fallback synchronizer.                                                                         |
| `navigator.onLine` is false despite a usable route to the app  | The coordinator returns offline, even on forced retry.                          | The current implementation treats the hint as a gate.                                                      |
| Browser quota, eviction, user clear or lost device             | Atomic failures preserve prior commits; deletion/loss can remove unsynced work. | Persistence permission and SQL backups do not recover never-uploaded data.                                 |
| Sign-out with queued work                                      | Confirmation warns, then successful cleanup deletes it.                         | Sign-out is not a safe conflict-recovery shortcut.                                                         |
| Old application tab meets new server data                      | Its download schema may fail.                                                   | Update compatibility and schema deployment need explicit acceptance.                                       |
| Clock moves backward/forward                                   | Monotonic clamps reduce backward writes; projected time can stall/jump.         | F8.                                                                                                        |
| PostgreSQL is restored behind a healthy device                 | The outbox may be empty while local and remote diverge.                         | F4.                                                                                                        |
| Shared Match is deleted offline                                | The public link remains until server deletion is accepted.                      | Online revocation is a separate server-only action.                                                        |
| An attacker modifies IndexedDB                                 | Server auth, references, revisions and rules still apply.                       | A valid-looking command under the owner's active session can still alter that owner's data.                |

## Proposed order of work

These are recommendations, not authorization to implement a new phase.

1. Verify the already documented Match-download repair and add safe stage/validation diagnostics. This addresses an observed operational failure without weakening invariants.
2. Prevent the membership-pair download failure and expose its unresolved conflict. Keep unrelated synchronization progressing.
3. Add conflict inspection and a preservation/export path, then explicit resolution for revision chains and rejected local deletions. Do not start with automatic Match merging.
4. Rehearse whole-database backup/restore and device reconciliation before relying on the system for important recordings.
5. Add bounded requests/text, verified throttling and safe handling of permanent transport/configuration failures. Define unreadable-queue recovery.
6. Separate push/pull cadence, coalesce tab/wakeup polling, measure backlog/history costs, and then choose a cursor/retention design if justified.
7. Address clock handoff and recorder exclusivity if use expands beyond one observer. Change local unlock/encryption only if the personal-device threat model changes.

## Interview answers

**How would you explain the design in one minute?**

The app works from IndexedDB online and offline. Each save atomically commits both the local change and its immutable outbox command. A foreground synchronizer sends commands with stable operation IDs and expected revisions. The server authenticates the owner and commits a receipt with each accepted change in the same SQL transaction. If a response is lost, replay returns the receipt instead of applying the change again. The browser atomically applies that acknowledgement and removes the command. Downloads update accepted data while preserving pending local work. Revision conflicts remain visible and blocked; explicit recovery is the main unfinished workflow.

**Why an outbox instead of calling the API and then saving locally?**

A local transaction prevents a saved event with no delivery intent and prevents delivery intent with no saved event. Saving only after HTTP would make offline recording impossible. Saving locally and then separately enqueueing would introduce a crash window between the two writes.

**Is this exactly-once synchronization?**

No. Requests can repeat. Retained owner-scoped receipts make each accepted command's SQL effect idempotent. Browser-to-server convergence still depends on successful delivery, supported protocols, retained metadata and resolving conflicts.

**Why not use last-write-wins or just retry with the latest revision?**

One Match event can change eligibility for later events. A later timestamp or higher local revision does not establish which history is correct. Keep both intentions, inspect the accepted remote history and replay selected intent only after domain validation, using new operation IDs.

**Why keep the receipt and mutation in the same transaction?**

Otherwise a receipt could claim a failed mutation succeeded, or a successful mutation could lack deduplication metadata. Both conditions break safe retries.

**Why both Web Locks and SQL locks?**

Web Locks reduce competing upload cycles from one browser origin. SQL locks and revision checks enforce correctness across separate browsers/devices and requests that bypass the UI. Local database transactions protect browser writes independently.

**Is the outbox secure enough?**

It provides a sound delivery mechanism within the personal-device prototype. It does not itself authorize API calls or provide confidentiality. The server revalidates every command and derives ownership from the session. Remaining work includes request/resource controls, explicit recovery, deployment verification and a different access/key policy if shared-device protection becomes a requirement.

**Is the event history an event-sourced system?**

Match statistics and eligibility derive from recorded events, and Undo keeps tombstones. The application also persists mutable Match snapshots, entities and receipt payloads. It does not reconstruct every state change from one universal event log, so calling the whole persistence layer event-sourced would overstate the design.

## Review validation

This review traced transaction boundaries, command dispatch, dependency checks, receipts, acknowledgement guards, unique indexes, owner checks, deletion handling and schema compatibility directly in source. Framework/platform semantics were checked against Dexie, PostgreSQL, MDN and OWASP documentation linked above. Repository docs corroborate several deferred limits and the historical download failure.

Documentation formatting, local file links and whitespace are checked for this added document. Application builds, live endpoint checks, production service-worker behavior, hostile-client probes, load checks, backup restoration and browser failure injection were not performed. No production-state claim or runtime reproduction is implied by a source-derived scenario. No tests were read or run, as required by the repository policy.
