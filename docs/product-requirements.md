# Benchline Stats | Product Requirements Document

**Status:** Draft for architecture planning  
**Repository working name:** `hockey-stats`  
**Product working name:** Benchline Stats  
**Target:** V1 live roller-hockey match recorder

## 1. Product overview
Benchline Stats is an offline-capable, responsive web application for coaches and match observers to record player-specific events during roller-hockey games. Its primary product is a fast, reliable live recorder; analysis and dashboards are later phases.

## 2. Problem and users
A single observer needs to record match events in real time on a phone, tablet, or laptop, often with unreliable connectivity. Recording must require minimal taps, tolerate mistakes and clock drift, and never require optional contextual data.

**Primary users:** coaches, assistants, and match analysts managing one or several teams or age categories.

## 3. V1 goals
- Manage teams and players, including players belonging to multiple teams/age categories.
- Create games, select a participating team and match roster, and mark the starting lineup.
- Record player-level events quickly through player-first, action-first, and field-first interactions.
- Record independent player-in and player-out events and correctly display variable on-field player counts.
- Record cards, shots, possession losses, recoveries, and team fouls.
- Allow optional normalized field coordinates and optional match-clock timestamps.
- Show a live event timeline with immediate undo and historical edit/delete.
- Preserve recording locally without network connectivity, including after ordinary page reloads.
- Support phone, tablet, and desktop layouts; prioritize tablet ergonomics.

## 4. Explicit non-goals for initial V1
- Advanced analytics, heatmaps, season dashboards, or automated statistics projections.
- Assist tracking, opponent player tracking, video synchronization, AI, or automated event detection.
- Quick-substitution mode; use independent player-in/out actions.
- Native mobile apps or app-store publication.
- Mandatory accounts, cloud sync, or multi-device collaboration for the first usable local recorder. Assess these as later phases.

## 5. Domain concepts
### Team
Represents a squad or age category (e.g., senior, U19). Name, optional category and season metadata. Do not assume a player belongs to only one team.

### Player
Independent identity, not owned by a team. Contains name and optional metadata.

### TeamPlayer
Many-to-many association between team and player. Optional team-specific jersey number and membership status. Consider temporal membership/season if useful without overengineering.

### Game
Participating team, opponent name, optional title, date, competition, home/away, status, and configurable period/clock settings. A game is recorded from one team's perspective.

### GamePlayer
Snapshot of the selected game roster with player identity, jersey number at match time, and starting status. Historical games must not change when team membership or jersey numbers change.

### GameEvent
Canonical persisted record of a match occurrence. Suggested common attributes: stable ID, game ID, optional game-player ID, event type, period, optional game-time value, optional normalized x/y coordinates, event-specific attributes, creation time, and revision/deletion metadata as needed. Event-specific fields should be validated by type rather than allowing arbitrary invalid combinations. Final SQL/TypeScript representation is an architecture decision.

## 6. Event vocabulary and attributes
| Event | Player | Details | Coordinates |
| --- | --- | --- | --- |
| Shot | Required | goal, saved/on target, off target, blocked (confirm exact taxonomy) | Optional |
| Ball loss | Required | intercepted pass, failed individual action, other | Optional |
| Ball recovery | Required | interception, duel, loose ball, other; subtype may be skipped if too slow | Optional |
| Team foul | Optional | team-foul occurrence; clarify player attribution and running foul count | Optional |
| Card | Required | yellow, blue, red | Optional |
| Player in | Required | none | Not applicable |
| Player out | Required | none | Not applicable |

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

**Action-first:** select quick action → select player (if required) → choose mandatory details → commit.

**Field-first:** tap rink position → select action → select player (if required) → choose mandatory details → commit.

A temporary draft may hold player, action, coordinates, period/time snapshot and details. The user must be able to cancel/back out without persisting incomplete events. Commit immediately once all required data is supplied; avoid unnecessary confirmation screens. Optional fields must not create extra mandatory steps.

**Cards:** player → card → colour → commit.  
**Player out:** active player → take off → commit.  
**Player in:** bench player → put on → commit.

For game events, prevent accidental double taps and invalid transitions while still allowing explicit historical corrections.

## 11. Game clock and periods
- Every event has a real-world `createdAt` for auditing/order; game time is optional.
- Support period selection, start, pause, resume, and manual clock correction during play.
- Clock time can be captured automatically at commit or entered/edited manually; recording works without an active clock.
- Correcting the current clock affects **future** events, not timestamps already stored.
- Define whether displayed clock counts up/down and how match-period boundaries behave before implementation. Avoid coupling timing logic to UI rerenders.
- Support editing historical event period/time independently.

## 12. Timeline, undo, edit and delete
- Display events in a predictable order even when match time is missing or manually corrected.
- Immediate undo reverses the last user operation, including player-in/out and other compound changes if any.
- Historical edit changes player, event-specific details, coordinates and period/time where applicable.
- Historical deletion must recompute derived on-field lineup from the corrected sequence.
- Ensure undo/edit/delete are persisted locally and remain consistent across reloads.
- Decide whether to use immutable corrections/tombstones or mutable local records; document tradeoffs. An append-only event log is a design direction, **not** a prohibition on corrections.

## 13. Offline-first behavior
- Core recording, game setup, lineup, clock, timeline, edits and undo work without a network connection after the app is installed/cached.
- Local data writes must be durable before the UI claims an event was saved; handle quota/storage failures visibly.
- Avoid depending on a live server for any match-critical interaction.
- Protect active recording sessions from unexpected service-worker updates/reloads.
- Consider export/backup and data-loss recovery before production use; browser storage is not guaranteed permanent.
- Cloud synchronization, account management and conflict resolution are deferred unless architectural analysis shows a minimal earlier requirement.

## 14. Derived state and invariants
- Active lineup is derived from starters/player-in/player-out history (or equivalent canonical initial events).
- Playing-time intervals are derived from the same history; no `PlayerStint` persistence required initially.
- Do not assume a card automatically changes on-field state.
- A player cannot normally be put on twice consecutively or taken off while absent; define how historical corrections resolve inconsistent sequences.
- A single player's team membership must not determine historical match participation.
- Events without position or game time remain valid.

## 15. Technical decisions to investigate, not prescribe
- React + Vite PWA versus Next.js PWA; compare offline complexity, SSR benefit, routing, hosting and developer experience.
- Integrated Next.js server/API versus independently deployed Fastify or NestJS backend, including whether backend is necessary for first local-only milestone.
- IndexedDB persistence (possibly Dexie), UI state management, validation and test strategy.
- Monorepo versus single frontend repository with later extraction.
- Future PostgreSQL schema/Drizzle and sync strategy without prematurely implementing them.
- Canvas versus SVG for a responsive tappable rink, accessible touch targets and coordinate conversion.

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

## 17. Open questions for planning
- Confirm regulation-aware default periods, clock direction, and roster/on-field limits; make rules configurable where justified.
- Is a foul always team-level, or optionally attributed to a player? Should foul counters reset per period?
- Should shot outcomes distinguish saved vs other on-target attempts, and how are blocked shots classified?
- How should orientation change between periods? Is field position always relative to the tracked team's attack?
- What is the minimum safe offline backup/export path for an MVP?
- Should score be entered manually or derived from recorded goals, and how are opponent goals captured if score is displayed?

## 18. Delivery priority
First achieve a usable, reliable **local-only live recorder**. Add server/API, authentication, synchronization and analytics only as independently justified later phases. Prioritize user-tested recording speed and correctness over abstractions or visual polish.
