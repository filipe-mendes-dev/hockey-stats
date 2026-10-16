# Phase 2 offline application foundation

Revised: 2026-10-16. Status: Phase 2 in progress. The PWA/Serwist and Dexie/workspace increments are implemented; local navigation feasibility and physical-device checks remain pending. This replaces the earlier prepared-games-only proposal following the user's clarification. See [storage verification](phase-2-storage-handoff.md).

## Agreed product scope

Benchline Stats primarily operates offline on personal phones, tablets and computers. Every hockey workflow must run locally as its feature phase is implemented: team/player management, match creation, roster selection, recording, corrections and viewing locally retained games. Account management and server synchronization require connectivity. No login or prior online preparation of a particular match is required for local use.

The first application download and later software updates need connectivity. After a successful download, the installed app must contain all required code and assets for implemented offline features, including views the user has never opened. Installation does not populate private user data: users create it locally or explicitly download it through synchronization. A fresh device can create new local data offline once those features exist, but cannot show records available only on another device/server.

Connection loss, server failure and expired sessions preserve all local data and keep local workflows available. Explicit sign-out is different: the user requires private local data removal. Unsynced-work safeguards are discussed below.

## What Serwist is

A service worker is browser-managed JavaScript that can intercept requests and serve cached application files without reaching the network. The browser can start and stop it; it is not a permanently running process or a local copy of the Next.js server.

Serwist is a set of libraries and build tools for writing that worker. It helps discover/version application assets, precache them, serve cached responses and manage worker updates. We configure its behavior; it does not choose the product's offline data model or automatically make every route work offline.

For example, a release contains an application document plus hashed JavaScript and CSS files. Its precache manifest identifies the files the worker must download. When the app launches offline, the worker serves them from Cache Storage. React then starts in the browser and reads the local database. Serwist does not store teams or implement conflict resolution; application services and IndexedDB handle those responsibilities.

Selected `@serwist/turbopack` and `serwist` 9.5.13 with native esbuild 0.28.2. Production builds with Next.js 16.4.0 pass. The separate `@serwist/next` getting-started integration targets webpack. See the [increment handoff](phase-2-handoff.md) for verification and remaining scope.

A handwritten worker avoids a dependency but leaves asset discovery, revisioning, cache cleanup and lifecycle handling to this project. Serwist addresses those concrete maintenance needs. Its starter's automatic activation and broad caching defaults still need replacing with our explicit policy.

Sources: [Serwist core](https://serwist.pages.dev/docs/serwist), [precaching](https://serwist.pages.dev/docs/serwist/guide/precaching), [Turbopack integration](https://serwist.pages.dev/docs/next/turbo), [worker lifecycle](https://serwist.pages.dev/docs/window/serwist).

## Simple architecture

| Part                             | Responsibility                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Manifest/icons                   | Installation metadata and a stable launch URL for the local application.                                                             |
| Service worker and Cache Storage | The generic application document, required feature JavaScript, CSS, icons/fonts and both catalogs.                                   |
| IndexedDB through Dexie          | Durable local workspace data, including team/player/game records as their features arrive. Later it also holds sync intent and undo. |
| Client application services      | Local validation and transactional feature writes. They run whether connectivity exists or not.                                      |
| Zustand, when features need it   | Temporary visible recorder selections, never the only copy of a completed event.                                                     |
| Account API and PostgreSQL       | Optional authenticated synchronization and server-accepted copies.                                                                   |

Use one generic cached local application entry and browser-side navigation within it. It must boot without a session check, server rendering request or remote translation fetch. Next.js can still serve account pages and API handlers, but local product views cannot depend on server components executing during navigation. The implemented launch URL is `/app`; there is no separate reduced offline product.

Precache the complete required local feature asset graph on each release, including lazy code for unvisited views. Caching a document alone is insufficient. Do not cache personalized HTML, authentication redirects or API responses, and never return the document as a fallback for API/RSC requests. Begin with a single document and simple local navigation; add deep-link routing only when an actual feature requires it.

Keep application readiness separate from synchronization status. Readiness means the required application files are cached and the local database can initialize, not that the account is signed in or any game is already created. PWA installation alone is not proof that this succeeded. Request persistent storage where supported and report the result; cache/IndexedDB failures must not show ready or saved.

## Intended feature flow in later phases

1. Download the app once while connected. Complete required caching and local database initialization.
2. Open it offline without an account. Create or select local teams/players, create a game, choose its roster and record.
3. Validate and save each completed operation in an IndexedDB transaction. After success, display saved locally. Read back local state after ordinary reload or app restart.
4. If the user connects a server account, explicitly associate the intended local workspace with that account. Preserve stable client-generated entity IDs. Never attach a previous account's data to a new account automatically.
5. Deliver prerequisites before dependent mutations: team/player creation, game/roster creation, then recording changes. Never require a server game ID before local recording.
6. Persist server acknowledgements locally before reporting synced. Network/auth failures leave local work intact. Server conflicts require explicit handling rather than silent overwrite.

Phase 2 does not implement this hockey or synchronization behavior. It establishes the application download, boot, navigation and storage foundation those features will use.

## Explicit sign-out and data removal

The user requires private local data removal on deliberate sign-out, not when connectivity is lost or a session expires. Retain the generic cached application files so the app still launches offline and can start with an empty local dataset. Removing those files would make the next offline launch impossible.

The private dataset includes teams, players, games, recorded events, pending changes, undo and account/workspace binding. Deleting an unsynced record removes its only copy; signing in again cannot recover it from the server. Synced records can be restored only through an online download.

Recommended safeguard, awaiting agreement before cleanup implementation:

- If the dataset is fully synced, stop local activity, complete account sign-out and remove its private data.
- If pending work exists, synchronize first when possible. Otherwise offer cancellation or a separate explicit discard-and-sign-out action that explains which work will be lost. Do not silently discard it.
- Handle partial sign-out/cleanup failures honestly. Coordinate other tabs, stop writes/uploads and clear in-memory private state so stale tabs cannot restore or upload removed data.
- Without connectivity, local deletion is possible but server-session revocation cannot be confirmed. Do not claim remote sign-out succeeded, and do not let a surviving cookie automatically reconnect the removed workspace.

These rules are design requirements/proposals for later account/sync work. No actual local deletion or authentication change is performed by this documentation update. The existing lock-and-retain proposal is superseded.

## Phase 2 deliverables only

- PWA manifest and appropriate installation icons.
- A generic local app entry with minimal placeholder navigation, available without authentication.
- Serwist evaluation/integration, explicit required-asset precaching and useful readiness/failure feedback.
- Dexie initialization, initial versioning, non-secret local workspace identity and storage-failure handling. Do not prebuild unused domain tables or generic repository frameworks.
- English and Portuguese from cached local catalogs.
- A waiting-update indication and deliberate activation at a safe point. Preserve the previous usable build if a new installation fails.

Do not implement teams, players, games, rosters, recorder UI, sample prepared matches, Zustand demonstrations, outbox transport, account binding or destructive sign-out cleanup. Those features belong in later branches/phases. A temporary non-domain storage diagnostic can verify persistence and then be removed; it is not a production dataset or feature.

## Verification and risks

Use production-build non-test checks, consistent with `AGENTS.md`: cold launch/reload without a session or network, navigation to an unvisited placeholder view, local language switching, manual persistence verification, failed caching/storage and a waiting worker update. Do not add or run automated tests. Verify physical target devices where available and report limitations rather than claiming desktop emulation proves iPadOS behavior.

An installed app still uses browser-managed storage. Requesting persistence reduces eviction risk but does not protect against explicit clearing, device loss or deliberate unsynced-data deletion. Private browsing is unsuitable for retained match work. Serve production over HTTPS and keep the deployment origin stable; a hostname change does not migrate local records. A plain HTTP LAN URL is not equivalent to localhost for service-worker checks on another device.

A new worker must wait during active recording, visible drafts or local transactions. Coordinate safe activation across open tabs and do not remove the active build's required files prematurely. Database migrations must preserve existing data; do not reset the database to recover from a migration failure. Full migration/concurrency/sync hardening remains a later phase.

Sources: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps), [service-worker behavior](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [browser storage limits](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
