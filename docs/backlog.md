# Backlog and implementation gates

## Decisions required before dependent phases

| Decision | Recommended default | Required before |
| --- | --- | --- |
| Authentication provider and sign-in method. | Established integration, server-managed session, one personal account per user. Do not build password/session infrastructure from scratch. | Phase 1. |
| PostgreSQL access/migration library. | Drizzle, subject to verifying the selected version and deployment environment. | Phase 1. |
| Next.js offline tooling and route fallback. | Stable worker integration with an explicit precached `/offline` entry for prepared games; evaluate Serwist. | Phase 2. |
| Offline local access and shared-device retention. | Prepared account data remains usable through session expiry; explicit sign-out locks views; no account mixing. | Phase 2 and account-switching release. |
| Shot edge cases. | `goal`, non-goal `on-target`, `off-target`, `blocked`. Keep outcomes exclusive. | Phase 7. |
| Competition presets. | Configurable periods, countdown, no guessed period duration or regulation player limits. | Adding presets, not basic clock implementation. |

These gates do not block Phase 0. Exact library versions are chosen from current stable releases during the relevant phase, not pinned by this planning run.

## Deferred product work

- Manual JSON export/import, backup and recovery workflows.
- Automated local/server backups and restore exercises.
- Advanced statistics, heatmaps, zones, playing-time reports and season dashboards.
- Score display, manual opponent goals and score correction semantics.
- Regulation-aware foul thresholds, counter resets and competition enforcement.
- Assist tracking, opponent player tracking, video sync and automated detection.
- Substitution convenience workflows. Independent player-in/out remains the V1 path.
- Shared accounts, memberships, invitations, roles and organization management.
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
- next-intl from Phase 0, English and `pt-PT`, with locale-independent URLs and locally available offline messages.
- Limited `/offline` recording for prepared games; management and game/roster preparation remain online.
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
