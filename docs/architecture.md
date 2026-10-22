# Architecture

One strict-TypeScript Next.js App Router application contains the browser UI and authenticated sync API. Keep the current direct functions and feature folders. Repositories own database operations; services own business workflows and transaction boundaries.

## Completed-match analysis

CompletedMatchDetails reads the existing Match snapshot and useMatchEvents query. It composes MatchResult, TeamStatistics, MatchEventAnalysis and PlayerStatistics without mounting the recorder or its mutation hooks. Domain matchStatistics and playingTime functions derive read-only results from the saved history; no aggregate table or second authoritative statistics state is stored.

Feature-owned statistics components live in `client/features/statistics`. CardCounts shares accessible card colors/counts. Generic EventRink composes the existing HockeyRink geometry with positioned marker buttons, retaining the recorder renderer unchanged. StatisticsBreakdown composes the installed Mantine Progress control with labeled outcome values. These components receive data/callbacks and do not query storage themselves.

MatchEventAnalysis memoizes event descriptions, filtered data, marker inputs, category counts and breakdowns independently of event preview. MatchTimelineRow and individual EventRink marker buttons are memoized. The full timeline stays mounted in a bounded scroll area, with selection scrolling to an existing row. Compact rows use controlled popovers for full details, while desktop keeps a stable detail area. Virtualization is deferred until production measurements justify it.

Period and player selection belong to the completed page. MatchEventAnalysis owns category and transient event preview/pinning; PlayerStatistics owns sorting. All final/period scores remain unfiltered. Coordinates normalize to attack right, while missing locations stay in totals/history. Existing aggregate/event delivery feedback remains available. No API, SQL, IndexedDB, command version, package or offline-route change is required.

## Stack and responsibilities

| Area                            | Implementation                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| Routing and server delivery     | Next.js App Router with thin route entries and Route Handlers.                      |
| Browser views                   | React client components with adjacent CSS modules and interfaces.                   |
| UI foundation                   | Mantine controls/theme, CSS Modules for application layouts and Lucide React icons. |
| Domain and transport validation | Shared Zod schemas and pure Match rules.                                            |
| Local durability                | Dexie/IndexedDB with one dataset, metadata and one shared outbox.                   |
| UI query state                  | TanStack Query reading IndexedDB; no durable Query mutation queue.                  |
| Recorder selection              | One temporary Zustand draft store per mounted recorder.                             |
| Shared persistence              | PostgreSQL through Drizzle ORM and `pg`.                                            |
| Authentication                  | Better Auth username/password, database sessions and restricted admin creation.     |
| Offline delivery                | Serwist production worker with explicit generic HTML/RSC precaching.                |
| Localization                    | next-intl with bundled English/pt-PT catalogs.                                      |

Installed versions belong in `package.json` and the lockfile. Setup and commands are in the [README](../README.md).

## Source layout

```text
src/
  app/                 Route entries, layouts, auth/sync handlers and manifest
  client/
    components/        Reusable controls and layouts
    pages/             Complete named page views
    features/          Account, Players, Teams, Matches and shared synchronization
    storage/           Lazy Dexie connection, migrations, status and notifications
    query/             TanStack Query provider
    pwa/               Worker/cache readiness and update feedback
    i18n/              Client locale provider
  domain/              Entity schemas, form inputs and pure Match logic
  contracts/           Shared versioned sync contracts
  server/
    auth/              Better Auth configuration and session checks
    db/                SQL schema modules, pool and transaction type
    features/          Account-scoped repositories and transactional workflows
  worker/              Service worker and full offline route-payload handling
  i18n/                Supported locales, catalogs and saved preference
  messages/            English and Portuguese JSON catalogs
  offline-pages.ts     Explicit generic offline route allowlist
scripts/               Interactive account creation helpers
drizzle/               SQL migrations and generated metadata
```

App Router entries compose named pages directly. Do not re-export other route entries or select views through a central pathname switch. Reusable controls belong in `client/components`; feature-specific forms/state stay in their feature. Queries and mutations retain separate folders.

The root layout composes LanguageProvider, ThemeProvider and one shared AppShell, AppHeader and AppFooter. Page entries no longer wrap separate shells. AppShell uses the pathname for sign-in layout and account-action placement; the Better Auth session hook controls whether Sign out is shown, with an exception for pending sign-out and failed local cleanup. Server session checks and LocalAccountSetup still own access decisions. LocalAccountSetup redirects only when both local ownership and an online session are absent; initialized local use does not depend on a current session. SignOutDialog adds confirmation and a fresh pending/blocked count around the existing sign-out/cleanup workflow. AppFooter displays the existing sync store through useSyncStatus and owns compact status plus a details dialog; SyncLifecycle remains mounted once beneath LocalAccountSetup and QueryProvider. PwaStatus and LocalStorageStatus render detailed feedback from state owned by the footer. AppMenu composes reusable NavigationCard links for the menu page. One navigation destination list supplies these cards, desktop header links and the compact-screen drawer. AppHeader stays sticky above page content, owns drawer presentation and hands Sign out to the existing shell confirmation after closing. PageHeader and BackLink share page introductions and explicit parent navigation. SearchToolbar and EntityRow provide reusable list composition; PlayerRow composes a compact delivery indicator, PlayerAvatar and the shared PlayerActionsMenu with unavailable Edit/Delete actions. PlayerDetailsPage reuses those identity/actions through PageHeader and adds PlayerMemberships. The membership query uses the existing TeamPlayer playerId index; stored values are validated by the repository. The component joins these records with the existing active-team query for display, handles missing teams explicitly, and uses the existing teamPlayers/teams invalidation prefixes. This is read-only and adds no storage version, service workflow or API. EntityRow keeps the details link separate from status/actions and truncates long names on one line. Its optional description adds one truncated metadata line without changing Players. TeamsListPage reuses PageHeader and SearchToolbar, while TeamRow composes EntityRow with TeamMark, optional category/season and compact DeliveryStatus. TeamDetailsPage reuses TeamMark and PageHeader for the team profile. TeamPlayers puts Add players beside its heading, and TeamMembership reuses EntityRow, PlayerAvatar and compact delivery/edit controls. EntityRow supports optional full-width children for duplicate-number warnings. TeamMembership keeps its pencil mounted and opens ResponsiveFormDialog around MembershipFields instead of expanding an inline form. ResponsiveFormDialog uses Mantine Modal, with a centered laptop dialog, full-screen phone presentation, scrollable fields and separate submit/cancel actions. It avoids automatic text-field focus, restores trigger focus and blocks dismissal while pending. Phone height follows visualViewport resize events where available, with a dynamic-viewport CSS fallback. MembershipFields uses TextInput and a labelled SegmentedControl with shared semantic theme styling. The segmented selection uses a pill-shaped mint gradient and a 180ms indicator slide, disabled under reduced motion. Input and button radii are independently controlled by --radius-input and --radius-button; --radius-icon defaults to the pill token for circular icon actions. Navigation and outer surfaces retain their own radius tokens. Mantine and legacy buttons share the button token, and pill search controls remain fully rounded. ResponsiveFormDialog owns a compact window header, smaller close glyph, translucent desktop surface and left-Cancel/right-Save action layout. Dialog glass, overlay and selection gradient colours use global semantic tokens; full-screen phone content retains the solid application canvas. Membership validation and revision-aware mutation remain unchanged. PlayerAssignmentDialog owns the two-step Add players draft and existing batch mutation; TeamPlayers retains the roster and launcher. Its selection step excludes existing members and composes SearchField with SelectableEntityRow checkbox targets, while configuration reuses MembershipFields. SearchToolbar composes SearchField with its existing New link. ResponsiveFormDialog adds an opt-in stable-height larger flow layout, disabled-submit support and secondary Back action; the membership editor keeps its compact defaults. Closing drops the assignment draft and returns focus to the launcher. EditTeamDialog owns the Team editing draft, validation and existing update mutation; TeamDetailsPage retains its pencil and stable profile/roster. TeamFields supplies the controlled Name input, optional category Autocomplete and optional SeasonPicker to both creation and editing. Category presets allow custom strings. SeasonPicker uses Mantine YearPickerInput and date/season string conversion, with an editable fallback for existing nonstandard season text. The dialog captures the revision at opening and retains failed/conflicted drafts. NewTeamPage uses PageHeader and unboxed FormLayout with TeamFields, validates through the existing schema and opens team details after local creation. Legacy TeamForm was removed after its last caller migrated. NewMatchPage uses feature-owned NewMatchWizard, MatchDetailsFields, MatchCallUpSelection and MatchCallUpReview. The creation draft lives in component state across the Details, Call-up and Review steps; editing a called-up player changes only that draft. Team changes confirm before clearing the selection. The wizard reuses existing local Team/Player/membership queries and the atomic useCreateMatch mutation; setup editing uses separate Edit details and Edit call-up actions. MatchDetailsPage composes the actual matchup heading, lifecycle/delivery indicators and read-only compact call-up rows. Setup links to the existing Start page; Live links to the existing recorder. CompletedMatchDetails renders the read-only analysis described above without mounting EventRecorder. EditMatchDetailsDialog reuses ResponsiveFormDialog and MatchMetadataFields, which are also composed by the creation fields. Metadata controls adapt to their container width. EditMatchCallUpPage owns a two-step Select/Review draft on the existing /app/matches/view?id=…&edit=call-up route. MatchFlowProgress is shared with creation. getMatchCallUpCandidates joins current memberships/players with retained MatchPlayer snapshots, preserving snapshot names and availability after membership removal. Both editors capture the opening revision and use the unchanged useUpdateMatchSetup mutation; failed drafts remain visible. Legacy MatchForm and MatchPlayerSelection were removed after their final callers migrated. PageHeader supports an opt-in second action row on phones for the matchup header; other callers keep their existing layout. FormLayout supports optional Back and disabled-submit controls; SelectableEntityRow supports optional metadata/disabled state. Mantine Select, DatePickerInput and Stepper share semantic theme styling. Venue uses the existing SegmentedControl styling with an optional clear action. Mobile Match creation progress uses evenly spaced, edge-aligned markers and a sticky offset shared with AppHeader through global header-height/spacing tokens. MatchCallUpSummary and MatchReviewSummary own compact counts and the matchup introduction. Visited-step navigation handles returning to Match details. FormLayout provides an opt-in wizard layout with a sticky mobile Back/primary action row; its other callers retain their existing action layout. MatchesListPage composes PageHeader, SearchToolbar and feature-owned MatchRow/MatchStatusBadge. MatchRow derives call-up counts and optional date/venue from the existing MatchSnapshot and keeps its detail link separate from compact DeliveryStatus. Lifecycle pills reuse semantic color tokens. The list preserves existing local queries, normalized search, creation-date ordering and routes without adding persistence or service workflows. The list retains its existing local query, search and sorting; editing stays in the existing details view. DeliveryStatus keeps its existing status classification and supports an optional compact icon/tooltip presentation; other callers retain text. Use the small Mantine theme for control defaults, global semantic color/surface variables for reuse, and adjacent CSS Modules for component styling. LanguagePicker composes Mantine controls around the existing locale provider. FormLayout provides an unboxed form column, field spacing, form-level feedback and equally sized compact submit/cancel actions. Phone language selection lives in the drawer bottom; sign-in keeps header language access because it has no drawer. The Mantine theme disables whole-control active movement and label text trimming; NavigationCard keeps its internal arrow motion and a small icon scale; BackLink animates only its arrow. NewPlayerPage uses Mantine TextInput directly and retains feature validation/mutation/navigation. Legacy EntityForm callers migrate only during their own page increments. Do not create a wrapper for every library component.

## Workflow boundaries

1. A page/form collects input and uses shared validation for feedback.
2. A query reads the local repository. A mutation calls the local service with `networkMode: always`.
3. The service validates current account/domain state and commits records, history if needed, and outbox commands in one IndexedDB transaction.
4. `localDataEvents` notifies this tab and other tabs to invalidate appropriate queries.
5. One foreground coordinator pushes the shared queue, applies durable acknowledgements, then downloads accepted collections.
6. A Route Handler authenticates the request and validates its expected owner and transport payload.
7. The server command service reserves a receipt and calls the feature workflow within one PostgreSQL transaction.

There is no transaction spanning IndexedDB and PostgreSQL. Retry-safe receipts bridge delivery failures. [Offline and sync](offline-sync.md) describes the concrete protocol.

## Shared and feature-owned logic

`domain/matches/matchRules.ts` owns eligibility, lineup and powerplay guards. `derivedMatchState.ts` derives score, availability and penalties. `matchControl.ts` calculates clock/lifecycle transitions. These functions have no React/database dependencies and are shared by UI selectors and transactional services.

Repositories query and map stored rows. Services coordinate meaningful actions such as starting a Match, adding an event or undoing it. Keep explicit insert/update methods. Do not introduce repository factories, database providers, per-table queues, generic CRUD registries or a general sports engine without a concrete requirement.

Zod validates form inputs, unknown stored data and transport boundaries. TypeScript contracts, runtime validation and Dexie keys/indexes serve different purposes; `stores()` does not validate every property.

## Runtime state

- IndexedDB owns working entities, local undo history and durable operations.
- TanStack Query owns temporary read/mutation UI state and is invalidated after writes and synchronization.
- Zustand owns only the open recorder draft. It never holds the only copy of a committed event.
- `useSyncExternalStore` subscribes React to database, sync and locale modules whose state also changes outside React.
- A DOM event refreshes this tab. BroadcastChannel notifies other tabs on the same origin. These notifications carry invalidation hints, not authoritative records or credentials.

Web Locks serialize synchronization across tabs. IndexedDB transactions and server expected revisions enforce data consistency. Recorder-tab exclusivity and automatic multi-device conflict merging are not implemented.

## Account and offline boundaries

One metadata record binds the local dataset to its authenticated owner. There are no workspaces or per-player local owner fields. PostgreSQL entities and receipts are scoped to the authenticated user; metadata never authorizes an API request.

The public static `/app` pages contain generic UI only. Local account setup gates hockey features after initial online sign-in. Session expiry does not prevent local use. Server-dependent account pages and APIs are outside offline caching.

See [Account authentication](account-auth.md), [Domain model](domain-model.md), [Recorder UX](recorder-ux.md) and [Localization](localization.md) for their respective decisions.

## Match duration and preparation

MatchDurationField is shared by creation Details and Edit details. It offers preset minutes per half and a custom NumberInput. The pure domain matchFormat module owns category defaults and conversion to two stored periods. NewMatchWizard applies the selected Team category default on Team changes, retains overrides across steps and includes the chosen format on Review. U-13 joins the existing Team category presets. The Match overview displays the saved format.

Creation requires regulationPeriodsSchema: two sequential halves with equal positive durations and left-to-right attack direction by default (legacy unspecified directions remain readable). updateMatchSetup accepts an optional period replacement; omission preserves the current format during call-up editing. Setup snapshots retain legacy empty-period compatibility. startMatchInput carries only Match ID, expected revision and starter IDs; the service validates and uses the stored format. The server also rejects changing an already configured format through Start. Older queued Start commands for empty-format setup remain readable/acceptable under their existing snapshot contract. No SQL or IndexedDB schema migration is required because periods already lives in the stored Match JSON.

StartMatchPage composes PageHeader and feature-owned StartMatchForm with grouped SelectableEntityRow controls, role counters and shared FormLayout sticky mobile actions. It requires four field starters and one goalkeeper. Missing duration and insufficient call-ups link back to the relevant setup flow; failed starts preserve selections. Starting retains the existing atomic snapshot/outbox transaction and opens recording with a paused zero clock.

### Live recorder composition

LiveMatchPage composes EventRecorder directly for live matches. EventRecorder coordinates the existing queries, draft store and mutations; RecorderHeader, MatchControls, RecorderPlayers, RecorderActions, EventEntryDialog and RecorderTimeline own their sections. Feature-owned RecorderDialog provides the full-screen phone/glass desktop shell without nesting event forms. eventDraftSteps selects one missing choice at a time. Short event-entry flows offer cancellation without Back navigation; the draft retains captured identity and time through later choices. AppShell hides its header/footer only when the live recorder is actually rendered on the live route; auth/sync providers stay mounted.

For desktop live recording, AppShell allocates viewport height through its existing flex layout, retaining the actual header/footer heights and the recording board's minimum content height. EventRecorder places the board and timeline in independent columns. RecorderTimeline opts into size containment and internal scrolling only for the desktop live view, keeping event count out of the board's height calculation and its heading outside the scrolling list. MatchScoreboard presents scores, countdown and penalties using EventRecorder's existing time updates. RecorderHeader and MatchScoreboard share the sticky region; MatchControls retains clock mutations, automatic pause and dialogs in normal flow below it. The completed summary uses its own bounded MatchEventAnalysis timeline on every layout.

period.direction extends the existing match.control action schema. applyMatchControl validates the live transition and changes only the current period; the local transaction and server workflow retain revision checks. The SQL control update persists the periods JSON as well as the clock/lifecycle fields. No SQL columns, IndexedDB version, package or offline route changes are needed.

RecorderContext shares the compact identity/action/frozen countdown row across recorder dialogs. formatCountdown in the domain clock module is used by the board, event dialogs and timeline without rewriting stored elapsed values. NumberStepper composes Mantine NumberInput handlers with accessible ActionIcons; DurationCounter owns presentation and bounded carry/borrow, reused by clock adjustment and EventTimeForm. EventEntryDialog owns score-correction draft values and validates the opponent delta; ScoreCorrectionForm renders aligned scores and associates with the footer Save button through its form ID. Recovery/loss half is a required current input and optional stored legacy field. Version-4 commands enforce the new fields while older commands retain separate validation. SQL migration 0012 adds the nullable half column; repositories map it without interpreting its meaning.

### Clock-linked team powerplay

The pure powerplay module supplies two-minute blue/four-minute red defaults and cumulative playing-time conversion across closed halves. deriveMatchState replays timed cards, sequential expiry and powerplay-adjust corrections before projecting the current Match clock. Services validate incoming actions at their captured game time. No background completion event or timer write takes over Undo. A later recorded event preserves an expiry even after a backward clock correction. Historical cards without saved durations retain manual completion until corrected.

EventRecorder projects the clock and delays the final-penalty Player in picker until existing event/control dialogs close. RecorderPlayers owns the red powerplay status and remaining Player in action. MatchScoreboard composes PowerplayIndicator beside the main clock with the total remaining time across current and queued penalties; PowerplayCorrectionDialog freezes the target/time, reuses DurationCounter and saves correction/completion through the existing mutation. The dialog lists all queued penalties and retains exact failed input for Retry. Opponent penalties and personal temporary suspension restrictions remain outside this scope.

Version-5 event commands carry timed cards and powerplay-adjust events. SQL migration 0013 adds nullable powerplay_duration_ms; repository mapping preserves it for cards/corrections. IndexedDB needs no version or index change. Existing command versions remain readable; pre-v5 writes conflict after timed-powerplay history exists.

### Shared rink and rink-first recorder

HockeyRink owns the approved inline SVG geometry and renders supplied display-relative markers/selection and half labels with theme-aware colors. It has no Match queries or recording rules. RinkPositionPicker adds rounded-boundary hit detection, inverse SVG screen-coordinate mapping, keyboard adjustment and a cropped rendering of the same rink for 1.5× touch magnification. The lens sits above or below the finger without a reserved layout gap; its drawing omits half labels. CSS selects short touch guidance or full pointer/keyboard guidance. It consumes the release click before transitioning to choices. Its temporary gesture state never writes records.

EventRecorder keeps controls and lineup in its left column, and composes a capped rink above the bounded timeline in its right column. RecorderRink exposes desktop and compact presentations with the same recorder callbacks; only one rink picker is rendered. The compact glass-style control reuses HockeyRink as a small illustration between actions and players. Desktop help sits beside the click instruction. RecorderTimeline keeps its heading outside the scrollable event list on desktop. RecorderRinkPicker supplies Attack/Defence labels, defensive-half shading and explicit direction setup for unknown legacy values through the existing match.control mutation. Pure domain rinkPosition functions convert display coordinates to/from the existing normalized team-relative frame and derive recovery/loss half.

EventRecorder captures identity/time/direction at first valid contact and accepts position only on release. Its existing scoped draft store and mutation still own event creation, exact failed-save Retry and Undo. EventEntryDialog changes between picker and choices in one RecorderDialog, with a full-width rink preview. Change position preserves capture context; event dialogs retain Cancel without Back navigation. Recorder busy locks also defer automatic Player in prompts during gestures. Rink-first entry itself needs no API, command version, SQL/IndexedDB migration, package or route-cache change. Completed-match overlays reuse HockeyRink through EventRink as described above; the live rink shows only the current selection.

RecorderRinkDirection supplies a shared, read-only rink and arrow preview to RecorderDirectionDialog and the unknown-direction options in RecorderRinkPicker. The former retains its existing Left/Right control and Save; the latter retains immediate direction saving. Both still use the existing match.control mutation.
