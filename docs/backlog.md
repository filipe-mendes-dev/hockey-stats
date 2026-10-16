# Backlog and implementation gates

## Decisions required before dependent phases

| Decision | Recommended default | Required before |
| --- | --- | --- |
| Explicit sign-out with unsynced data. | Remove private local data, retain generic app files; recommend sync before cleanup or a separate explicit discard choice. Never delete silently. | Implementing account/data cleanup. |
| Additional shared-device offline unlock and retention. | Defer beyond the agreed personal-device policy unless shared-device use becomes required. | Shared-device release. |
| Shot edge cases. | `goal`, non-goal `on-target`, `off-target`, `blocked`. Keep outcomes exclusive. | Phase 7. |
| Competition presets. | Configurable periods, countdown, no guessed period duration or regulation player limits. | Adding presets, not basic clock implementation. |

These gates do not block Phase 0. Exact library versions are chosen from current stable releases during the relevant phase, not pinned by this planning run.

## Deferred product work

- Account settings and signed-in password changes through Better Auth, using the current password. No email dependency.
- Permission-gated Admin navigation button and user-management screen. Admin user creation uses a terminal helper until that screen exists.
- Administrator-assisted password recovery and any forced initial-password-change policy.
- Personal workspace table/provisioning, account-scoped product persistence and durable command receipts in Phase 3's synchronized recording slice.

- Manual JSON export/import, backup and recovery workflows.
- Automated local/server backups and restore exercises.
- Advanced statistics, heatmaps, zones, playing-time reports and season dashboards.
- Score display, manual opponent goals and score correction semantics.
- Regulation-aware foul thresholds, counter resets and competition enforcement.
- Assist tracking, opponent player tracking, video sync and automated detection.
- Substitution convenience workflows. Independent player-in/out remains the V1 path.
- Shared accounts, memberships, invitations, additional roles and organization management. Basic authentication `user`/`admin` roles are included in the current authentication increment.
- Billing and subscription routing.
- Multi-device simultaneous recording and automatic conflict merging.
- Separately deployed API infrastructure.
- Native applications and app-store distribution.

## Deferred engineering work

- Monotonic/wall-clock reconciliation, drift diagnostics and cross-device clock handoff.
- Background Sync as an enhancement; foreground retries remain required.
- Generic repository frameworks, shared UI packages and workspace task-runner infrastructure.
- Canvas rink rendering or large spatial datasets.
- Automatic server-to-client push updates and WebSocket infrastructure.
- Sophisticated data retention, device management and encrypted local unlock.

## Working defaults already resolved

- Next.js App Router and an early PostgreSQL-backed Next.js API.
- PostgreSQL 18 local development through the official `postgres:18-trixie` image, Docker Compose, loopback-only host access and a persistent named volume. Account tables and application database access follow separately.
- Better Auth with username/password, admin-created users and `user`/`admin` permissions. No public registration or email infrastructure. Drizzle ORM and Drizzle Kit manage one SQL migration history. Personal workspace provisioning is deferred beyond the minimal login shell. See [account schema and flow](account-auth.md).
- Authentication increment implemented with Better Auth/adapter/CLI 1.7.8, Drizzle ORM 0.45.4, Drizzle Kit 0.31.11 and `pg` 8.23.1. Admin permission currently permits normal-user creation only.
- next-intl from Phase 0, English and `pt-PT`, with locale-independent URLs and locally available offline messages.
- One offline-first application for local team/player management, new-match setup, recording and retained history. No per-match online preparation or login is required. Only account management and synchronization need connectivity.
- Phase 2 targets personal devices across phone, tablet and computer browsers and implements infrastructure only. Recorder state, fixtures, CRUD and sync belong to later phases.
- First Phase 2 increment implemented on 2026-10-15: Serwist/Turbopack 9.5.13 with esbuild 0.28.2; public `/app` PWA launch entry; explicit public asset caching and waiting updates. See [PWA verification](phase-2-handoff.md).
- Phase 2 storage increment implemented on 2026-10-16: Dexie 4.4.6, versioned metadata, transactional local workspace identity, storage failure/retry and readiness feedback. Local placeholder navigation and physical-device checks remain pending. See [storage verification](phase-2-storage-handoff.md).
- Connection loss and session expiry preserve all local work. Explicit sign-out must remove private local data while retaining generic installed app assets; agree unsynced-work safeguards before implementation. This supersedes the earlier lock-and-retain policy. Additional local PIN/encrypted unlock remains deferred. See [offline access policy](offline-sync.md#authentication-and-account-isolation).
- One root Next.js project. Phase 0 is setup-only; add server, domain and transport code when needed by an authorized feature. Discuss separate packages only when a concrete need arises.
- Zustand for temporary recorder UI state.
- Creation draft exists only while add-event UI is visible.
- Every event requires a player; recovery requires subtype; loss requires reason; shot requires outcome; card requires colour.
- Player-in/out require period and game time, captured from a known clock or entered manually. Other events may remain untimed.
- Game time has no source provenance field.
- Countdown by default, configurable periods and no assumed regulation lineup size.
- Explicit event order for replay, optional game time for statistical views.
- Historical contradictions use a preview, explicit acceptance and persistent diagnostics.
- Fixed labelled field coordinates with explicit per-period attack direction.
- No score or official foul-rule projections in initial V1.
