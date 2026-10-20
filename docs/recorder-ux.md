# Recorder UX

The current layout is a working prototype. A larger visual/interaction redesign is deferred. Keep existing reusable controls, long-text wrapping, keyboard access and touch targets while preserving these data rules.

## Setup and navigation

The `/app` menu links Players, Teams and Matches. Lists provide search, a New action and reusable list items. Creation uses separate pages with labeled inputs, validation and retained input on failure.

Team details support multi-selection of existing Players, optional jersey numbers and roles. Existing membership fields are editable. Match creation chooses a Team and called-up Players, with optional date/venue. Pre-start editing preserves existing snapshot identities. Start selects four field starters and one goalkeeper, periods/durations and optional initial attack direction.

Fixed query-based details/Start/live pages work offline for available records. Setup Matches offer editing and Start; live Matches offer Resume; completed Matches show a read-only summary with score and timeline.

## Draft lifetime and state

Player-first and action-first entry open the same native modal and use one scoped Zustand store. The first tap captures event/operation IDs, wall-clock time, current period and any known match time. End-powerplay entry also freezes the targeted card ID. Later choices, language changes and failed-save retries retain that snapshot.

| State      | Behavior                                                                              |
| ---------- | ------------------------------------------------------------------------------------- |
| Idle       | Selecting a Player or action opens a fresh draft.                                     |
| Collecting | Each compatible choice fills missing details; completing the input starts local save. |
| Saving     | Ignore duplicate submission; prevent dismissal until the local transaction completes. |
| Failed     | Retain the exact input/IDs/time. Offer Retry or Cancel.                               |
| Saved      | Close and clear the draft after local commit; upload remains durable in the outbox.   |

Cancel, Escape and an outside-modal pointer gesture discard unfinished selection. Inside clicks do not dismiss. Close restores trigger focus. Navigation/reload drops unfinished drafts; committed events survive. No hidden draft persists behind a closed modal.

## Selection and required details

Both entry orders use the same [eligibility matrix](domain-model.md#eligibility-and-lineup). Hide incompatible actions and players. Recovery/loss/shot exclude bench players and goalkeepers; foul requires an active player; cards include eligible bench players. Card colour, recovery subtype, loss reason and shot outcome are explicit choices.

Ordinary substitution selects outgoing and incoming Players, from either participant-first direction or action-first. Save the pair as one event. Do not expose standalone player-out entry.

Known game time is captured automatically, including while paused. Substitution, Player in, blue/red card and powerplay completion require elapsed period time. When unknown, keep the modal open with manual minutes/seconds inputs. Optional position creates no extra mandatory step. No rink click means position stays absent; rink interaction is not yet implemented.

## Card and powerplay flow

- Yellow confirmation records the card and leaves lineup/powerplay unchanged.
- Blue/red at five removes an active recipient or asks which active Player should leave for a bench recipient.
- Blue/red at four requires a replacement for an active recipient, or queues the penalty without lineup changes for a bench recipient.
- The third blue warns of red exclusion before confirmation and shows that consequence in the timeline.
- Display current powerplay capacity and the number of queued penalties.
- End current penalty requires explicit confirmation. A stale target fails rather than ending a different penalty.
- When the final penalty ends, show Player in while capacity is available. Select an eligible bench Player without an outgoing Player.
- There is no temporary individual suspension control or automatic penalty timer.

Each card saves its required effects atomically. Undo reverses those effects together. See [Card rules](domain-model.md#cards-and-powerplay).

## Clock, score and lifecycle

Display countdown when the period has a duration; otherwise show known elapsed time or Untimed. A positive duration is required to run the clock. Support Start/resume, Pause and manual adjustment. Render from the stored anchor rather than accumulating UI ticks. Pause at zero; do not advance periods automatically.

Clock adjustment uses remaining time when duration exists, otherwise elapsed time. Existing event timestamps never change with the clock. End period advances explicitly; End match confirms completion in the final period. These controls persist through the shared queue rather than uploading every display tick.

Our goal shots and opponent-goal entry update the derived score. Score correction accepts signed changes and cannot produce a negative score. No regulation foul threshold, powerplay duration or goal-driven penalty expiry is automated.

## Timeline and feedback

Show explicit event order, participant or substitution pair, details, period/time and delivery status. A card can additionally show the removed/replacement Player and third-blue red consequence.

Undo is available for the latest eligible local event, including after upload/reload. Downloading from another browser does not transfer that browser's local Undo journal. Errors retain data and describe retry or stale state. Distinguish saved locally from server acceptance, including pending event/Undo operations on Match list/details status.

Completed summaries expose no recorder mutations. Historical edits/deletes, redo, period correction and reopening completed Matches remain deferred.

## Responsive and language behavior

Support narrow screens, long/unbroken names, enlarged text, visible keyboard focus and touch access. Use text in addition to colour for state. Both catalogs are bundled. Language selection updates the visible UI without navigation, server refresh or losing draft/clock/pending data.

Browser checks have covered 320px layouts with enlarged text. Physical-device ergonomics and a full browser-family pass are still outstanding; see [Development plan](development-plan.md).
