# Phase 2 local storage increment

Date: 2026-10-16. Branch: `feat/phase-2-local-storage-foundation`. The storage increment is complete. Phase 2 remains in progress because local placeholder navigation and physical-device/browser checks remain pending.

## Implemented behavior

- Pin Dexie 4.4.6 as the only new dependency. No React database wrapper or generic repository framework is needed for initialization.
- Initialize IndexedDB only while the public `/app` entry is mounted, without authentication or an API request. Close the mounted connection on unmount.
- Define Dexie schema version 1 for database `benchline-stats`, containing only `metadata`, keyed by `key`. Dexie exposes this as native IndexedDB version 10; use Dexie's version declarations for future upgrades.
- Store one `workspace` row with `workspaceId`, a client-generated UUID, and `createdAt`, a real-world millisecond timestamp. This is non-secret local metadata, separate from account ownership and authentication credentials.
- Create the identity in a read/write transaction. Concurrent first launches serialize through the transaction and retain one identity. Existing rows undergo runtime validation and an unchanged rewrite to verify write access on every launch. Readiness waits for transaction completion.
- Preserve invalid existing metadata and failed writes. Initialization never deletes or resets the database to recover from an error. A missing row on an empty installation can be created normally.
- Show translated preparing, unsupported, failed, blocked and closed states. Failed initialization and closed connections offer retry. A blocked upgrade resumes when the blocking connection closes. External version changes close the old connection without forcing reload.
- Report offline-ready only when the active worker's required files are verified and the workspace transaction succeeds. File-cache and storage status remain separate when either is unavailable.
- Check/request persistent storage outside the database transaction. Report granted, denied, unavailable or failed persistence checks separately. Denial or unavailable persistence APIs do not disable usable IndexedDB.
- Request strict transaction durability through Dexie's `chromeTransactionDurability` option. This is a browser-dependent transaction setting, not a guarantee against power loss, explicit site-data deletion or device loss.

No hockey tables, CRUD, recorder UI, account binding, outbox, synchronization or sign-out cleanup are implemented. The existing service-worker activation and authentication behavior is unchanged. Future domain records should use the established workspace identity; they must not infer ownership from the currently signed-in user.

## Non-test verification

`npm run check` passed formatting, lint, strict typecheck and the production build. The final worker precaches 27 entries with approximately 786.41 KiB of discovered assets before transfer compression. Additional generic document sizes are excluded from that build estimate. `git diff --check` and local documentation links passed. The new handoff was checked directly with Prettier because the aggregate command excludes `docs`; existing planning documents retain their table formatting.

Manual browser acceptance used the production build on dedicated loopback origins, with fresh Chromium contexts for destructive diagnostics. Failure injection modified browser APIs only inside those temporary contexts; there are no fake database implementations, production fixtures or added test files.

| Check                                         | Observed result                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| First launch without an authenticated session | Workspace transaction completed and the app reported ready. No account/API/RSC request was needed.                                                    |
| Offline reload                                | The same workspace ID and creation time survived reload with the network disabled.                                                                    |
| A second offline tab                          | The cached entry opened and reused the existing workspace identity.                                                                                   |
| Two simultaneous fresh launches               | Both tabs became ready; the metadata store contained exactly one workspace row.                                                                       |
| Invalid stored metadata                       | Initialization failed, readiness stayed withdrawn and the malformed row remained unchanged.                                                           |
| Injected quota failure during creation        | The transaction left zero workspace rows. Removing the failure and choosing retry completed initialization.                                           |
| Injected IndexedDB access denial              | Initialization showed the failure message, rather than an external-close message. Removing the failure and choosing retry restored readiness.         |
| Missing IndexedDB                             | The app showed unsupported storage and did not claim offline readiness.                                                                               |
| Blocked upgrade                               | A held native connection blocked initialization and produced the translated explanation. Closing it allowed initialization to complete automatically. |
| External version change                       | The old mounted connection closed, readiness disappeared and the page did not reload.                                                                 |
| Persistent storage denied                     | Chromium's real denial produced a browser-managed retention notice while local use remained ready.                                                    |
| Missing or failing persistence APIs           | Isolated API overrides produced the corresponding retention notice while usable IndexedDB remained ready.                                             |
| Required cache entry unavailable              | Blocking an install icon failed asset installation. Successful IndexedDB initialization did not produce an offline-ready message.                     |
| Transaction durability                        | Chromium reported `strict` on the initialization read/write transaction. Power-loss behavior was not exercised.                                       |
| Offline Portuguese at 360 CSS pixels          | Language selection survived reload; there was no horizontal overflow or page error.                                                                   |

The final offline reload check after correcting access-denial feedback again retained the identity, restored Portuguese and made no account/API/RSC request. Screenshot: ignored `output/playwright/storage/offline-pt-mobile.png`.

No automated tests were read, added, modified or run. Package installation reported the same nine dependency findings recorded in the preceding handoff; no unrelated audit changes were applied.

## Remaining Phase 2 work and limits

- Implement and verify local navigation to an unvisited placeholder view without a server-component request. This increment addresses storage setup only.
- Verify physical installation and storage behavior on supported phones/tablets and other browser engines, including iPadOS/Safari where available. Chromium emulation does not establish those results.
- Retain the preceding PWA increment's waiting-worker evidence. Richer recorder-aware update coordination belongs to later feature work; there is no recorder yet.
- Full migration recovery, domain referential validation, account isolation, recorder-tab safeguards and private-data cleanup remain their later phase requirements. The current evidence covers metadata initialization and basic blocked/version-change handling only.
- Persistent storage does not provide backup. No browser restart, device-failure or power-loss durability guarantee is claimed. Storage is specific to the origin and browser context.

## File report

| File                                      | Change                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `package.json`                            | Pin Dexie 4.4.6.                                                                              |
| `package-lock.json`                       | Lock the Dexie dependency.                                                                    |
| `src/client/storage/database.ts`          | Define versioned metadata and transactional workspace initialization with runtime validation. |
| `src/client/storage/persistence.ts`       | Check/request storage persistence and distinguish its outcomes.                               |
| `src/client/storage/use-local-storage.ts` | Manage the mounted connection, initialization, blocked/closed state and retry.                |
| `src/client/pwa/local-storage-status.tsx` | Render storage/retention feedback and combined offline readiness.                             |
| `src/client/pwa/pwa-status.tsx`           | Mount storage feedback only on the local `/app` entry.                                        |
| `src/messages/en.json`                    | Add English storage and retention messages.                                                   |
| `src/messages/pt-PT.json`                 | Add matching European Portuguese messages.                                                    |
| `README.md`                               | Document storage setup, readiness and current limits.                                         |
| `docs/architecture.md`                    | Record the implemented storage structure and lifecycle.                                       |
| `docs/development-plan.md`                | Mark storage implemented while keeping Phase 2 in progress.                                   |
| `docs/offline-sync.md`                    | Document current metadata, readiness and durability behavior.                                 |
| `docs/backlog.md`                         | Record the selected version and remaining Phase 2 work.                                       |
| `docs/phase-2-offline-proposal.md`        | Update the increment status.                                                                  |
| `docs/phase-2-handoff.md`                 | Link the original PWA evidence to this follow-up.                                             |
| `docs/phase-2-storage-handoff.md`         | Record storage acceptance evidence and limitations.                                           |

Library references: [Dexie versioned stores](<https://dexie.org/docs/Version/Version.stores()>), [constructor options](https://dexie.org/docs/Dexie/Dexie), [blocked upgrades](https://dexie.org/docs/Dexie/Dexie.on.blocked), [version changes](https://dexie.org/docs/Dexie/Dexie.on.versionchange) and [persistent storage](https://dexie.org/docs/StorageManager).
