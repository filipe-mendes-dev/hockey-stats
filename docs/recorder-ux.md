# Recorder UX

## Creation draft lifetime

A creation draft exists only while the add-event UI is visible. Starting any entry path opens that UI, including a compact contextual panel. No draft lives behind a closed panel or survives reload.

Zustand stores the selected player, action, optional position and chosen details within the mounted recorder provider. Closing/cancelling, switching game/account or completing local save clears the draft. Edit-form state likewise exists only while its edit UI is open.

Completed events waiting for API acknowledgement are durable local operations, not drafts. Closing the add-event UI after a local commit must not discard those operations.

## State transitions

| State | Input | Result |
| --- | --- | --- |
| Idle | Select player, action or rink position. | Open add-event UI with that context. |
| Collecting | Select a compatible missing value. | Retain compatible choices and evaluate requirements. |
| Collecting | Select a different action. | Clear incompatible details and show its requirements. |
| Collecting | All required values supplied. | Freeze one command ID and enter local saving. |
| Collecting | Back. | Return to the previous step without a write. |
| Collecting | Cancel/close. | Clear creation state and close. |
| Saving locally | Repeated submission gesture. | Ignore it for that command. |
| Saving locally | Transaction commits. | Clear creation state, close UI, display event as saved locally. |
| Saving locally | Transaction fails. | Keep the UI open with the same selections and retry ID. |
| Saved locally | Server acknowledgement persists. | Display synced status. |
| Saved locally | Network/auth/conflict failure. | Keep the event and show pending/action-required status. |

Do not offer cancellation as if it can reverse an in-flight local commit. Finish or abort the transaction before dismissing; after success use undo. Every transition that closes the UI also clears its memory draft.

Do not carry a previous event's player, action, coordinates or timestamp into a new event automatically.

## Required details

| Event | Required values beyond game/period | Optional context |
| --- | --- | --- |
| Shot | Player and outcome. | Position and game time. |
| Ball loss | Player and reason. | Position and game time. |
| Ball recovery | Player and subtype. | Position and game time. |
| Team foul | Player. | Position and game time. |
| Card | Player and colour. | Position and game time. |
| Player in/out | Player, period, game time and valid live transition. | None. |

No team-only foul path exists in V1. Recovery subtype cannot be skipped. `other` is an explicit valid reason/subtype, not an automatic fallback.

Player-in/out capture established clock time automatically. If unavailable, keep add-event UI open and require manual period/time before saving. A running clock is unnecessary, but a known time is mandatory. Historical edits cannot clear movement time.

## Entry paths and tap counts

All paths use the same canonical domain command. Only context supplied by the observer differs.

| Event | Player-first | Action-first | Field-first |
| --- | --- | --- | --- |
| Shot | Player, shot, outcome: 3. | Shot, player, outcome: 3. | Position, shot, player, outcome: 4. |
| Loss | Player, loss, reason: 3. | Loss, player, reason: 3. | Position, loss, player, reason: 4. |
| Recovery | Player, recovery, subtype: 3. | Recovery, player, subtype: 3. | Position, recovery, player, subtype: 4. |
| Foul | Player, foul: 2. | Foul, player: 2. | Position, foul, player: 3. |
| Card | Player, card, colour: 3. | Card, player, colour: 3. | Position, card, player, colour: 4. |
| Player in/out | Player, movement: 2. | Movement, player: 2 if exposed. | Not applicable. |

Counts assume visible controls. Opening a collapsed panel adds taps. Measure actual speed and error rate on target devices before adding shortcuts that omit required detail.

Movement tap counts assume a known clock value. Entering missing period/time manually adds interactions; do not avoid those steps by recording an untimed movement.

## Timeline and correction

- Show deterministic event order, player, kind, details and optional period/time.
- Distinguish saving locally, saved locally/pending, synced and action-required states with text as well as visual indicators.
- Open older events in an explicit edit UI with Save and Cancel.
- Allow player/details/time/position correction and position removal.
- Offer explicit historical placement when entering a missed event; changing time alone does not reorder it.
- Confirm deletion clearly and retain durable undo.
- Preview downstream lineup contradictions as described in `domain-model.md`.
- Keep undo available after reload. Serialize its inverse through the same durable command path.

Score is omitted until opponent-score input is specified. Foul regulation thresholds and resets remain unimplemented; any simple live count must be labelled as recorded events rather than an official penalty count.

## Simple first clock

Default display: countdown. Require a positive configured period duration to run the clock. Other events may remain untimed; player-in/out require captured or manually entered time even if the clock is not running. Manual countdown entry uses a known period duration for conversion to elapsed time; otherwise ask explicitly for elapsed time.

The first clock implementation needs only:

- Period selection, start, pause, resume and manual correction.
- Persisted running/paused state, elapsed milliseconds at anchor and anchor wall-clock time.
- Elapsed calculation from the anchor, not from how often the UI timer runs.
- Future-only effect for current clock corrections.
- Event capture at completed selection, before the local transaction.
- Explicit pause at zero and an explicit next-period action.

Persist controls immediately. A running clock continues across backgrounding and reload using the saved anchor. Device wall-clock changes may affect it; manual correction handles this in the first version. Do not add a monotonic/wall-clock reconciliation engine, drift diagnostics or cross-device clock handoff now.

Store event elapsed time without source provenance. The countdown UI converts it using the period duration. Never retroactively retime old events when correcting the current clock.

## Field and responsive layout

- Use a stable labelled SVG rink frame, with `x = 0` at the left end and `y = 0` at the top.
- Convert through the SVG transform; test scaling, rotation and letterboxing.
- Ignore outside-rink taps. Position remains optional.
- Shot position describes where the shot was taken.
- Choose attack direction per period explicitly. Unknown direction still permits coordinates.
- Tablet uses adjacent rink, lineup/action and timeline panels.
- Phone prioritizes player/action controls and uses compact rink/timeline sheets.
- Support long names, 360 CSS-pixel viewports, increased text size and touch targets of at least 44 CSS pixels.
- Keep keyboard focus, full accessible names and non-colour feedback for selected/active/pending states.

## Offline and language

The normal application supports team/player management, new-game setup, roster selection, recording, timeline, corrections and locally retained game history without connectivity. No match must be prepared online in advance. Account management and server synchronization require connectivity. Selecting an existing game requires its saved data; an unknown ID does not create one implicitly.

Use both message catalogs for controls, details, validation and accessibility labels. English/Portuguese switching in the local application must preserve the current draft and recording state. See [Localization](localization.md).
