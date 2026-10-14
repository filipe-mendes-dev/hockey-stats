# Benchline Stats | Product Requirements Document

**Status:** Working development baseline, revised 2026-10-14

**Repository working name:** `hockey-stats`  
**Product working name:** Benchline Stats  
**Target:** V1 live roller-hockey match recorder

## 1. Product overview
Benchline Stats is an offline-capable, responsive web application for coaches and match observers to record player-specific events during roller-hockey games. Its primary product is a fast, reliable live recorder; analysis and dashboards are later phases. Accounts and a PostgreSQL-backed Next.js API are included in the early architecture. IndexedDB retains the local working data and pending mutations needed to record without connectivity.

## 2. Problem and users
A single observer needs to record match events in real time on a phone, tablet, or laptop, often with unreliable connectivity. Recording must require minimal taps, tolerate mistakes and clock drift, and never require optional contextual data.

**Primary users:** coaches, assistants, and match analysts managing one or several teams or age categories.

## 3. V1 goals
- Manage teams and players, including players belonging to multiple teams/age categories.
- Create games, select a participating team and match roster, and mark the starting lineup.
- Record player-level events quickly through player-first, action-first, and field-first interactions.
- Record independent player-in and player-out events and correctly display variable on-field player counts.
- Record cards, shots, possession losses, recoveries, and team fouls.
- Allow optional normalized field coordinates and optional match-clock timestamps for non-movement events. Player-in/out require period and game time.
- Show a live event timeline with immediate undo and historical edit/delete.
- Preserve recording locally without network connectivity, including after ordinary page reloads.
- Support phone, tablet, and desktop layouts; prioritize tablet ergonomics.
- Provide account-scoped routing, authenticated API access and server persistence in the early phases.
- Start authentication with admin-created username/password users and basic `user`/`admin` permissions through Better Auth. The first auth UI is public login and a protected header/main shell with sign-out. Email infrastructure, account settings and the admin screen follow separately or remain deferred.
- Synchronize local mutations with explicit saved-locally, pending, synced and action-required states.
- Support English and European Portuguese (`pt-PT`) from Phase 0, including the offline recorder.

## 4. Explicit non-goals for initial V1
- Advanced analytics, heatmaps, season dashboards, or automated statistics projections.
- Assist tracking, opponent player tracking, video synchronization, AI, or automated event detection.
- Quick-substitution mode; use independent player-in/out actions.
- Native mobile apps or app-store publication.
- Multi-device simultaneous recording, shared-account collaboration, invitations, billing and advanced account roles. Basic authentication admin/user permissions are included. Initial sign-in/provisioning requires connectivity; continuing a prepared match does not.

## 5. Domain concepts
### Account
Owns teams, players and games. Working default: one personal account per user. Authorization applies to every API operation; account IDs in URLs are not authorization. Shared accounts and invitations are deferred.

This domain account is a workspace for hockey data, separate from the Better Auth user identity and credential account. Its table/provisioning is deferred beyond the initial login shell. Authentication admin privileges manage users; they do not automatically grant access to other workspaces' hockey data.

### Team
Represents an account's squad or age category (e.g., senior, U19). Name, optional category and season metadata. Do not assume a player belongs to only one team.

### Player
Independent identity within an account, not owned by a team. Contains name and optional metadata.

### TeamPlayer
Many-to-many association between team and player. Optional team-specific jersey number and membership status. Consider temporal membership/season if useful without overengineering.

### Game
Participating team, opponent name, optional title, date, competition, home/away, status, and configurable period/clock settings. A game is recorded from one team's perspective.

### GamePlayer
Snapshot of the selected game roster with player identity, jersey number at match time, and starting status. Historical games must not change when team membership or jersey numbers change.

### GameEvent
Canonical persisted record of a match occurrence. Common attributes: stable ID, account ID, game ID, required game-player ID, explicit event order, event type, period, game time required for player-in/out and optional otherwise, optional normalized x/y coordinates, event-specific attributes, creation time and revision/deletion metadata. Event-specific fields are validated by variant rather than allowing arbitrary combinations. See `domain-model.md` for proposed TypeScript contracts. Game time has no source provenance field.

## 6. Event vocabulary and attributes
| Event | Player | Details | Coordinates |
| --- | --- | --- | --- |
| Shot | Required | Required outcome: goal, non-goal on target, off target or blocked. Confirm edge cases before implementation. | Optional |
| Ball loss | Required | Required reason: intercepted pass, failed individual action or other | Optional |
| Ball recovery | Required | Required subtype: interception, duel, loose ball or other | Optional |
| Team foul | Required | Player-attributed team-foul occurrence; regulation counters/resets deferred | Optional |
| Card | Required | Required colour: yellow, blue or red | Optional |
| Player in | Required | Required period and game time | Not applicable |
| Player out | Required | Required period and game time | Not applicable |

A card must **not** silently generate a player-out event. The UI can suggest a separate action. Player-in and player-out are independent; no replacement player is required. An optional convenience substitution workflow is deferred.

## 7. Field coordinates
- Coordinates are optional and must never block event creation.
- When supplied, store x and y normalized to `[0, 1]` with a documented, stable field orientation.
- Choose and document which direction represents the recorded team's attack, including period changes and home/away orientation; do not derive offensive/defensive half until orientation is unambiguous.
- Derive field half and shot zones from position only when coordinates exist and definitions are available; otherwise classification remains unknown.
- For shots, position means the location **where the shot was taken**, not where it finished.
- Ensure field tapping works accurately across aspect ratios and responsive layouts.

## 8. Game setup
1. Select team.
2. Enter opponent; optionally title, date, competition and home/away.
3. Select roster from that team's players; allow practical corrections.
4. Select starting lineup, without assuming every game always has a fixed number on the field.
5. Enter live recorder; start or set the clock when ready.

Prepare games and rosters online. Save the selected game, roster snapshots, starters, period configuration and history locally before offline use. `/offline` selects and records those prepared games; it does not create games, teams or players or expand rosters.

## 9. Live recorder layout
- Header: teams, score if maintained, current period, clock controls, undo.
- Main field: tappable rink with optional coordinate selection.
- Visible active lineup and accessible bench; indicate player on/off field and jersey number.
- Primary quick actions: loss, recovery, shot, foul.
- Player detail actions: record event, card, take off, put on.
- Recent-event timeline: time (if known), player, event, details; open to edit/delete.
- Use responsive layout: side-by-side panels on tablet/desktop, prioritized stacked layout or compact sheets on phone.
- Keep the main controls reachable without scrolling where feasible. Confirm practical layout with prototypes.

## 10. Recording interaction state machine
All paths produce the **same canonical event shape**, regardless of UI entry point.

**Player-first:** select player → select action → choose mandatory event-specific details → commit.

**Action-first:** select quick action → select player → choose mandatory details → commit.

**Field-first:** tap rink position → select spatial action → select player → choose mandatory details → commit.

A temporary Zustand draft may hold player, action, coordinates, period/time snapshot and details only while the add-event UI is visible. Closing/cancelling, switching game/account or completing local save clears it. No hidden or reload-persisted creation draft is permitted. Persisted events waiting for upload are completed local operations, not drafts. The user can back out without persisting incomplete events. Commit locally once all required data is supplied; avoid unnecessary confirmation screens. Optional fields must not create mandatory steps.

**Cards:** player → card → colour → commit.  
**Player out:** active player → take off → commit.  
**Player in:** bench player → put on → commit.

For game events, prevent accidental double taps and invalid transitions while still allowing explicit historical corrections.

Player-in/out require a known captured game time or manual period/time entry before commit. Keep add-event UI visible until that requirement is met. Do not substitute zero or real-world creation time when match time is unknown.

## 11. Game clock and periods
- Every event has a real-world `createdAt` for auditing and explicit event order for replay. Game time is mandatory for player-in/out and optional for other events.
- Support period selection, start, pause, resume, and manual clock correction during play.
- Clock time can be captured automatically at commit or entered/edited manually; recording works without an active clock.
- Correcting the current clock affects **future** events, not timestamps already stored.
- Default display is countdown with configurable periods. A positive period duration is required only to run the clock. Use a persisted anchor rather than decrementing per UI timer callback. Pause at zero; require an explicit period change. Do not guess competition presets or add advanced drift diagnostics initially.
- Support editing historical event period/time independently. A movement timestamp cannot be cleared.

## 12. Timeline, undo, edit and delete
- Display events in explicit event order even when match time is missing or manually corrected. Period/time can support later statistics views but cannot be the sole ordering key.
- Immediate undo reverses the last user operation, including player-in/out and other compound changes if any.
- Historical edit changes player, event-specific details, coordinates and period/time where applicable.
- Historical deletion must recompute derived on-field lineup from the corrected sequence.
- Ensure undo/edit/delete are persisted locally and remain consistent across reloads.
- Use current records, increasing revisions, soft-delete tombstones and a durable operation journal. Undo uses a durable inverse operation, including after synchronization.
- Historical corrections preview downstream movement contradictions. Explicitly accepted redundant transitions remain visible and replay as flagged no-ops; never silently rewrite other events.

## 13. Offline-first behavior
- `/offline` supports selecting a prepared game, recording, lineup movements, clock, timeline, edits and undo using saved data. Account/team/player management, game creation, roster expansion and uncached browsing remain online-only.
- Cache the offline entry and required assets, including both language catalogs, and save prepared match data before reporting offline readiness. Unprepared game IDs show an unavailable state rather than an incomplete recorder.
- Local changes and their upload commands commit atomically before the UI claims saved locally. Synced requires a persisted server acknowledgement; handle quota/storage failures visibly.
- Avoid depending on a live server for any match-critical interaction.
- Protect active recording sessions from unexpected service-worker updates/reloads.
- PostgreSQL is authoritative for accepted shared data. IndexedDB keeps local working data, pending changes and undo history even while online. An API timeout must not discard an event or create duplicate effects on retry.
- Include account-scoped API/authentication and the minimum synchronization protocol in early phases. Recheck authorization on upload and detect stale revisions. Simultaneous multi-device recording remains out of scope.
- First sign-in and uncached data download require connectivity. Session expiry does not prevent prepared local recording. Signing out locks local account views; another account must not see or upload pending work from the previous account.
- Backup/export and recovery tooling are backlog items, not current implementation gates. Browser storage is not guaranteed permanent; unsynced work has no remote copy yet.

## 14. Derived state and invariants
- Active lineup is derived from starters/player-in/player-out history (or equivalent canonical initial events).
- Playing-time intervals are derived from the same history; no `PlayerStint` persistence required initially.
- Do not assume a card automatically changes on-field state.
- A player cannot normally be put on twice consecutively or taken off while absent; define how historical corrections resolve inconsistent sequences.
- A single player's team membership must not determine historical match participation.
- Spatial events without position remain valid. Non-movement events may omit game time; player-in/out cannot.

## 15. Technical baseline
- Next.js App Router with separated server code and thin API Route Handlers.
- PostgreSQL for accepted shared records; IndexedDB/Dexie for local working data, outbox and undo.
- Zustand for temporary UI state, scoped to the mounted recorder/account lifecycle.
- next-intl from Phase 0 with English/pt-PT catalogs, typed message keys and persisted language selection. Keep URLs independent of locale and `/offline` unprefixed; see `localization.md`.
- One root Next.js project. Phase 0 contains setup and the translated shell only; add domain and transport code when an authorized feature needs it. Keep the prototype in one package and discuss added packaging complexity before introducing it.
- Server services own authorization/business workflows and transactions; repositories own account-scoped storage access.
- Local and server workflows share deterministic domain functions, not a transaction spanning both databases.
- SVG rink with stable normalized coordinates and tested pointer conversion.
- Prove App Router offline boot/navigation and authentication boundaries before broad feature implementation.
- Authentication provider, database-access library and stable PWA tooling are selected before their dependent phases. See `architecture.md` and `backlog.md`.

## 16. Acceptance scenarios
1. One player belongs to senior and U19 teams, and can appear on either team's game roster with a match-specific number.
2. Operator records a shot with no coordinates and no match clock, then edits its result afterward.
3. Operator records a field-first recovery with coordinates, then a player-first loss without coordinates.
4. Operator issues a blue card to an active player; on-field count stays unchanged until a separate player-out action.
5. Operator removes a player without putting anyone on; on-field count decreases.
6. Operator corrects a drifting clock; previously recorded event times stay unchanged.
7. Operator records events offline, reloads the app, and retains the game and timeline.
8. Operator undoes the latest event, edits an older event, and deletes a mistaken player-in/out event without silently corrupting lineup state.
9. The same event can be recorded via player-first, action-first or field-first and has equivalent persisted meaning.
10. Tablet, phone and desktop layouts allow all core workflows without a mouse or keyboard.
11. Operator records offline, reloads and reconnects; retries create exactly one server effect and retain local undo history.
12. Expired online authentication pauses synchronization without discarding local recording. A different signed-in account cannot view or upload those pending commands.
13. Recovery without a subtype and foul without a player cannot commit. Closing add-event UI leaves no hidden draft.
14. An earlier server acknowledgement cannot overwrite a later pending local correction.
15. Player-in/out without game time cannot commit locally or through the API. Manual time permits movement entry without a running clock; edits cannot clear it.
16. `/offline` opens saved games with no network/session refresh. Unprepared IDs and management/creation workflows remain unavailable there.
17. English/Portuguese selection persists after reload and works offline without losing a draft, clock or pending records. All recorder labels, errors and accessibility messages are translated.

## 17. Defaults and remaining decisions
- Configurable periods, countdown initially and no inferred roster/on-field limits. Competition presets remain unconfirmed.
- Movement time is required; use a known clock value or manual entry. Other events may be untimed.
- `/offline` is limited to prepared-game recording. Online routes handle preparation and management.
- English and `pt-PT` use next-intl from Phase 0 with locale-independent URLs.
- Every foul requires a player. Official foul counts, reset rules and thresholds are deferred.
- Working shot vocabulary uses exclusive goal, non-goal on-target, off-target and blocked outcomes. Confirm edge cases before that phase.
- Fixed labelled rink frame, explicit attack direction per period and no automatic end swap.
- Historical contradiction behavior is specified in `domain-model.md`.
- Score display is deferred until opponent-score entry/corrections are specified.
- Backup/export remains in `backlog.md`.

## 18. Delivery priority
Establish Next.js, account-scoped API persistence and offline boot in early phases, then prove a thin local recording/synchronization slice. Expand incrementally to roster management, simple countdown, lineup, event variants, field interaction, alternate paths and corrections. Match recording must never require a live API. Analytics and backup/export remain deferred. See `development-plan.md` for phase dependencies, tests and acceptance criteria.
