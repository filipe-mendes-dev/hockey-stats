# Changelog

User-visible changes are recorded here. Unreleased entries move into a dated version section when that version ships.

## Unreleased

The first beta is being prepared as **0.1.0**. No release date or tag has been assigned.

### Added

- Player and team management, match call-ups and starting-lineup selection.
- Live recording for recoveries, losses, shots, saves, fouls, cards, substitutions, timeouts and opponent goals.
- Match clocks, score corrections, team powerplay and latest-event Undo.
- Halftime confirmation with the shared attack-direction preview and substitution player picker. Edit the carried-over roster freely; only its final net replacements are recorded as substitutions at the new half's start.
- Completed-match statistics, recorded playing time and connected rink maps, player timelines and event lists.
- Revocable public links for completed-match statistics.
- Local offline recording and account-scoped synchronization.
- Responsive layouts and English/European Portuguese language selection.

### Changed

- Use the horizontal Benchline Stats logo and a consistent app-wide content width, with a wider header.
- Keep navigation position stable between pages and when dialogs open.
- Improve completed-match rink sizing, timeline density, scrollbars and player-table spacing.
- Simplify sharing guidance and redirect signed-in root visits to the app.

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
