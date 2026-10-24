# Development plan and prototype status

Updated 2026-10-24. The prototype is implemented for review. Current behavior belongs in [Product requirements](product-requirements.md), [Domain model](domain-model.md), [Recorder UX](recorder-ux.md) and [Offline and sync](offline-sync.md). This file records delivery status, verification limits and remaining work; it is not a chronological implementation log.

## Current delivery

| Area               | Implemented scope                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations        | Strict TypeScript, shared Mantine controls, dark responsive UI and English/pt-PT.                                                                    |
| Accounts           | Username/password sessions, restricted account creation and administrator management of normal accounts.                                             |
| Players and teams  | Offline creation/editing, memberships, inline player creation and history-preserving removal.                                                        |
| Match preparation  | Incomplete call-ups, pre-start editing, two equal halves and four field starters plus a goalkeeper.                                                  |
| Recording          | Recovery/loss, shot types, required-classification goalkeeper saves, timeouts, own player-attributed fouls, cards, substitutions and opponent goals. |
| Clock and lineup   | Anchored countdown, adjustment, timed team powerplay, fifth-player entry and explicit half/match completion.                                         |
| Completed analysis | Final/period results, team/player/goalkeeper statistics and linked event map/timeline.                                                               |
| Durability         | IndexedDB, shared outbox, versioned commands, owner-scoped APIs, receipts, downloads and local latest-event Undo.                                    |

## Match event expansion

The seven code commits on `feature/match-event-expansion` add the event contracts/persistence, recorder entry, goalkeeper/timeout statistics, optional position UI, zero-clock controls, shared half resolution and lifecycle redirects. SQL migration 0015 adds nullable event columns. Event protocol 7 retains frozen validation for queued version-6 commands; match controls use version 2. No IndexedDB migration or package was added.

Set pieces are available from Game event and ordinary Shot entry. They count as one shot and use fixed restart coordinates. New saves require Simple or Difficult; historical missing classifications remain readable. Completed matches use the full summary at `/app/matches/view`; stale Live/Start links resolve to the current lifecycle screen.

## Verification evidence

- Formatting, scoped ESLint, TypeScript, catalog key/ICU parity, documentation links, whitespace checks and production builds passed for the implemented recorder changes. Each of the seven commit snapshots also passed TypeScript and scoped ESLint.
- Production-browser review covered player/action/rink entry orders, first-contact time, both attack directions, touch magnification, keyboard selection, gesture locks, position clearing and halfway fallback. Set pieces retained their fixed coordinates; new saves retained difficulty.
- Early and zero-clock completion opened the full summary. Failed local completion retained the live screen and retry feedback. Old Live/Start/call-up links, Back history and unknown IDs were checked.
- Service-worker checks covered offline Start, halftime, recording, Retry, Undo, completion and durable summary reload. Phone/desktop layouts and narrow Portuguese text were reviewed without observed runtime page errors or horizontal overflow.
- The original event expansion was exercised with authenticated uploads, independent-browser downloads, local PostgreSQL, receipt replay and server validation. Later UI/navigation refinements used disposable local IndexedDB records and did not repeat authenticated synchronization.
- Earlier account/entity increments covered ownership/session checks, expected revisions, atomic rollback, deletion markers, sign-out failure handling and protected administrator accounts.

These are targeted checks, not release certification. Automated tests were not read, added, changed or run. Disposable QA records and browser sessions were removed; user data was preserved.

## Remaining acceptance and next work

- Physical-phone ergonomics, other browser families and an actual upgrade from an older cached client remain unverified.
- Broader multi-account/device switching, simultaneous recording, blocked-conflict recovery and target-device performance require separate acceptance.
- The historical one-off converter, shareable statistics links, possible PDF export and other deferred features remain in the [Backlog](backlog.md).
- Further product work needs explicit scope approval. Do not infer that a feature is implemented because a contract permits an optional field.

## Deployment status

The production Dockerfile, image-based Compose setup and CI/GHCR workflow are implemented. Local AMD64 build/runtime and workflow checks passed. GitHub execution, first image publishing, VPS deployment, backups and update recovery remain pending.

Use [Deployment](deployment.md), [CI and container publishing](ci-cd.md), [First VPS deployment](vps-first-deployment.md) and [Dependency advisories](security-advisories.md) for operational instructions and advisory status. Do not treat documentation or a local build as evidence of a completed deployment.

## Verification policy

Run relevant non-test formatting, lint and TypeScript checks; inspect scripts before running aggregates. Check docs formatting and local links explicitly because docs are excluded from repository-wide Prettier checks. Service-worker/offline checks require a production build and a matching isolated browser origin.

For layout changes, use one representative phone and laptop size unless the user requests additional viewports or enlarged-text checks. Preserve user records and record unavailable checks honestly. Do not read, add, modify or run automated tests without explicit user authorization. Mark work accepted only when its agreed acceptance criteria pass.
