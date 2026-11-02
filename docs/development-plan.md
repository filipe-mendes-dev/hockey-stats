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
3. The agreed root redirect and Match-summary polish are implemented. Halftime attack direction and each new half's starting lineup still require behavior review before implementation.
4. Finish current marketing screenshots and beta presentation. [Release readiness](release-readiness.md) records the narrowed launch scope; the [Backlog](backlog.md) retains deferred findings with backups first after launch. Competition and later metadata editing remain proposals.
5. Set package and lockfile versions to 0.1.0, complete promotion from staging to master and create v0.1.0 as a GitHub pre-release. Follow [CI and publishing](ci-cd.md).

Marketing screenshots are still to be supplied. Do not substitute historical browser fixtures for current product screenshots or claim broader device acceptance from them.

## Current verification

Dependency preparation on 2026-11-01 updated Next.js/eslint-config-next to 16.4.3 and scoped Serwist's nested Zod to 4.6.7. Clean npm installation, source/configuration ESLint, TypeScript and the production build passed. The lockfile audit has no high/critical findings and 23 moderate package entries. See [Dependency advisories](security-advisories.md) for paths, support warnings and residual exposure.

Production-browser acceptance used an isolated Chromium session and disposable local ownership metadata. The app entry and new logo loaded offline through the production worker, while an uncached request failed. No real account or Match data changed. The session, worker and caches were cleaned up. This does not verify authenticated upload/download, migrations, a rebuilt container or an older cached client.

Earlier work verified chronological validation/playing-time derivation, completed statistics, public sharing, responsive recorder choices, magnifier placement, safe-area CSS, navigation and targeted offline flows. Exact scenarios and limitations remain in [Verification history](verification-history.md). That history includes previously authorized focused chronology tests; this increment did not read, add, change or run tests.

The simplified 2026-11-02 shared layout passed changed-file formatting, source ESLint, TypeScript and the production build. Global limits are 96rem for the header and 84rem for content/footer, with one 1.5rem minimum gutter and safe-area protection. Sixteen page wrappers no longer impose their own caps; the 72rem summary cap and desktop recorder width override are removed. Component-level form fields retain a 36rem limit, and phone recording retains its fullscreen mode. Mobile full-bleed action bars, step headers and call-up lists use the shared gutter instead of hardcoded offsets.

Isolated Chromium checks used synthetic records across 42 route/viewport combinations at 2560×1440, 1440×900, 390×844 and 320×740. Covered home, Players/Teams/Matches lists, creation forms, setup details, starting lineup, call-up editing, the live recorder and completed analysis. At wide desktop sizes the header measured 1536px and content/footer 1344px; page content measured 1296px and forms 576px. No checked route had horizontal overflow. The original 7.5px header movement between short pages and the scrolling summary was reproduced before the change. With stable root scrollbar space, header position was identical across routes and across all nine captured frames of an actual summary-to-Players client navigation. Enlarged Portuguese text at 320px also produced no horizontal overflow. A dialog check caught duplicate gap compensation between the stable browser gutter and Mantine scroll locking; the final global rule delegates that gap to the existing lock while active. On the final production build, the header remained at the same position across all 11 captured frames of sharing-dialog opening/closing. The phone navigation drawer also opened and closed successfully. Administrative pages were compiled but not exercised with an authenticated admin session. Earlier responsive lane/pill, scrollbar hover/scrolling and sharing-copy checks remain valid; their behavior was unchanged by this simplification.

On a fresh local production origin, the revised completed summary and horizontal logo reloaded through the controlling worker while an uncached offline request failed. Synthetic browser data was isolated from the server database and removed afterward. An unauthenticated root request returned HTTP 307 to `/sign-in`; the signed-in redirect to `/app` was checked in source and compiled, without a live authenticated session. Public sharing creation/revocation and a real shared page were not exercised in this increment. The width changes use the same completed-statistics component for owner and public pages. No tests were read, added, changed or run.

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
