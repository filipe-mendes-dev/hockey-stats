# Development plan and beta preparation

Updated 2026-11-02. The user reports that the application is already partly live. Current work focuses on quick improvements and finishing the beta presentation for LinkedIn, the CV and portfolio. Package metadata remains `0.0.0` until the separate `0.1.0` release-version increment. No release tag or GitHub Release has been created by this preparation work.

Current behavior belongs in [Product requirements](product-requirements.md), [Domain model](domain-model.md), [Recorder UX](recorder-ux.md) and [Offline and sync](offline-sync.md). Earlier implementation reports are preserved in [Verification history](verification-history.md). Historical reports do not establish current deployment readiness.

## Current delivery

| Area               | Implemented scope                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| Foundations        | Strict TypeScript, Mantine, responsive UI and English/pt-PT.                                                   |
| Accounts           | Username/password sessions, restricted creation and administrator management of normal accounts.               |
| Players and teams  | Offline creation/editing, memberships, inline player creation and history-preserving removal.                  |
| Match preparation  | Incomplete call-ups, pre-start editing, two equal halves and four field starters plus a goalkeeper.            |
| Recording          | Recoveries, losses, shot types, classified saves, timeouts, fouls, cards, substitutions and opponent goals.    |
| Clock and lineup   | Anchored countdown, adjustment, timed team powerplay, fifth-player entry and explicit period/match completion. |
| Completed analysis | Results, team/player/goalkeeper statistics, recorded playing time and linked event map/timeline.               |
| Match sharing      | Revocable completed-match links, public server-rendered statistics and online owner controls.                  |
| Durability         | IndexedDB, shared outbox, versioned commands, owner-scoped APIs, receipts and local latest-event Undo.         |
| Branding           | Exported horizontal Glass logo in the header/sign-in, symbol-only icons and decorative watermarks.             |

Dexie schema version is 10. Checked-in SQL migrations run through 0016_match_sharing.sql. Event commands use version 9 and match controls version 2; compatibility details belong in [Offline and sync](offline-sync.md).

## Release preparation sequence

1. Retain the completed dependency remediation and reproducible-installation evidence. The user has deferred residual tooling and broader reliability work for this beta launch.
2. Keep the README focused on the product, features, technology and setup. The banner/badge row and linked local-development guide are in place; the visual design-system section was removed at the user's request.
3. Agree focused behavior for halftime attack direction and each new half's starting lineup, then address the user's specific Match-summary UI observations in small increments. These improvements are not implemented by this plan update.
4. Finish current marketing screenshots and beta presentation. [Release readiness](release-readiness.md) records the narrowed launch scope; the [Backlog](backlog.md) retains deferred findings with backups first after launch. Competition and later metadata editing remain proposals.
5. Set package and lockfile versions to 0.1.0, complete promotion from staging to master and create v0.1.0 as a GitHub pre-release. Follow [CI and publishing](ci-cd.md).

Marketing screenshots are still to be supplied. Do not substitute historical browser fixtures for current product screenshots or claim broader device acceptance from them.

## Current verification

Dependency preparation on 2026-11-01 updated Next.js/eslint-config-next to 16.4.3 and scoped Serwist's nested Zod to 4.6.7. Clean npm installation, source/configuration ESLint, TypeScript and the production build passed. The lockfile audit has no high/critical findings and 23 moderate package entries. See [Dependency advisories](security-advisories.md) for paths, support warnings and residual exposure.

Production-browser acceptance used an isolated Chromium session and disposable local ownership metadata. The app entry and new logo loaded offline through the production worker, while an uncached request failed. No real account or Match data changed. The session, worker and caches were cleaned up. This does not verify authenticated upload/download, migrations, a rebuilt container or an older cached client.

Earlier work verified chronological validation/playing-time derivation, completed statistics, public sharing, responsive recorder choices, magnifier placement, safe-area CSS, navigation and targeted offline flows. Exact scenarios and limitations remain in [Verification history](verification-history.md). That history includes previously authorized focused chronology tests; this increment did not read, add, change or run tests.

## Deferred verification

The user deferred the former P0 findings beyond the current launch on 2026-11-02. The following checks remain unverified and are tracked in the backlog; they are not new blockers for the beta announcement.

- Physical-phone installation and recorder ergonomics, other browser families and real safe-area behavior.
- An upgrade from an older cached client with queued offline work.
- Current authenticated upload/download, public sharing and production Match-repair recovery.
- Fresh container/image identity, migrations, deployed HTTPS/PWA behavior and backup/restore evidence.
- Concurrent edits, blocked-conflict recovery and target-device performance within the agreed beta limits.

The Dockerfile, production Compose and CI/GHCR workflows exist. The user's report of a partly live app supersedes the earlier assumption that deployment had not started. This documentation update did not inspect infrastructure. Historical pending-rollout notes remain earlier evidence, not proof of current production failure or completed deployment acceptance.

## Verification policy

Run relevant non-test checks. Inspect aggregate scripts before use; do not read, add, modify or run tests without explicit user authorization. Docs are excluded from repository-wide Prettier checks, so format changed docs and inspect their local links explicitly.

Verify offline/service-worker behavior against a production build on a separate origin. For layout work, use a representative phone and laptop width, preserve real records and state unavailable checks. Mark release gates complete only with recorded acceptance evidence.
