# Localization

Support English (`en`) and European Portuguese (`pt-PT`) through next-intl. English is the fallback. Application locale does not change the instruction to communicate with the developer in English.

The `statistics` catalog namespace covers the completed summary, metric definitions, period/category controls, event selection, sortable player columns, card counts and unavailable timing. Numeric counts and percentages use locale formatting; playing time remains a duration. Existing recorder translations describe canonical event kinds/details. The team on-target total includes goals; individual non-goal on-target outcomes have a separate explicit label in both languages.

## Files and bootstrap

- `src/messages/en.json` and `src/messages/pt-PT.json` contain matching keys and interpolation arguments.
- `src/i18n` defines supported locales, catalogs, preference and request configuration.
- `src/client/i18n/LanguageProvider.tsx` provides the selected locale/messages and updates document language.
- The next-intl plugin generates exact declarations for key/argument checking during type generation/builds.

URLs are independent of locale. Server rendering and initial hydration use deterministic English. After hydration, useSyncExternalStore restores the browser preference from localStorage key benchline.locale. Unsupported/absent values fall back to English. Storage restrictions allow session-only switching but may prevent preference persistence.

LanguagePicker lives in the wider header and near the bottom of the compact navigation drawer. Phone sign-in keeps it in the header because no drawer is available. The footer has no language control.

The New match DatePickerInput maps en/pt-PT to the dates library locale, uses localized display formatting and calendar navigation/clear labels, and stores the existing ISO date string. Wizard steps, selection feedback and Match-only editing are translated in both catalogs.

SeasonPicker maps en/pt-PT to the dates library locale and translates navigation, selection and clear labels through the catalogs. Category presets and existing custom category/season strings remain unchanged data values.

Both catalogs are bundled with the offline asset graph. Switching language requires no server refresh, navigation or remote translation fetch. It preserves current draft, clock and pending operations. Locale preference synchronization between tabs/accounts is not implemented.

## Message and formatting rules

### Voice and wording

- Write short, direct sentences in both languages. Give one instruction at a time and remove descriptions that only repeat a heading or action.
- Address the user as **tu** in European Portuguese. Use forms such as Escolhe, Seleciona, Introduz and Tenta novamente. Do not use você, formal imperatives or formal possessives such as o seu when addressing the user. Possessives referring to a player or another person remain valid.
- Keep Portuguese action labels in the infinitive, such as Guardar, Criar jogo and Terminar sessão. Use teu/tua only when ownership needs to be explicit.
- Write each language naturally around the same meaning rather than translating English sentence structure word for word. Keep the tone friendly and practical, without slang or promotional filler.
- Describe what the user can do. Keep implementation terms out of routine guidance. Errors explain what happened and the next action; mention retained input or data when relevant.
- Use short tooltips to identify icon actions. Use the shared click-to-open HelpPopover for longer explanations. Keep field requirements beside their inputs and action consequences visible in confirmation dialogs.
- Preserve limits, data-loss warnings, sharing access, offline requirements and the distinction between recorded data and actual match activity.
- Use consistent visible terms. In Portuguese, use ação for a recorded event, cronómetro for the match clock and sentido de ataque for attack direction. Use parte for the two standard halves and período for generic or historical periods. Canonical event keys and values stay unchanged.

### Catalogs and formatting

The `sharing` namespace covers the owner sharing dialog, access notice, create/copy/revoke feedback, synchronization/session errors and public unavailable/temporary-failure pages in both catalogs. Shared pages retain deterministic English SSR and browser locale restoration. The unauthenticated header retains language selection at narrow widths. No locale or translation data is stored in a sharing permission.

- Translate labels, validation, errors, empty states and accessibility text in both catalogs.
- Save actions use the concise Save / Guardar label; pending save actions use Saving… / A guardar…. Keep explicit Create, Start and destructive-action labels.
- Omit optional suffixes from form labels. Required fields retain their existing indicators and validation.
- Use stable semantic keys and complete ICU messages; do not concatenate translated sentence fragments.
- Keep canonical enums, API error codes, IDs and user-entered names untranslated.
- Format dates/numbers for the selected locale. Match time is a duration; locale never changes stored elapsed time, replay order or coordinates.
- Check long Portuguese text and enlarged text at narrow widths. Use text alongside colour for status.
- Validate catalog structure/arguments when editing and run typecheck. Automated tests require explicit user instruction.

Verification status and remaining physical-device/browser checks are in the [Development plan](development-plan.md).

Match duration presets, custom minute input, two-half summaries, starter role counters and setup recovery messages are translated in both catalogs. Category strings remain canonical; U-13 is added without rewriting existing category values.

Recorder timestamps use the shared countdown formatter with event-specific half duration; localized labels do not change stored elapsed milliseconds. Counter increase/decrease labels, half choices, missing-location feedback and opponent-only score guidance are translated. RecorderContext truncates long identity/action text and reuses the translated action name before player selection. Poor reception uses its concise translated label without helper text. Event-entry dialogs place the captured timestamp once in their header through shared RecorderTime formatting; other callers retain the timestamp beside their context. Entry-header metadata may wrap for enlarged text or unavailable-time labels without squeezing out the dialog title.

Powerplay indicators, active/queued status, remaining-time correction and retry feedback are translated in both catalogs. Indicator accessibility labels include the outstanding count and total remaining time across all penalties. Automatic Player in uses the existing translated picker.

Rink entry labels, attack direction, position feedback and keyboard/touch instructions are bundled in both catalogs. Coarse pointers show a short tap/hold/drag instruction without keyboard references. Fine pointers retain keyboard guidance. Direction previews announce the selected Left/Right choice. Attack and Defence labels describe the recorded team's halves in badges above the displayed rink; separate heading and team goal labels are omitted. Assistive position feedback announces the selected half without visible coordinate percentages; stored coordinates remain team-relative. The selected point and captured draft survive language changes.

Inline Player creation reuses the players namespace and adds teamPlayers.createPlayer. The removal namespace supplies Player/Team/Match/membership actions, explicit live discard, history-preserving confirmation text, retry/revision feedback and action/name accessibility labels. Both catalogs retain matching keys and interpolation arguments. User names, IDs and deletion feature/command values remain canonical data.

Player name editing adds players.editTitle, players.save, players.changed and players.updateFailed in both catalogs, reusing existing Name, required-name, Cancel and Saving labels. The edit-specific failure message retains the draft and asks the user to retry saving.

Recorder labels cover Game event, shot attempt types, required save difficulty, timeout team and intercepted-shot recovery. Statistics labels cover recorded goalkeeper totals and attributed conceded goals. Position guidance distinguishes registration from optional selection; narrow controls retain accessible translated labels/tooltips. Which half? / Em que meio-campo? is used only without a derived half. Start/Resume and Next half stay short. Canonical domain values remain untranslated, and locale changes preserve draft identity, time and coordinates.

The flag-only language trigger retains its translated accessible name; language names and the current selection remain in the dropdown. BENCHLINE and STATS are canonical brand text and remain untranslated.

The footer namespace supplies copyright, Beta, version and Contact in both catalogs. The copyright year uses ungrouped numeric formatting; the version comes from package metadata and the contact address remains canonical.

The footer status dialog uses Sync and offline access as its title. Its sections distinguish synchronization, data on this device and cached app files for offline access. The sync result leads, followed by the local account and pending/blocked counts. Browser retention notices stay concise and visible; blocked-change warnings retain automatic-retry and permanent-loss consequences. These are presentation changes only and do not alter readiness checks, retry actions or synchronization.

Sign-in uses auth.welcome, brandEyebrow, brandHeadline and brandDescription in both catalogs. auth.connectionHelp labels the click-to-open HelpPopover; auth.offlineHint explains initial online setup and later offline recording. auth.usernamePlaceholder and auth.passwordPlaceholder repeat the concise field names without possessives. Sign-in reuses footer version/contact messages. Language switching preserves entered credentials. Sign-out copy states that this device's app data is removed, synced data stays in the account and unsynced changes are permanently lost. Existing pending-change checks and confirmation behavior remain unchanged.

Admin username requirements appear beside the input and specify A–Z letters without accents, matching validation. Admin dialogs use one action heading; account descriptions and password-change and account-access consequences remain visible. Statistics keep the recorded-data limitation visible, with calculation and historical-record details in labeled HelpPopovers. The map tooltip explains that the recorded team's attack is always shown to the right without assuming the viewer owns the team. Live timeline tooltips separate participant, action details and period/time into readable lines while preserving the complete accessible description.

The unused appHome.quickAccess message is removed from both catalogs with its redundant heading. Navigation labels, destinations and domain values remain unchanged.
