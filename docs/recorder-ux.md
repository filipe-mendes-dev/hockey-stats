# Recorder UX

The live recorder uses the balanced board: a compact sticky scoreboard and clock, six main actions, then field/goalkeeper selection and bench. The centred goalkeeper retains a visible border. Phones hide the application header/footer and show recent events below; desktop places the full timeline beside capture controls. Overflow options provide score correction, attack direction, language and synchronization details.

On desktop, the recorder fills the space between the application header and footer. The left column holds the scoreboard, clock controls, compact actions and lineup. The right column holds a rink capped at 480px wide above the timeline. Only the event list scrolls within the timeline, leaving its heading visible; event count never changes the spacing between the scoreboard and recording actions. The page scrolls only when the recording controls need more height than the available space. Scores, clock and penalty indicators stay sticky with the recorder navigation; Start/Pause, clock adjustment and End half/Match scroll normally below them.

## Setup and navigation

The `/app` menu links Players, Teams and Matches. Lists provide search, a New action and reusable list items. Creation uses separate pages with labeled inputs, validation and retained input on failure.

Team details support multi-selection of existing Players, optional jersey numbers and roles. Existing membership fields are editable. Match creation chooses a Team and called-up Players, with optional date/venue. Pre-start editing preserves existing snapshot identities. Creation and pre-start detail editing configure two equal halves, with editable category-based duration defaults. Prepare match selects four field starters and one goalkeeper from grouped compact rows and uses the saved format. Legacy setup without duration links to Edit details. New configurations default to left-to-right attack direction for each half. The recorder offers two single-line direction options and can change the current half; older unknown values stay readable and select the left-to-right default in the control.

Fixed query-based details/Start/live pages work offline for available records. Setup Matches offer editing and Start; live Matches offer Resume; completed Matches show a read-only summary with score and timeline.

## Draft lifetime and state

Player-first and action-first entry open the same responsive dialog and use one scoped Zustand store. The first tap captures event/operation IDs, wall-clock time, current period and any known match time. End-powerplay entry also freezes the targeted card ID. Later choices, language changes and failed-save retries retain that snapshot.

| State      | Behavior                                                                              |
| ---------- | ------------------------------------------------------------------------------------- |
| Idle       | Selecting a Player or action opens a fresh draft.                                     |
| Collecting | Each compatible choice fills missing details; completing the input starts local save. |
| Saving     | Ignore duplicate submission; prevent dismissal until the local transaction completes. |
| Failed     | Retain the exact input/IDs/time. Offer Retry or Cancel.                               |
| Saved      | Close and clear the draft after local commit; upload remains durable in the outbox.   |

Cancel, the close control and Escape discard unfinished selection. Short event-entry flows have no Back control; later choices retain capture identity and time. Outside clicks do not dismiss the dialog. Close restores trigger focus. Navigation/reload drops unfinished drafts; committed events survive. No hidden draft persists behind a closed modal.

## Selection and required details

Both entry orders use the same [eligibility matrix](domain-model.md#eligibility-and-lineup). Hide incompatible actions and players. Recovery/loss/shot exclude bench players and goalkeepers; foul requires an active player; cards include eligible bench players. Card colour, recovery subtype, loss reason and shot outcome are explicit choices. Entry without coordinates also requests recovery/loss defensive or attacking half without preselection. New-event dialogs share one single-line player/action/countdown context and no stepper or Back control. The action sits beside the player name with both vertically centred; the period stays muted and only the countdown is bold and accented. Action choices reuse board icons; cards use semantic yellow, blue and red accents with text labels.

Ordinary substitution selects outgoing and incoming Players, from either participant-first direction or action-first. Save the pair as one event. Do not expose standalone player-out entry.

Known game time is captured automatically, including while paused. Substitution, Player in, blue/red card and powerplay completion require elapsed period time. When time is unknown, keep the modal open with manual remaining-time counters; legacy matches without a duration retain explicitly labelled elapsed-time entry. Optional position creates no extra mandatory step. No rink selection means position stays absent. Rink-first drafts offer only recovery, loss, shot, foul and card. Recovery/loss half follows the selected position; exactly halfway retains the explicit choice.

## Card and powerplay flow

- Yellow confirmation records the card and leaves lineup/powerplay unchanged.
- Blue/red at five removes an active recipient or asks which active Player should leave for a bench recipient.
- Blue/red at four requires a replacement for an active recipient, or queues the penalty without lineup changes for a bench recipient.
- The third blue warns of red exclusion before confirmation and shows that consequence in the timeline.
- Show compact blue/red outstanding-penalty indicators beside the main Match clock, with the summed remaining time of the current and queued penalties. Keep the main clock, period and running status centred within the scoreboard by reserving equal space on both sides of the clock. Queued cards remain visible and available in penalty details. Opponent cards are outside this increment.
- Near On field, show a restrained red Powerplay active label and the existing lineup count. Remove the standalone powerplay block.
- Selecting the indicator opens Correct powerplay. Adjust remaining time or set it to zero to complete the current penalty. Freeze target/time at opening and retain failed inputs for exact retry.
- Blue penalties last two minutes; direct red penalties last four. Team penalties expire by playing time, pause with the Match clock and carry across halftime. Queued penalties run sequentially. Match-clock corrections affect pending deadlines. No goal-driven expiry is automated.
- When the final penalty ends, open Player in while capacity is available. Preserve an open event/control dialog and prompt after it closes. Cancellation leaves Player in beside the lineup heading. Select an eligible bench Player without an outgoing Player; capture time when opening that picker.
- Derive automatic expiry without background event writes, preserving latest-event Undo. Historical cards without a duration require correction or explicit completion. Individual suspension restrictions remain deferred.

Each card saves its required effects atomically. Undo reverses those effects together. See [Card rules](domain-model.md#cards-and-powerplay).

## Clock, score and lifecycle

Display countdown consistently for the live clock, event dialogs and timeline using each event’s captured elapsed value and its own half duration. Use the same whole-second rounding everywhere. Missing duration/time displays unavailable time rather than an invented countdown. A positive duration is required to run the clock. Support Start/resume, Pause and manual adjustment. Render from the stored anchor rather than accumulating UI ticks. Pause at zero; do not advance periods automatically.

Clock adjustment uses remaining time when duration exists, otherwise elapsed time. Existing event timestamps never change with the clock. End period confirms before advancing; End match confirms completion in the final period. These controls persist through the shared queue rather than uploading every display tick. Attack direction can be set for the current period without altering the clock, other periods or historical events.

Our goal shots and opponent-goal entry update the derived score. Score correction aligns both team scores, shows our score as plain read-only text and edits only the opponent’s current total using shared minus/plus numeric controls. It has no repeated Save heading or inline submit button; Cancel and Save use the standard dialog footer, with Save filling the remaining phone width. Save appends a signed opponent adjustment and cannot produce a negative score. Historical own-score adjustments remain readable. Clock editing reuses the numeric controls, with minute/second carry and borrow, direct typing and bounded values; only Save persists changes. No regulation foul threshold or goal-driven penalty expiry is automated. Powerplay deadlines follow the saved card duration and playing clock.

## Timeline and feedback

Show explicit event order and delivery status in compact two-line rows. The participant or substitution pair occupies the first truncated line; the action and half/time share the second line, with time in the accent colour. Longer action details and card consequences remain available through the row tooltip on focus, hover or touch. Display 1st half and 2nd half in the selected language, retaining numbered period labels for legacy extra periods.

Undo is available for the latest eligible local event, including after upload/reload. Downloading from another browser does not transfer that browser's local Undo journal. Errors retain data and describe retry or stale state. Distinguish saved locally from server acceptance, including pending event/Undo operations on Match list/details status.

Completed summaries expose no recorder mutations. Historical edits/deletes, redo, period correction and reopening completed Matches remain deferred.

The completed-match summary leads with the result and compact team statistics, followed by a linked event map/timeline and player statistics. Period selection changes analysis totals; category/player filters apply only to the map, its breakdown and timeline. Hover/focus previews an event, click/tap pins it, and selecting a player scrolls back to their analysis. Desktop player columns are sortable; phone rows retain playing time, every shot outcome, recoveries/losses, fouls and card counts. Missing position, time and unreliable playing time remain explicit. Card consequences, substitutions, powerplay events, score corrections and delivery feedback remain accessible in the read-only timeline.

The summary timeline keeps its full history in a bounded scroll area on every layout. Rink selection scrolls to an existing row. Event rows retain two text lines; a location-unavailable icon and accessible explanation replace the third missing-position line. Stacked layouts show full selected-event details in tap popovers instead of a permanent help/detail box. Desktop reserves stable detail height. The compact result omits generated initials and redundant captions, aligns both team names and retains metadata/period scores. Section headings use the existing mint accent. These refinements do not change the live recorder.

## Responsive and language behavior

Support narrow screens, long/unbroken names, enlarged text, visible keyboard focus and touch access. Use text in addition to colour for state. Both catalogs are bundled. Language selection updates the visible UI without navigation, server refresh or losing draft/clock/pending data.

Browser checks have covered 320px layouts with enlarged text. Physical-device ergonomics and a full browser-family pass are still outstanding; see [Development plan](development-plan.md).

## Rink-first entry

The approved 2:1 rink stays visible above the desktop timeline without a separate heading or team goal labels. Give it the recorder's normal top inset. A short desktop click hint has keyboard/touch help beside it. Phones show a glass-style Record on rink control with a small rink SVG near the actions and open a dedicated full-screen picker. Keep the rink horizontal on every screen so it matches the observer view. Inside it, Attack and Defence labels sit slightly below the upper edge; Attack uses muted text and Defence uses the accent to match the defensive-half tint. Labels and tint follow the saved current-period direction. Unknown legacy directions require an explicit saved choice before selection. Direction choices include a rink preview with a directional arrow. No automatic half-time direction change is introduced.

Opening the picker does not capture an event. First valid contact freezes IDs, period, wall/game time and direction. Hold/drag previews a point through an offset 1.5× magnifier with a visible centre marker; release inside the rounded playable boundary accepts it and continues to the existing choices. Place the lens above the finger when there is room, otherwise below it, without reserving a large empty area above the rink. Touch instructions describe tap/hold/drag only; keyboard instructions stay available for fine pointers. Consume the release's compatibility click so it cannot select an action on the next screen. Outside release, pointer cancellation and multi-touch discard only the gesture. The temporary gesture snapshot is cleared on cancellation; there is no durable selection. Keyboard arrows move the marker, Shift uses finer steps and Enter accepts.

One recorder dialog changes between selection and choices. Change position preserves capture identity/time; only accepted position updates the draft. Event dialogs offer Cancel without Back navigation. Saving and exact failed-save Retry keep their existing locks. Rink selection blocks competing recorder controls and automatic entry prompts. Cancel closes and writes nothing. The clock continues. The selected point uses an accent centre, contrasting ring and dark halo that stay readable when the SVG shrinks. Event dialogs show a full-width rink preview and retain the accepted point on the background desktop rink until saving or cancellation. Position feedback announces the half to assistive technology without visible percentages. Initial live entry shows only the selected point; read-only saved-event overlays and filters belong to the completed summary. Cross-match analytics remain deferred. General font sizing and physical-phone ergonomics require separate acceptance.
