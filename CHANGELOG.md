# Changelog

User-visible changes are recorded here. Unreleased entries move into a dated version section when that version ships.

## Unreleased

## 0.1.0 - 2026-11-03

First beta.

### Added

- Revocable public links for completed-match statistics, with period/player filters, rink positions, event history and lineup analysis.
- Interactive player lineup timelines linked to the rink and event list, a substitutions-only filter and expandable mobile player statistics.
- Halftime confirmation with the shared attack-direction preview and substitution player picker. Edit the carried-over roster freely; only its final net replacements are recorded as substitutions at the new half's start.
- Poor reception as a ball-loss reason.

### Changed

- Refresh branding, app icons and sign-in presentation, including the horizontal Benchline Stats logo.
- Use a consistent app-wide content width, with a wider header, and shared responsive dialog sizing, headers and action footers.
- Improve completed-match rink sizing, timeline density, scrollbars and player-table spacing.
- Simplify recorder choices, sharing guidance and synchronization feedback in English and European Portuguese; redirect signed-in root visits to the app.
- Align Next.js and its ESLint configuration at 16.4.3 and patch nested Serwist Zod dependencies.
- Require release PRs into master to come from this repository's staging branch.

### Fixed

- Replay and validate events in period/game-time order, including events entered after later actions. Derive playing time from that history and show unavailable totals when timing or lineup history is unreliable.
- Prevent horizontal navigation shifts between pages and dialogs, and keep sharing buttons and clock controls readable on narrow screens with enlarged text.

### Known limitations

- One active observer per match; concurrent-write conflicts do not have a resolution UI.
- Initial sign-in and offline setup require a connection. Sharing and revocation require online access.
- Browser-only unsynchronized work is not backed up. Operational backup/restore work remains deferred.
- Physical-device, older-client upgrade and full deployed synchronization acceptance remain incomplete.

### Update guidance

- Finish active recording before updating. Close all app tabs/windows and reopen to allow a waiting service worker to activate.
- Preserve IndexedDB and queued commands; do not clear browser data to update.
- The server schema includes migrations through `0016_match_sharing.sql`. Confirm deployed migration status and run outstanding migrations before serving the new client. The halftime increment adds no migration or command version.
- Final release notes must identify the verified `master` commit and immutable image digest. Those remain pending until promotion and image publication.

Release preparation and deferred work are tracked in [Release readiness](docs/release-readiness.md) and the [Backlog](docs/backlog.md).
