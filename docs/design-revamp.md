# Design revamp

Updated 2026-10-22. This document tracks the complete UI revamp on `feat/full-ui-ux-revamp`. The branch is ready only after every increment and the final application review pass. The functioning prototype remains the behavior baseline.

## Approved completed-match summary

Approved on 2026-10-22 after an interactive desktop/phone mockup. Implement the final result first, compact team statistics second, a linked rink/event timeline next and individual player statistics last. Preserve the existing dark surfaces and mint selection accent. Card colors retain their established meanings; shot outcomes use labeled marks and a compact Mantine Progress breakdown. No new chart package is required.

All match/individual period selection applies to team and player totals. All/Shots/Recoveries/Losses/Fouls/Cards filters the rink, its breakdown and timeline. Optional player selection filters those same views without changing the team summary or other player rows. Hover/focus previews an event; click/tap pins it. Missing position/time remains explicit. Normalize the map to attack right across periods.

Player statistics show playing time, grouped exclusive shot outcomes, recoveries/losses, fouls and colored card counts. Desktop uses sortable columns; phones use stacked player rows with all outcomes visible. Playing time follows the conservative rules in the domain model. Historical score adjustments remain in result/timeline and do not become invented shots. All data remains read-only and local/offline through existing queries.

Implemented for user review. Formatting, lint, TypeScript, production build, scoped documentation formatting, catalog parity and diff whitespace checks passed. No new packages, persistence changes or recorder modifications were needed. Cross-match statistics pages remain deferred.

Production Chrome review at 1440×1000 and 390×844 covered the 4–2 result, 11 shots with exclusive outcome totals, period filters retaining the final result, substitution/penalty playing time, exclusion of an undone goal, action/player filtering, focus preview, pinned selection, sorting, full-history expansion, English/Portuguese and touch selection. Both layouts had no horizontal page overflow. A service-worker-controlled Portuguese phone reload worked offline with the same result and player statistics. Legacy missing end times, backwards clock history, unaffected-period timing, empty history, missing positions, explicitly labeled legacy elapsed time and score corrections with unavailable period scores were also reviewed. No runtime page errors occurred.

Review used disposable isolated browser storage and blocked API uploads; existing user records were untouched. Automated tests were not read, added, changed or run. The live recorder was preserved in source and was not re-exercised in this increment. Physical-device and browser-family acceptance remain pending. The summary is implemented for review; the whole revamp branch is not marked complete.

## Approved summary performance and density refinement

Authorized on 2026-10-22: cache completed-summary event descriptions, marker data, category counts and outcome breakdowns; memoize timeline rows and rink markers so hover does not rebuild unchanged content. Keep the full history in a bounded scroll area on phones and larger screens. Selecting a rink marker scrolls to its existing row rather than inserting a row. Virtualization remains a measured follow-up in the backlog; no package is added in this pass.

Keep two text lines per event. A location-unavailable indicator replaces the third missing-position line, with the full explanation retained in accessible labels and details. Desktop details reserve stable height. Stacked layouts remove that permanent box and use tap popovers for full event descriptions. Remove generated team initials, the redundant opponent/final-score captions and excess result spacing; team names share the same alignment. Section headings reuse the mint action token. Recording, statistics, persistence and synchronization rules remain unchanged.

Implemented for review. Formatting, lint, TypeScript and production build passed. Isolated production Chrome review at 1440×1000 and 390×844 used a 209-event history: the timeline stayed capped at 416px with consistent 69px rows; selecting an older rink event scrolled to its existing row without changing row count or the 2385px desktop document height. Period/category filtering, focus preview, pinned selection, mobile tap popovers, hidden compact help box, aligned team headings, Portuguese rendering and service-worker-controlled offline reload passed without page errors or horizontal phone overflow. No packages, domain rules or live recorder behavior changed. Automated tests were not read, added, modified or run. Review used disposable browser storage with API uploads blocked, preserving existing user data. No quantified speedup or target-device performance claim is made; profiling and conditional virtualization remain in the backlog. The full revamp is not marked complete.

## Agreed direction

- Redesign page by page, establishing shared components as each page needs them.
- Support phone and tablet/laptop layouts, including narrow widths, landscape, enlarged text and long Portuguese labels.
- Use a dark, clean UI with restrained glass effects. Keep the centered sign-in composition, reduce decorative boxing, and fine-tune the mint accent later. Reuse semantic color and surface variables across components.
- Use Mantine for general controls, CSS Modules for application styling and Lucide React for icons. Keep application-specific compositions and existing data/state responsibilities.
- Start with a centered sign-in page. Put the shared header in the root layout so it persists across page navigation.
- Use header navigation on phones and larger screens. Add navigation and account controls during the menu increment.
- Always confirm sign-out and warn about unsynced work. Implement this in increment 2 without changing the existing local-data deletion policy.
- Prefer CSS or Mantine transitions. Add Motion or further TanStack packages only for a demonstrated need.
- Agree on UX changes within each increment. Preserve authentication, offline durability, event capture and domain rules unless a behavior change is explicitly scoped.

## Progress and next steps

| Increment | Scope                                                                                            | Status                                   |
| --------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1         | Centered sign-in, shared header/footer and dark visual foundation                                | Complete                                 |
| 2         | Menu cards, compact header actions/footer status and sign-out confirmation with unsynced warning | Complete                                 |
| 3         | Players list, shared navigation, heading/back link and search toolbar                            | Complete                                 |
| 4         | Player details, then creation: profile, memberships, forms and feedback                          | Accepted; shared polish complete         |
| 5         | Teams list, creation and editing                                                                 | Accepted; shared fields complete         |
| 6         | Team details, membership assignment and editing                                                  | Roster and assignment accepted           |
| 7         | Matches list with setup/live/completed hierarchy and next actions                                | Implemented; ready for review            |
| 8         | Match creation/setup and Start: call-up, starters, periods and selection summaries               | Creation accepted; preparation in review |
| 9         | Live Match workspace: score, clock, actions, players and reachable Undo                          | Implemented; ready for review            |
| 10        | Event dialogs, timeline and completed summary                                                    | Implemented; summary review in progress  |
| 11        | Whole-application visual, responsive, localization, offline and performance review               | Planned                                  |

Increments 1 and 2 are accepted. Increment 3 was approved on 2026-10-20. The dated sections below retain each increment's original scope and verification evidence; later refinements supersede earlier presentation decisions. The current recorder has Cancel and Change position without event-dialog Back navigation, and completed matches have the linked event map and bounded timeline described above. Do not begin later increments automatically. Keep each increment independently reviewable, splitting related pages further when necessary.

## Increment 1

Scope: introduce Mantine and Lucide, a small dark theme, one shared layout/header, a centered sign-in surface and a styled status footer. Username/password authentication, redirects, autocomplete, native validation, retained input and existing error categories stay unchanged. Password visibility is the scoped interaction improvement.

The root layout composes the shared shell once. Route-aware account-action visibility is presentation only; route session checks and local account setup retain their existing responsibilities. Other pages receive the shared header but retain their current content layouts until their increments.

Acceptance criteria:

- The sign-in page has a centered, readable form, a full-width primary action, password visibility and clear inline errors/loading feedback.
- Header branding works on phones and larger screens. Language selection now lives near the bottom of the phone navigation drawer and in the header on larger screens. Phone sign-in retains it in the header because there is no drawer. The shared layout owns both placements rather than each page.
- English and Portuguese have matching message keys, including accessible control labels. Language changes retain entered credentials.
- Narrow widths, tablet/laptop widths, short viewports, enlarged text, keyboard focus and long labels remain usable without horizontal page overflow.
- Existing authenticated pages still render one header and preserve their current authentication, account setup and sign-out behavior. Sign-out confirmation remains planned for increment 2.
- Formatting, lint, TypeScript and production build pass. Browser checks cover the rendered sign-in and shared layout. Production checks cover any affected offline delivery.

Implementation and non-test verification are finished. The user accepted the design with the final mobile adjustment described below. No automated test work is authorized.

Verification on 2026-10-20:

- Repository formatting, lint, TypeScript and production build passed. Modified documentation formatting, matching translation keys and local documentation file links were checked separately.
- Chromium production checks covered 320px and 390px phone widths, 768px tablet portrait, 1024px and 1440px wider layouts, and a short landscape viewport. Narrow English/Portuguese layouts and 200% root text scaling had no horizontal page overflow.
- Keyboard checks covered the visible skip link, focus transfer to main content, focus indicators, password reveal via keyboard and form submission. Invalid credentials retained input and exposed an inline alert plus correctly associated descriptions/invalid states on both fields.
- Language changes retained entered credentials. The header DOM instance survived client navigation from sign-in to `/app`; one main/footer remained.
- The production service worker cached the shared UI. The generic `/app` shell reloaded under offline network emulation and both bundled languages remained available. A fresh unsigned-in device still requires online account setup, as before.
- Successful sign-in with a real account, authenticated hockey workflows, physical-device keyboard ergonomics and other browser families were not exercised in this increment. No existing user records were changed. Browser checks used isolated contexts.

Next: implement the approved Players increment and shared navigation.

## Visual foundation

- Globals own box sizing, document defaults, semantic design variables and keyboard focus for native controls. Keep component selectors in adjacent CSS Modules and shared control defaults in the Mantine theme. The theme maps Mantine colors to these same semantic variables so fields, buttons and native application CSS use one source of color values.
- Reuse `--color-background`, solid `--color-surface` / `--color-surface-elevated`, translucent `--color-surface-glass` / `--color-surface-glass-elevated`, `--color-surface-header`, `--color-surface-input` and `--color-surface-hover`. Use solid surfaces as the fallback when backdrop blur is unavailable. Use glass for the header, sign-in card, navigation cards and floating menus; keep player lists unboxed with simple row separators.
- Reuse text, subtle/strong border, action, focus and feedback variables. Keep the existing mint accent for primary actions; error and success colors carry status only. Do not put raw color values in page/component CSS.
- Keep one centered 27rem sign-in form with its existing heading and description. On phones up to 36rem, remove the outer card background, border, radius, shadow and blur while retaining the form spacing. Larger layouts retain the glass card. Remove the decorative login tile and icons beside already labeled inputs. Keep the offline prerequisite as quiet text, without an extra separator or icon.
- Use Mantine Paper for the sign-in card; TextInput and PasswordInput for fields; Button for actions; Alert for errors; Title/Text for typography; Group for aligned control content. Add wrappers only for real application compositions.
- Use the Mantine language-picker pattern with Menu, UnstyledButton, Group and Image. Show it near the bottom of the phone navigation drawer, above Sign out; larger screens keep it in the header. On phone sign-in, keep the picker in the header because no drawer is available. Both placements reuse LanguagePicker and the existing locale provider, with only one control visible at a time. Flags supplement native language names. Preserve typed credentials and bundle both flag assets locally. The flags are from [flag-icons](https://github.com/lipis/flag-icons), with its MIT license included under `public/flags`.
- Use Mantine Button with `variant="filled"` for primary actions, `variant="default"` for secondary actions and `variant="subtle"` for compact secondary controls. Destructive confirmations use `color="red"` and `data-destructive`. `size="sm"` selects the shared 44px treatment; ActionIcon also defaults to 44px.
- Controls use the theme's medium size, a 48px minimum field/action height, 44px minimum compact targets, 20px input/button radii, circular icon actions and 14px navigation radii. Cards use a 20px radius; floating menus use 12px. Use a 4px spacing scale, 20px field gaps and 32px section gaps. Allow wrapping and growth for Portuguese and enlarged text.
- Use the system font, 16px input text, 14px labels, 15px supporting text and a responsive 28–32px sign-in heading. Preserve readable line heights and the existing card padding.
- Remove the oversized global input outline. Keep Mantine's thin border focus state, error state, loading state and password visibility behavior. Links/buttons retain a visible keyboard indicator. Hover/expanded menu states share the surface-hover token; transitions respect reduced motion.

Refinement verification on 2026-10-20:

- Formatting, lint, TypeScript and the production build passed. No automated tests were read, added or run.
- Chromium checks covered 320px and 390px phone widths, 768px tablet and 1440px desktop. Portuguese content at 320px with 200% root text sizing, including the open language menu, had no horizontal overflow.
- Input focus had no outline or shadow and retained Mantine's thin border. The language control had visible keyboard focus; Enter, arrow navigation and Escape worked. Language switching retained the entered username and password.
- Contrast checks against the elevated solid surface gave 12.72:1 for primary text and 7.19:1 for secondary text. Action text was 10.47:1; the input boundary was 3.14:1 against the input background. Translucent surfaces retain solid dark fallbacks.
- Production cache inspection confirmed both flag SVGs. After an offline reload of the generic `/app` shell, both assets loaded and the shared picker switched to Portuguese. Successful account sign-in, authenticated workflows, physical devices and other browser families were not exercised in this refinement.

The user accepted the sign-in design on 2026-10-20, with the outer card removed on phones. Increment 1 is complete.

## Account entry refinement

- A device with no local identity and a confirmed missing session redirects from `/app` to `/sign-in`. While resolving local ownership and session, show only a neutral loader, without setup headings/actions. On sign-in, the logo stays on `/sign-in`; elsewhere it links to `/app`. Keep the cached app entry usable offline without a server session requirement.
- A valid session completes local setup automatically. Existing-data import decisions and genuine setup/storage/network errors keep their current retry/recovery behavior.
- An initialized device remains usable after session expiry and offline. Synchronization retains its existing sign-in prompt.
- Header Sign out visibility follows the client session rather than the route alone. Keep the action available during sign-out and after failed local cleanup so retry remains possible. The sign-out confirmation remains scoped to increment 2.

Verification: formatting, lint, TypeScript and production build passed. In an isolated production browser context, fresh `/app` entry and the header logo returned to sign-in without a Sign out action. A temporary local-identity fixture preserved offline entry and, online without a session, exposed the existing sign-in-to-sync prompt. Simulated unavailable IndexedDB kept the error/retry screen without redirecting. The fixture was removed. Real authenticated setup/import and sign-out cleanup failure were not exercised in this refinement; their workflows remain unchanged. No automated tests were read, added or run.

Flash prevention verification: the production `/app` HTML contains the labeled loader and no setup heading. Holding the session response in an isolated browser showed only that loader; the sign-in logo remained on sign-in. Formatting, lint, TypeScript and production build passed.

## Increment 2

Approved scope:

1. Refine Mantine button treatments through the existing theme: primary, secondary, subtle and destructive, with 48px form actions and compact 44px actions. The header Sign out has a label on laptops and an accessible icon on phones. Add a confirmation dialog with a fresh count of all pending/blocked outbox operations, warning that signing out removes local data. Keep cancel non-destructive and preserve server sign-out, sync cancellation and failed-cleanup retry behavior.
2. Rebuild `/app` with a welcome introduction, a prominent Record a match link into the existing creation flow, and Matches/Teams/Players quick-access cards. Extract a reusable NavigationCard and let AppMenu own the grid. Use existing semantic colors/glass surfaces and Lucide icons. No statistics, recent-activity queries or changes to match creation logic.
3. Extract AppFooter. Put compact synchronization status in the footer, retain visible pending/blocked/failure feedback, and put verbose storage/install explanations plus secondary actions in Details. Keep the phone footer limited to compact application status and Details; language selection now belongs to the drawer. SyncLifecycle remains headless and mounted once under initialized local account setup; display changes do not own synchronization.

Acceptance: one phone and one laptop layout; both catalogs; usable links, footer details and cancel/confirm interactions; visible unsynced warning; preserved local/offline access; formatting, lint, TypeScript and production build. No automated tests are authorized. The approved UI reference informs hierarchy and spacing; the existing charcoal/mint palette and glass theme remain in use.

Increment 2 verification on 2026-10-20:

- Repository formatting, lint, TypeScript and production build passed; modified Markdown formatting and diff whitespace were checked separately. No automated tests were read, added or run.
- Browser review used one 1440px laptop size and one 390px phone size, including Portuguese. Menu links, phone footer language selection and compact header actions fit without horizontal overflow. Form actions retain their previous size; compact actions and modal close controls are 44px.
- Footer Details, pending/blocked counts, sign-in-to-sync feedback, Escape and return focus were checked. No synchronization lifecycle/coordinator or database transaction logic changed.
- In an isolated browser with mocked session/sign-out responses, two generated records produced one pending and one blocked operation. The dialog warned about both. Cancel sent no sign-out request and retained both operations. Confirm sent one mocked request, ran the existing local cleanup, removed only the isolated preview database and returned to sign-in. An initial automatic approval rejection of this destructive check was resolved after verifying the isolated database contained only the generated fixtures.
- A separate production context loaded the new menu and footer from the service worker offline, followed Record a match into the cached creation page, and opened footer Details. It retained one header/footer. The temporary identity was removed afterward. No existing user records were changed.
- Real authenticated backend sign-out, cleanup-failure retry, physical devices and other browser families were not exercised in this increment. The existing failure/cleanup logic remains in place. The user accepted increment 2.

## Increment 3

- Reuse the menu heading through PageHeader, with a reusable explicit Back to menu link on Players.
- Share destination definitions across home cards, desktop header links and a full-height compact-screen navigation drawer. Keep Sign out at the drawer bottom with the existing confirmation and unsynced-work warning. Keep the phone language picker near the drawer bottom.
- Use a contained search toolbar with live filtering, clear and an inset New player link. Preserve search state, sorting and existing routes.
- Use compact unboxed player rows with separators, initials, single-line truncated names, delivery-status icons/tooltips and a three-dot Edit/Delete menu. The row itself opens details. Edit and Delete are visibly unavailable with explanations; their functionality belongs to the next branch in [Backlog](backlog.md). Do not add player mutations in this increment.
- Keep loading, retry, empty and no-results feedback concise. Check one phone and one laptop, both catalogs, keyboard access, navigation and production offline delivery. No automated tests are authorized.

Player density refinement scope: reduce search/back-link spacing, center button contents, center desktop navigation with balanced columns, shrink the language picker, and map Mantine control radii to `--radius-control`. Keep the existing 44px compact touch targets. Player editing/deletion remains deferred.

Increment 3 initial verification on 2026-10-20:

- Formatting, lint, TypeScript and the production build passed. No automated tests were read, added or run.
- Isolated Chromium review covered a 1440×900 laptop and a 390×844 phone. English and Portuguese, long player names, active navigation and the full-height phone drawer fit without horizontal overflow. The drawer keeps Sign out at the bottom.
- Live accent-insensitive search, alphabetical rows, result counts, no-results feedback, clear, empty state, View links and retained search after returning from details were checked. Enter in search did not navigate to creation. Edit/Delete exposed their unavailable explanations by keyboard and did not navigate or mutate records.
- Drawer navigation closed on destination selection. Sign out closed the drawer before showing the existing confirmation. Cancel retained the generated records and returned focus to the burger. Actual sign-out and backend mutation workflows were not exercised in this increment.
- The final production worker reloaded Players and its five generated local rows under offline network emulation, then opened the cached New player route. Network emulation showed the existing synchronization-attention feedback; the coordinator was unchanged. Initial loading and storage-error retry feedback were preserved in the new composition; a forced storage-failure scenario was not exercised.
- Browser checks used an isolated context and generated local fixtures, which were removed afterward. No existing user records were changed. Physical devices and other browser families remain unverified.

Player density refinement verification on 2026-10-20:

- Formatting, lint and production compilation/type checking passed. No automated tests were read, added or run.
- Reviewed one 1440×900 laptop and one 390×844 phone. Player rows measured 60–61px including separators, with one-line names and ellipsis for long names. The list has no outer box, shadow or rounded container. Search measured 50px; the inset action and back link retain 44px targets with centered labels and reduced surrounding spacing.
- Desktop navigation aligned with the viewport center within rounding error, including Portuguese. The language picker measured 128×44px and retained its flags and full language names. The phone header retained only branding and its drawer control.
- The three-dot menu opened separately from the details link and exposed disabled Edit/Delete items with an unavailable explanation. Escape closed it. The compact delivery icon showed the existing status through its tooltip on phone focus/tap; the default textual status elsewhere and its classification rules remain unchanged.
- The final production worker reloaded all five generated local player rows offline without horizontal overflow. Browser records were isolated preview fixtures and were removed afterward. Backend editing/deletion and physical-device/browser-family checks remain outside this refinement.
- `--radius-control` is the single 14px control-radius value. Mantine's medium/default radius references it; the contained toolbar initially derived its outer radius from the same value. The final refinement below uses a separate pill token. Card and floating-menu radii remain separate.

Final proportion refinement: use 16px player names and 40px avatars with slightly more row padding. Keep one-line rows. Use `--radius-pill` for the search bar and its inset action, widen the desktop navigation gap to 12px, and make the language picker content-sized with a quiet borderless treatment, equal padding, smaller flags/text and a compact dropdown. Preserve 44px control targets.

Final proportion verification on 2026-10-20: formatting, scoped lint and the production build including TypeScript passed. One 1440×900 laptop and one 390×844 phone showed 64–65px single-line rows, pill search/action corners, centered navigation with 12px gaps, and a content-sized language control of about 100px in English and 118px in Portuguese. The language menu retained both full labels and flags. The final production worker reloaded the generated player list offline without horizontal overflow. The isolated fixtures were removed afterward. No automated tests were read, added or run.

Increment 3 is accepted. The player-view part of increment 4 is implemented with visual review pending. The player creation form is implemented below, with visual review pending. Player Edit/Delete functionality is explicitly scheduled for the next branch in the backlog.

## Player view increment

The user accepted the player-list refinements and approved the player-view implementation on 2026-10-20, including team memberships. Player creation remains planning-only.

- Replace the generic details title and repeated Name field with a profile heading: initials avatar, full player name, quiet delivery status and the existing Back to players link. Let long names wrap on this page.
- Extract the existing player actions menu so the list and details view share unavailable Edit/Delete controls. Their behavior remains deferred to the next branch.
- Remove the UUID from the main composition. Keep the page focused on player identity and memberships rather than technical metadata or invented statistics.
- Add a Teams section with compact rows showing team name and available category/season, plus that membership's optional jersey number and field-player/goalkeeper role. Each row opens the existing team details route. Show a simple no-teams state without adding assignment actions here.
- Membership display needs a local read query joining this player's TeamPlayer records with stored Teams. Keep it read-only, validate stored records, refresh when teams/memberships change, and preserve initialized-device offline use. Explain any missing locally available team without inventing its name.
- Reuse PageHeader/BackLink and the list row patterns; add only the profile/actions/team-membership compositions required by this page. Keep an open layout with separators rather than nested cards.
- Preserve existing fixed query and legacy dynamic entry routes, loading/retry and player-unavailable behavior. Include separate loading/error/empty handling for membership data so it does not hide a successfully loaded profile. Support phone and laptop, keyboard/touch access and both catalogs.
- Review this view first. Player creation remains a separate subsequent increment.

Player-view verification on 2026-10-20:

- Formatting, scoped lint, TypeScript and the production build passed. Both catalogs have matching keys. No automated tests were read, added or run.
- Isolated Chromium review covered one 1440×900 laptop and one 390×844 phone, English/Portuguese, long player/team names, multiple memberships with different roles/numbers, an omitted jersey number, an unavailable team and an empty membership list. No horizontal overflow occurred. Full profile names wrap; player-list rows retain their one-line behavior.
- The shared actions menu kept Edit/Delete unavailable and closed with Escape. Both fixed query and legacy dynamic player detail URLs loaded the profile. The team link opened the existing details route.
- Updating a generated team name and membership jersey number, then sending the existing local-data notifications, refreshed the membership view without reloading the page. A generated malformed membership produced a membership-only error while retaining the profile; restoring it and using Retry recovered the team list.
- The final production worker reloaded the profile and memberships offline, preserving Portuguese role labels, and opened cached team details. Storage schema, synchronization, server APIs and write workflows were unchanged.
- All browser data was generated in an isolated context and removed afterward. Existing user records were untouched. Physical devices and other browser families remain unverified.

## Player creation form increment

The initial form used a glass panel on laptops. The user refined that choice on 2026-10-20: use an unboxed form on every size. Retain NewPlayerPage validation and submission logic.

- Reuse PageHeader and BackLink. Keep the form aligned with the page content and constrain its width for readability, rather than stretching a single input across the whole workspace.
- Introduce one reusable FormLayout composition for spacing, form-level feedback and the action row. Keep the legacy EntityForm for unmigrated pages until their own increments. Do not change all existing forms indirectly.
- Use Mantine fields directly. The shared theme owns 48px fields, 16px input text, 20px input/button radii and circular icon actions, labels, helper/error text, thin-border focus and loading/disabled states. Pill radii stay specific to search. Do not add per-field wrappers or a generic schema/form engine.
- Start New player with the existing required Name field only. Keep feature validation and save/navigation responsibilities in the page/feature. Roles and jersey numbers remain team membership data.
- Use consistent field spacing and a quiet divider before Create player/Cancel actions. Keep the primary action prominent; phone actions can stack with the primary full-width. Avoid a floating/sticky action bar for this short form.
- Preserve submit validation, focus on invalid input, trimmed names, duplicate-submit protection, retained entries on failure and the existing successful return to Players with its saved feedback. Decide any draft-discard confirmation separately before adding that behavior.
- Migrate later Team and Match forms through the same layout and theme when their increments start. Add grouped sections or a wider field grid only for forms that need them.

Approved shared-layout refinement: keep profile identity, delivery status and actions on one flex row on phones, allowing the name itself to wrap. Put compact footer synchronization and Details on the same phone row; move phone language selection into the drawer bottom near Sign out, hide the redundant offline-ready hint on phones and keep exceptional/update feedback visible without moving Details to its own row.

Player-form and shared-layout verification on 2026-10-20:

- Scoped lint, TypeScript, production build, formatting and diff whitespace checks passed. No automated tests were read, added or run.
- Reviewed one 1440×900 laptop and one 390×844 phone, including Portuguese. The laptop form is a 36rem glass panel with a 48px input and shared 14px control radius. The phone form is transparent and unboxed with stacked actions. Neither layout had horizontal overflow.
- Empty submission exposed an associated input error and focused Name. Changing language retained typed text. Cancel returned to Players without adding a record.
- In an isolated browser, temporarily removing only the generated local ownership fixture exercised save failure. The form retained the name and exposed its existing translated error. After restoring that fixture, two rapid submissions created exactly one trimmed player and one pending outbox operation, returned to Players and displayed the existing saved message. Mocked account/download responses supported UI review; command requests were rejected by the preview mock and no backend write occurred.
- The short and long player-name profiles kept sync and actions on the same flex row on phones. The normal Synced footer message and Details shared a vertical center; Details still opened and closed its dialog. Redundant offline-ready text moves to Details on phones; important issues/counts and update notices remain visible.
- The production worker reloaded the new form offline with its input, mobile presentation and Details available. All generated players, pending operations and ownership metadata were removed afterward. Existing user records were untouched. Physical-device ergonomics, other browser families, held-save pending transitions and a forced service-worker update notice were not exercised in this increment.

Increment 4 is implemented and ready for visual review. Later Team/Match form migrations remain planned. Existing feature validation, local persistence, outbox coordination and server APIs were not changed.

## Final interaction refinement

- Put phone language selection in the navigation drawer near the bottom, above Sign out, and remove it from the footer. The sign-in page has no drawer, so retain language access in its header on phones. The wider header picker stays in place.
- Remove the desktop FormLayout panel, border, shadow, blur and outer padding. Keep the existing width, field spacing and action layout; forms are now unboxed on every size.
- Disable Mantine button label text trimming and use a normal line height so descenders remain visible. Keep shared minimum target sizes and keyboard focus.
- Disable Mantine's whole-control active translation through the theme. Keep background feedback and loading feedback without label sliding. Home tiles keep their internal arrow animation, with no whole-tile lift.
- Finish these refinements before scoping the Teams increment. No Teams implementation is authorized yet.

Refinement verification on 2026-10-20:

- TypeScript, scoped lint, formatting, production build and diff whitespace checks passed. No automated tests were read, added or run.
- Reviewed one 1440×900 laptop and one 390×844 phone. The form has no outer border, background, shadow or padding. Portuguese button/back-link labels retain their descenders with normal line height and no text trimming.
- Button hover changes its background without changing its position. A held button press keeps its position, and home tiles remain stationary while their internal arrows animate.
- The phone drawer places language selection above Sign out; switching language retains the form draft. The footer has no language picker and keeps Synced and Details in one 69px-high row. Phone sign-in retains its header picker.
- The production worker reloaded the cached form offline, and language selection worked inside the drawer. Account/download reads were mocked only in the isolated preview; no backend write occurred. The generated identity fixture was removed afterward, with no player or outbox records created. Existing user records were untouched. Physical devices and other browser families remain unverified.

## Header density and icon refinement

- Keep the shared header sticky at the top, with less vertical padding and the existing 44px touch targets. Floating menus and dialogs must remain above it.
- Reduce shared page top padding to 20px on laptops and 12px on phones. Preserve the centered sign-in layout.
- Scale home-tile icons to 108% on hover, retaining the stationary tile and existing arrow animation. Animate only the BackLink arrow 3px left on hover. Respect reduced-motion preferences.
- Give FormLayout submit and Cancel actions the same compact 44px sizing and 14px text; retain filled primary emphasis and current pending behavior.
- Finish this polish before presenting the Teams plan. Teams implementation remains subject to scope approval.

Verification on 2026-10-20:

- TypeScript, scoped lint, formatting, production build and diff whitespace checks passed. No automated tests were read, changed, added or run.
- Reviewed one 1440×900 laptop and one 390×844 phone. Header heights are 65px and 61px respectively; page top padding is 20px and 12px. Submit and Cancel both use 44px targets and 14px text. No horizontal overflow appeared on the phone form.
- On laptop hover, the tile icon scales to 108% while its container stays stationary. The back arrow moves 3px left while its link stays stationary. CSS disables these animations under reduced motion.
- On the scrolling phone menu page, the header remained at top 0. The navigation drawer opened above it. The production worker reloaded the cached form under offline network emulation with the updated header/actions.
- Account/download reads were mocked in an isolated browser context. No forms were submitted and no backend writes occurred. The generated ownership fixture was removed; player/outbox counts remained zero. Existing user records were untouched. Physical devices and other browser families remain unverified.

## Teams increments

The user approved the listing page on 2026-10-20 and then approved the Team view profile/roster presentation pass. The list is accepted. Membership editing was approved afterward and is implemented below. Two-step assignment is approved as the next trial; Team editing and New team remain subsequent page/form increments.

1. Teams list: migrate TeamsListPage to PageHeader, BackLink and the pill SearchToolbar with a contained New team action. Preserve locale-aware search across name/category/season and current sorting. Replace boxed ListItems with compact TeamRow links and subtle separators. Reuse EntityRow with an optional secondary-text slot only if needed for category/season, keeping Players unchanged. Use a small shield identity mark and the compact DeliveryStatus tooltip. Show category and season in quiet text; on phones, recommend one truncated secondary line below the team name. Keep loading, retry, empty and no-results feedback consistent with Players. Keep Edit in its existing details view for this first step; deletion remains deferred. Do not add roster counts or new read queries solely for the list.
2. Team form: migrate NewTeamPage and TeamForm to PageHeader, Mantine fields and the unboxed FormLayout. Retain required Name and optional Category/Season, validation, retained drafts, pending locks and revision-conflict feedback. Category/Season can share a row on laptop and stack on phones. Extend FormLayout with an optional cancel callback for the existing inline edit flow when that migration is approved; keep navigation cancellation for New team.
3. Team details and roster: use the team name as the profile heading, show category/season as metadata, and keep compact sync/actions together. Remove UUID/repeated label clutter. Preserve working Edit, player assignment and membership editing. Redesign the roster with player identity, jersey number and role; redesign selection with Mantine controls and a clear selected count, retaining batch save, duplicate-number feedback, disabled existing members, failed-save retention and revision checks. Review the roster/assignment design separately before implementing it.

All approved steps must preserve fixed/legacy URLs, local queries, offline writes and synchronization. Add text to both catalogs as needed. Review one laptop and one phone layout and run relevant non-test checks for each step.

### Teams listing implementation

The approved list is implemented and ready for visual review. TeamsListPage now composes PageHeader, BackLink, the contained SearchToolbar action and TeamRow. TeamRow reuses EntityRow with one optional description line for category/season and the compact DeliveryStatus tooltip. Names and metadata truncate independently. Teams without metadata keep a single text line. Player rows retain their original markup when no description is supplied.

The existing local query, locale-aware search across name/category/season, sorting and destination URLs are unchanged. Loading, retry, empty and no-results states use Mantine controls and the Players layout. Shared footer status replaces the old repeated page-level storage notice. Existing catalog strings supply all labels. No Team editing, creation, roster, persistence or sync behavior was modified.

Verification on 2026-10-20:

- Scoped lint, TypeScript, formatting, production build and diff whitespace checks passed. No automated tests were read, added, changed or run.
- Reviewed one 1440×900 laptop and one 390×844 phone, including Portuguese, long names/metadata and omitted category/season. Phone rows remain about 64px high, text truncates and no horizontal overflow occurs. The existing Players row retained a single line with a long generated name.
- Confirmed accent-insensitive name search, category/season search, result counts, the empty state, no-results clear action and the compact sync tooltip. A temporarily malformed generated record exposed the read-error alert; restoring it and using Retry recovered all rows.
- New team opened the existing creation route. The production worker reloaded the Teams list under offline network emulation, and the existing fixed team-details route displayed the generated team offline.
- Account/download reads were mocked only in an isolated browser context. No forms were submitted or backend writes made. All generated teams, the player used for the shared-row check and ownership metadata were removed afterward; team/player/outbox counts were zero. Existing user records were untouched. Physical devices and other browser families remain unverified.

The user accepted the first Teams list iteration on 2026-10-20 and requested Teams view next. SearchToolbar now applies text-overflow: ellipsis to overflowing input/placeholder text, preserving the full wording, accessible label and search behavior. Production build, CSS formatting and diff whitespace checks passed. A single 390×844 Portuguese production view confirmed the visible ellipsis and no horizontal overflow. No automated tests ran. Only mocked account/download reads supported the isolated review; generated ownership metadata was removed afterward.

### Team view increment

The user approved the profile/roster presentation scope on 2026-10-20. Teams view moves ahead of New team. Implement this scope only; redesigning the existing editing/assignment forms remains a subsequent increment.

- TeamDetailsPage: reuse PageHeader and BackLink with a shield identity mark, actual team name and quiet category/season metadata. Keep compact delivery status and a working Edit action beside the heading, including on phones. Remove the UUID, repeated Name/Sync labels, details box and repeated storage notice. Let long profile names wrap and preserve loading, retry and unavailable states.
- TeamPlayers and TeamMembership: replace boxed membership cards with compact unboxed rows using shared player identity and row patterns. Show player name, optional jersey number and role, plus compact membership delivery status and a pencil action for the existing editor. Desktop can align metadata in columns; phones can use one metadata line beneath the name with status/actions at the right. Put the existing Add players action beside the roster heading. Keep available player links, unknown-player handling and duplicate-number feedback.
- Preserve existing inline edit/assignment behavior in this first presentation pass. Redesign the team-edit form, membership editor and multi-player assignment controls in subsequent reviewed steps using Mantine and FormLayout. Do not migrate New team implicitly or introduce modals, removal actions, statistics or new queries in the view pass.
- Preserve local reads/writes, revision checks, pending locks, failed-save drafts, fixed/legacy routes and offline behavior. Review one laptop and one phone layout. No automated test work is authorized.

Team view implementation on 2026-10-20:

- TeamDetailsPage now uses the shared profile heading, TeamMark, category/season description and compact sync/Edit actions. Repeated detail labels, UUID, outer card and storage notice are removed. Loading, retry and unavailable feedback use Mantine, and the existing team edit form remains inline.
- TeamPlayers places the existing Add players action beside its heading. Its phone label is shortened while the accessible label remains complete. TeamMembership composes EntityRow and PlayerAvatar with role/optional jersey metadata, compact delivery status and a named pencil action.
- TeamMark is shared by the profile and list without changing the list's shield appearance. EntityRow accepts optional full-width children for existing membership forms and duplicate-number feedback; callers without children retain their layout.
- TeamForm, EntityForm, PlayerAssignmentFields, assignment controls, mutation callbacks, local queries, revision checks, storage schema and server APIs are unchanged. Both catalogs include the compact Add label and the membership-specific accessible Edit label.

Verification on 2026-10-20:

- Scoped lint, TypeScript, formatting, matching catalog keys, production build and diff whitespace checks passed. The first TypeScript/build attempt found an optional description passed as undefined; using an empty description resolved it, and the final checks passed. No automated tests were read, added, changed or run.
- Reviewed one 1440×900 laptop and one 390×844 phone with English/Portuguese, long team/player names, both roles, present/omitted jersey numbers and an empty roster. Normal roster rows are 64–65px high; names and metadata truncate independently. Long profile names wrap. No horizontal page overflow occurred.
- Team edit, membership edit and multi-player assignment opened and cancelled without saving. Draft edits did not alter displayed committed values; existing members stayed disabled in assignment. Duplicate-number notices and an unavailable-player label appeared correctly without pushing row status/actions onto a second line. An invalid team ID showed the unavailable state without an Edit action.
- The production worker reloaded the profile and roster offline in Portuguese with sync/Edit/Add controls available. The existing fixed route and record selection remain unchanged. Legacy dynamic route entry files were not modified or separately exercised in this increment.
- Account/download reads were mocked only in an isolated browser. No forms were submitted or backend writes made. Generated teams, players, memberships and ownership metadata were removed afterward; team/player/membership/outbox counts were zero. Existing user records were untouched. Physical devices, other browser families and save/error workflows inside the unchanged forms were not exercised.

The profile/roster presentation is accepted. Membership editing is the next implemented increment below; New team remains a separate page increment.

## Membership editor increment

The user approved membership editing first, using a compact laptop modal and a full-screen phone dialog. Build a reusable ResponsiveFormDialog with a scrollable body and separate actions, plus reusable MembershipFields using Mantine TextInput and SegmentedControl. Keep focus trapping/restoration, avoid automatic text-field focus on phones, retain failed drafts and prevent dismissal while saving. Keep the pencil mounted and remove the inline editor so opening it does not change roster layout. Retain optional text jersey numbers, both canonical roles, duplicate-number feedback and the existing revision-aware mutation. No domain, storage or API changes are authorized.

For the subsequent Add players increment, the user approved trying two steps: select players, then configure memberships. Exclude existing team members instead of displaying disabled entries. Use the shared search design. Preserve selections and configured fields between steps and filtering, then retain the existing batch save. This decision is recorded now; implement that flow after reviewing the membership editor.

Membership editor implementation and verification on 2026-10-20:

- TeamMembership now opens ResponsiveFormDialog and MembershipFields instead of inserting an inline form. The row and pencil remain mounted; existing duplicate-number feedback stays visible. The original revision-aware save, pending-submit guard, failure retention and mutation are preserved. Close/Cancel also check the immediate submit guard, and outside clicks do not discard the draft.
- ResponsiveFormDialog uses the shared modal colours/surfaces, a 380px laptop width, full-screen phone layout, scrollable fields and separate actions. The phone height tracks visualViewport resize where supported and otherwise uses 100dvh. Focus starts on Close instead of a text input. The dialog retains focus trapping/restoration and blocks Close, Cancel and Escape while saving.
- MembershipFields keeps the jersey number as optional text, without changing validation, and exposes both canonical roles through a labelled SegmentedControl. The theme owns its reusable border, selected surface, label and touch-target styling. Existing Team editing and Add players forms are unchanged.
- The final scoped lint, formatting, production build/type checking and diff whitespace checks passed. An initial TypeScript error from a nullable visualViewport reference and a ref-cleanup lint warning were fixed before the final checks. No automated tests were read, added, changed or run.
- Reviewed one 1440×900 laptop and one 390×844 phone, including Portuguese and a long player name. Laptop roster coordinates and heights stayed identical while the modal opened. The phone dialog filled the viewport with readable labels, both role choices and visible footer actions; no horizontal overflow occurred. Initial focus stayed on Close, not the jersey field. Arrow-key role selection and trigger-focus restoration worked.
- A generated revision conflict kept the dialog, error and entered jersey value open. After restoring that fixture, a held local transaction verified disabled fields/actions and blocked Escape during save. Releasing it committed the trimmed jersey number and changed role, advanced the membership revision once, created exactly one pending update operation and then closed the dialog. Focus returned to the original pencil.
- A production-worker reload preserved the committed membership offline, and its editor opened in Portuguese. The other membership's edited draft was cancelled without committing. Physical-device software-keyboard behaviour and other browser families remain unverified.
- Review data lived only in an isolated browser context. Account/download reads were mocked, command requests were rejected by that mock and no backend write occurred. All generated teams, players, memberships, ownership metadata and the pending operation were removed afterward; team/player/membership/outbox counts were zero. A usage-limit interruption delayed the final preview cleanup; cleanup completed after the user resumed the task.

The membership editor was reviewed and refined below. The approved two-step Add players trial is now implemented. Keep Team editing/New team outside this increment.

## Dialog visual refinement

- Refine ResponsiveFormDialog into a darker glass window on laptops, with a translucent semantic surface, restrained overlay, 52px title bar and 16px close glyph inside a 44px target. Retain the solid full-screen phone canvas.
- Put Cancel at the left and Save at the right in the shared dialog. Remove the laptop footer divider, compact the action area and allow more breathing room around fields. Preserve save, focus and pending-dismissal behaviour.
- Add a reusable 20px input-radius token for Mantine and legacy input controls, preserving pill search bars and existing button/navigation radii.
- Make SegmentedControl pill-shaped with a mint selection gradient, dark selected text, no item dividers and a 180ms sliding indicator. Reduced motion disables that animation. Keep gradient and dialog colours in reusable semantic tokens and check contrast.
- Complete this visual refinement before the two-step Add players implementation.

Dialog refinement verification on 2026-10-20:

- Scoped lint, formatting, production build/type checking and diff whitespace checks passed. No automated tests were read, added, changed or run.
- Reviewed one 1440×900 laptop and one 390×844 phone. The laptop content computes to a 76% translucent dark surface with 20px backdrop blur, a 53px title bar and a 16px close glyph in a 44px target. Cancel aligns with the left field edge and Save with the right. The phone retains its full-screen solid canvas and visible footer actions; Portuguese labels and a long player name fit without horizontal overflow.
- The segmented indicator uses the mint gradient, pill radius and an observed sliding transition over 180ms. Reduced-motion emulation changes its duration to zero. Whole buttons and the dialog retain their stationary presentation. Escape still closes the editor and returns focus to its pencil.
- Mantine membership input and legacy Team edit inputs compute to the shared 20px radius; the shared pill search remains 9999px. The production worker reloaded the page offline, and the refined editor opened with its styles available.
- Selection text contrast is 10.47:1 and 8.34:1 at the gradient endpoints. Compositing the dialog's 76% surface with its 38% black overlay gives at least 5.78:1 secondary-text contrast across the checked dark and white backdrops, and over 8.7:1 against the application's dark surfaces.
- Only presentation and dialog action ordering changed. Save/validation, pending guards, focus, canonical role values and persistence remain unchanged. The isolated review used mocked account/download reads and submitted no forms. Generated records and ownership metadata were removed; team/player/membership/outbox counts were zero. Physical-device keyboard behaviour and other browser families remain unverified.

## Action rounding and hover refinement

- `globals.css` now separates `--radius-input` and `--radius-button`, both initially 1.25rem, from `--radius-icon`, which defaults to `--radius-pill`. Button and input curvature can be tuned independently. `--radius-control` remains for navigation/general controls and `--radius-surface` for outer surfaces.
- Mantine and legacy buttons consume the button token. ActionIcon and the form dialog close button consume the icon token. Cancel retains the standard compact button padding, with a negative start margin to keep its text aligned with the fields while allowing a properly padded hover background.
- Production build/type checking, scoped lint, formatting and diff whitespace checks passed. A 1440×900 production review confirmed 14px Cancel padding on both sides, 20px action radii, a circular 44px close target and background-only hover feedback. No automated tests were read, added, changed or run. No forms were submitted. Generated records/ownership were removed from the isolated preview; team/player/membership/outbox counts were zero.

## Add players implementation

The approved two-step trial is implemented with the following composition:

1. Open a wider version of ResponsiveFormDialog on laptops, keeping full-screen phones. Give this flow a stable desktop height across both steps with a scrolling body, rather than resizing the roster or growing the dialog per checkbox. Keep the compact membership editor's size unchanged. Use a quiet step label instead of a large wizard header.
2. Select players: show only available players not already in the team. Extract the pill search field from SearchToolbar so list pages keep their contained New action while selection uses search and clear only. Display stable SelectableEntityRow checkbox rows with PlayerAvatar, one-line names, separators and a faint selected background. Clicking a row toggles its checkbox; do not add navigation links or editing fields inside the checkbox target. Keep selection while filtering. Show the selected count and Cancel/Continue actions; Continue requires at least one player. Distinguish no available players from no search matches.
3. Configure memberships: show only selected players with the reusable MembershipFields jersey input and segmented role control, grouped by player with simple separators. No nested modal, card-per-field layout or expanding selection rows. Back returns to selection without losing entries. The final primary action includes the selected count and performs the existing batch save. Close/Cancel dismiss the draft; pending saves block Back/close and errors retain the configuration step and entries. Preserve the existing nonblocking duplicate-number feedback.
4. TeamPlayers becomes the roster and dialog launcher. Feature-owned PlayerAssignmentDialog holds step/selection/draft state; SelectableEntityRow and the extracted search field stay reusable. Extend ResponsiveFormDialog only for the concrete larger-flow size and secondary Back action. Keep the existing membership dialog behaviour intact.
5. Preserve current local queries, locale-aware search/sorting, batch mutation, revision/duplicate-member validation, offline durability and synchronization. Add new labels to both catalogs. Run relevant non-test checks and review one laptop and one phone; automated tests remain unauthorized.

The user accepted the two-step flow as the first version on 2026-10-20. Plan Edit team next, then discuss New team and defined category/season choices separately.

Implementation and verification on 2026-10-20:

- PlayerAssignmentDialog owns the selection, search, membership drafts and existing batch mutation. TeamPlayers retains the roster and a mounted launcher. Closing discards the dialog draft; reopening starts a new selection. Draft fields also survive deselection/reselection within the same open dialog.
- SearchField supplies the shared pill input and clear action; SearchToolbar keeps its contained New link. SelectableEntityRow uses Mantine Checkbox.Card with a single checkbox target, avatar, truncated name and selection background. Role values, queries, persistence and synchronization contracts are unchanged.
- Reviewed the production flow at 1440×900 and 390×844. The laptop window stays at 620×672 across both steps; the phone fills the 390×844 viewport. Scrolling stays inside the fields while actions remain visible. Long names truncate, existing members are absent, and empty availability differs from no search matches. Filtering, keyboard Space selection, clear search, Back/draft retention and duplicate-number feedback were checked.
- A batch save created two memberships and two teamPlayer.create commands. A forced local insertion failure rolled back the batch and kept the configuration step available for retry. A held local write confirmed that pending saves disable controls and block Escape. Retrying completed locally with network access disabled; a service-worker-controlled reload retained the records and pending commands. Account/download reads used an isolated preview mock, command requests were rejected, and no backend write occurred.
- Scoped lint, formatting, catalog-key parity, diff whitespace and the final production build/type check passed. Final review confirmed focus returns to Add players after Escape, the membership editor retains its 380px compact layout, and list search/New controls remain pill-shaped. All identified preview fixtures, ownership metadata and generated commands were removed from both isolated review contexts; player/team/membership/outbox counts were zero.
- Dismissal explicitly returns focus to the Add players launcher. The compact membership editor remains on the default dialog layout. Physical-device software keyboards and other browser families remain unverified. No automated tests were read, added, changed or run.

## Edit team implementation

The user approved the Edit team proposal and requested implementation, followed by planning New team. The editor is implemented for review.

- Replace the inline TeamForm in TeamDetailsPage with a feature-owned EditTeamDialog. Keep the profile and roster mounted, and retain the pencil as the dialog trigger with accessible dialog state and focus return.
- Reuse ResponsiveFormDialog's compact glass window on laptops and full-screen phone presentation. Use the existing title bar, circular close action, scrollable fields and Cancel-left/Save-right footer. No additional card, large profile heading or explanatory block inside the editor. Avoid automatic text-input focus on opening phones; focus Name only after invalid submission.
- Show Name as required, with Category and Season optional. Keep all three fields in one column. Use Mantine TextInput with the shared rounded input/button tokens for this increment. Keep existing custom category and season values intact. Discuss defined choices during the New team plan and apply the resulting field behaviour consistently to creation and editing.
- Extract feature-owned TeamFields for the controlled inputs and inline name error so the later New team page can reuse them. EditTeamDialog owns its draft, validation and existing useUpdateTeam mutation. Leave the current creation page/legacy TeamForm unchanged until its increment.
- Prefill the current record on opening. Cancel/close discards unsaved input and returns focus to the pencil. Save uses the existing schema, expectedRevision and local/offline mutation. Disable fields, repeated submission and dismissal while pending. Failures retain entries; revision conflicts retain the existing message asking the user to cancel and reopen. Successful save updates the profile and closes the dialog.
- Before handoff, run formatting, scoped lint and production build/type checks. Review one laptop and one phone, including invalid Name, retained failed draft, pending dismissal guards, focus return and an offline save/reload. Do not read, add, modify or run automated tests.

Implementation and verification on 2026-10-20:

- EditTeamDialog owns the mounted editing draft, client validation, existing update mutation and captured revision. TeamFields composes the three controlled Mantine inputs with shared spacing and explicit optional labels in both catalogs. TeamDetailsPage retains the pencil, profile and roster, and restores pencil focus after dismissal or successful save. The New team page and legacy TeamForm are unchanged.
- Formatting, scoped lint, production build/type checking and diff whitespace checks passed. Reviewed a 1440×900 laptop and 390×844 phone. The compact laptop dialog measures 380×454; the phone fills its viewport with actions visible at the bottom. Roster bounds remain unchanged on opening. Portuguese labels fit, opening focuses the close control, and invalid Name focuses its field with an inline error.
- A changed fixture revision produced the existing conflict message and retained the draft. Cancel discarded the draft; reopening after reload loaded the latest record. A forced local write failure retained all fields and left the revision/outbox unchanged. Holding a local write confirmed that fields/actions disable and Escape cannot dismiss while pending.
- Retry with network access disabled saved trimmed values and queued a team.update command. The updated profile and pending command survived a service-worker-controlled offline reload. Account/download responses were mocked in an isolated review context and no backend write occurred. All identified fixture records, ownership metadata and commands were removed afterward; player/team/membership/outbox counts were zero.
- No automated tests were read, added, changed or run. Physical-device software keyboards and other browser families remain unverified.

## New team implementation

The user approved the unboxed creation page, category presets with custom entry and Mantine YearPickerInput. New team and the shared fields are implemented for review.

- NewTeamPage composes PageHeader, FormLayout and TeamFields, matching New player on phones and laptops. Name is required; Category and Season remain optional and initially empty. The existing local create mutation opens the created team's details, where Add players is available. The unused legacy TeamForm and its interface were removed after its last caller migrated.
- TeamFields uses Mantine Autocomplete with the agreed presets sub14, sub15, sub17, sub19, Senior and Veteran. Filtering, keyboard selection, clear and custom text use that control. These category names remain unchanged data values rather than new domain enums.
- SeasonPicker uses YearPickerInput from @mantine/dates 9.7.3, matching core/hooks, with its required dayjs dependency. Selecting 2026 displays and stores 2026/27. Clearing restores the optional empty value. The picker navigates four-digit starting years and selects no month/day. seasonFormatting converts between the picker date string and stored season text without timezone conversion.
- Existing nonstandard season text remains in an editable TextInput with an explicit clear action. Clearing it switches to the year picker; saving other fields preserves that text, and Cancel discards an unsaved replacement. Team category/season storage, validation, mutations, revisions and synchronization contracts are unchanged, with no migration.
- The shared theme supplies Autocomplete/YearPickerInput sizing, dropdown glass, option targets and selection styling through existing semantic tokens. The root imports dates styles after core styles. SeasonPicker reuses control-radius/action tokens, localizes year navigation and selection labels and keeps popovers inside the dialog's focus boundary. Escape dismisses the inner picker while retaining the editor.

Verification on 2026-10-20:

- Final scoped lint, formatting, catalog-key parity, diff whitespace and production build/type checking passed. Final phone review confirmed all six category presets have 44px option targets and no horizontal overflow. Reviewed one 1440×900 laptop and one 390×844 phone, including Portuguese labels. The unboxed form and year grid fit without horizontal overflow; the same picker remains reachable in the compact desktop editor and full-screen phone editor.
- Required-name feedback focuses Name. Preset filtering and keyboard selection work. Selecting 2026 created a team with season 2026/27; selecting 2027 created season 2027/28. The clear action restored the empty optional state. Custom category text saved through both creation and editing.
- A forced local insertion failure retained the complete creation draft. Retrying with network access disabled created the record and pending team.create command, navigated to details and survived a service-worker-controlled offline reload. Legacy category/season strings survived editing unchanged; clearing/replacing a custom season then cancelling retained the original stored value.
- The isolated preview used mocked account/download responses and rejected command uploads; no backend write occurred. All identified fixture teams, ownership metadata and related commands were removed afterward. Player/team/membership/outbox counts were zero. No automated tests were read, added, changed or run. Physical-device software keyboards and other browser families remain unverified.

Next: review these forms before planning another page increment.

## Matches list and creation

The user accepted New team and authorized the Matches list as the next increment. The list is implemented for review. The New match wizard is accepted. The setup/live overview and separate setup editors below are implemented for review. Start, completed-summary redesign and live recording remain later increments.

### Listing

- Reuse PageHeader, BackLink, SearchToolbar, EntityDataStatus and restrained empty states. Add a feature-owned MatchRow using the shared row design, with compact delivery status and no outer card. Preserve current team/opponent search, creation-date sorting and navigation to match details.
- Show one lifecycle badge per row: Setup, Live or Completed. Live uses the existing mint accent; Setup and Completed use restrained neutral styling and explicit labels. Completed means the match has ended, not that its call-up is full. Extract MatchStatusBadge for reuse in later Match pages.
- Show the called-up player count as secondary metadata alongside date/venue when available, rather than another lifecycle badge. Keep team/opponent names on one truncated title line. Keep the lifecycle pill vertically centered across both text lines. On phones, align call-up/date/venue metadata directly beneath the match title and truncate the metadata line with ellipsis when needed.
- useMatches already returns MatchSnapshot with its player list. Counts and lifecycle badges need no new query, storage field or service workflow.

### Listing implementation and verification

- MatchesListPage now composes PageHeader, SearchToolbar, feature-owned MatchRow and MatchStatusBadge. Rows use separators without an outer card, a one-line truncated match title, lifecycle pill, called-up count, optional date/venue and compact delivery indicator. Live uses the existing mint tokens; other lifecycle states remain neutral.
- Existing local queries, normalized team/opponent search, creation-date ordering and detail/create routes are unchanged. No persistence, service, API or match-creation changes were needed.
- Scoped ESLint, formatting, production build/type checking and diff whitespace checks passed. No automated tests were read, changed or run.
- Reviewed the production list at 1440×900 in English and 390×844 in Portuguese using isolated local fixtures for Setup, Live and Completed. Checked empty/no-results states, accent-insensitive search, clear search, row navigation, zero/five-player counts, long-title truncation and no horizontal overflow. A service-worker-controlled reload under offline network emulation retained the three local matches.
- Preview fixtures are removed after verification; the preview does not submit backend mutations. Physical-device and other-browser review remain outstanding.

The follow-up row refinement centers each lifecycle pill across both text lines and aligns metadata beneath the title on laptop and phone. Metadata stays on one line with ellipsis and a full-text tooltip. Production checks at 1440×900 and 390×844 confirmed centered pills, matching title/metadata left edges and no horizontal overflow. Build/type checking, scoped lint and formatting passed; no automated tests ran.

### New match

- Use a full-page, unboxed three-step form with Mantine Stepper: Match details, Call-up, Review. Style Stepper through shared theme/CSS tokens. Keep its numbered progress compact and labels below the markers on phones; avoid a large vertical progress panel. Keep feature-owned draft and step state rather than introducing a generic wizard framework or another form package.
- Match details: searchable Mantine Select for the existing Team, TextInput for opponent, optional clearable DatePickerInput for the scheduled date and optional clearable SegmentedControl for Home/Away/Neutral venue role. Team options include category/season to distinguish equal names. Reuse the installed dates package and existing glass dropdown/input styling. Opponent remains free text and venue/date remain optional.
- Call-up: use SearchField and SelectableEntityRow with compact player identity, membership role/jersey metadata and visible selection counts. Prefill each selected player's number and role from team membership. Selection starts empty, preserving the existing creation default. Keep checkbox rows stable; selection never expands a form beneath them. Preserve selection across filtering and Back navigation.
- Review: show a concise match summary and selected-player rows. The user chose compact rows with a pencil opening ResponsiveFormDialog and MembershipFields. Apply changes only the in-memory Match draft, not the Team membership; cancelling the player editor retains its previous draft values.
- Permit navigation to visited steps and validate Match details before continuing. Keep Continue/Back controls consistent, and use Create match only on the final step. No record is committed until that final action succeeds through the existing atomic creation workflow. Errors retain the draft and pending saves lock fields/actions/navigation.
- Keep the existing limits of eight field players, two goalkeepers and ten total. Prevent selecting more than ten; role counts can be corrected on Review before final validation. Show maxima explicitly so the UI does not suggest ten players are required. Incomplete or empty call-ups remain saveable. Duplicate numbers remain a nonblocking warning. Start remains a separate workflow for starters and periods.
- If the user changes Team after selecting players, confirm before clearing that team's call-up. Cancelling keeps the previous team and call-up; accepting retains other match details. Returning between steps otherwise preserves all values.
- Reuse controls and feature-owned field/selection/review compositions. Do not silently replace the existing Match details setup editor while migrating NewMatchPage; that editor gets its own increment. Add labels to both catalogs and run relevant non-test checks with one laptop and one phone when each implementation is authorized.

### New match implementation and verification

- NewMatchPage composes PageHeader and NewMatchWizard. The unboxed wizard uses the shared FormLayout, themed Mantine Stepper, searchable team Select, opponent TextInput, optional clearable DatePickerInput and a three-option venue SegmentedControl. MatchDetailsFields, MatchCallUpSelection and MatchCallUpReview stay feature-owned. No packages, schemas, services, queries or recorder behaviour changed. At this increment, the existing MatchForm still served the setup editor; it was replaced by the separate editors below.
- Call-up selection uses SearchField and SelectableEntityRow with optional metadata and disabled state. Filtering and visited-step navigation retain the draft; selecting a player copies their team role/number. Review uses compact rows and ResponsiveFormDialog/MembershipFields, with Apply and Cancel affecting only the temporary Match draft. Changing teams with a selection asks for confirmation before clearing it. The shared form gains optional Back and disabled-submit controls; BackLink supports a disabled state without changing header height while saving.
- Existing limits remain eight field players, two goalkeepers and ten total. Selection stops at ten, role excess blocks final creation, and duplicate numbers show a nonblocking warning. Empty/incomplete call-ups remain valid. Only the final action calls the existing atomic creation mutation. Errors retain all values for retry; pending saves lock the wizard, editing and local Back/Cancel controls.
- Production review used one 1440×900 laptop in English and one 390×844 phone in Portuguese. Checked required-field feedback, optional date/venue selection, long names, filtering/clear, selection retention, visited steps, a ten-player invalid role split corrected through Review, and cancelled player/team edits. No horizontal overflow occurred. A saved ten-player snapshot retained the Match-only role/number edit while the original TeamPlayer remained unchanged. No Match or outbox write occurred before Create.
- A separate empty call-up also saved successfully. A forced local save failure retained the phone Review draft; retry with network access disabled saved an incomplete two-player call-up and queued its match.create command. The record survived a service-worker-controlled offline reload. Account/download responses were mocked only in an isolated preview and command uploads rejected, so no backend write occurred. All identified preview fixtures, ownership metadata and commands were removed after verification; team/player/membership/match/MatchPlayer/outbox counts were zero. Physical-device keyboards, other browser families and held-save pending transitions remain unverified.
- Relevant non-test build/type checking, scoped lint, formatting, catalog parity and diff whitespace checks passed. No automated tests were read, added, changed or run. Match details, Start and recording remain separate later increments.

The first New match refinement used the shared segmented styling for Home/Away/Neutral, retaining an initially unspecified venue and an explicit clear action. Calendar weekends use the existing action accent; selected days retain their contrasting text. Mobile steps each occupy one third of the progress bar, which sticks directly below AppHeader. Header spacing and the sticky offset share global header-height tokens. Production checks at 1440×900 and 390×844 confirmed equal mobile step widths, a 61px sticky offset matching the header, sticky behaviour through the call-up list, venue selection/clear and mint weekend dates. Build/type checking, scoped lint, formatting and diff whitespace checks passed. No automated tests ran. Isolated preview fixtures were removed without backend writes.

### Approved wizard polish

The user approved gradient progress, outer mobile markers aligned to the content edges, full-width mobile selection rows with comfortable inset content, a compact selected-count badge with role limits, an unboxed matchup summary with Edit, and a sticky mobile Back/Continue action row. The existing Back to matches link is the exit action on all screen sizes. Remove repeated call-up instructions from selection and Review. Labels across all forms omit the optional suffix while required indicators and validation remain unchanged. Calendar weekends gain a stronger semantic accent. No persistence or selection/save rules change.

The approved wizard polish is implemented for review. MatchCallUpSummary supplies the compact selected Badge and role limits to both selection and Review. MatchReviewSummary presents the matchup, category/season, specified date/venue and Edit details action. The repeated call-up paragraph is removed from these steps, while the Match-only explanation remains in the player editor. Shared SelectableEntityRow styling adds inset separators, a fainter selected fill and 16px horizontal padding; the Match selection list extends to the phone edges. FormLayout's opt-in wizard layout keeps Back and the primary action together in a sticky mobile bar, leaving other form action layouts unchanged. The wizard omits Cancel on desktop and mobile; Back to matches remains the exit action.

Completed progress circles/connectors use shared mint-gradient tokens. Mobile outer circles align to the 16px content edges with evenly spaced marker centers and shorter labels. The active circle scales slightly without moving its click target; reduced motion disables the transition. The global calendar weekend token is brighter and more saturated, with heavier weekend numerals. Both catalogs remove optional suffixes from Category, Season, jersey number, match date, venue and period duration labels without changing validation.

Verification passed: production build/type checking, scoped lint, formatting, catalog-key parity and diff whitespace. Reviewed 1440×900 English and 390×844 Portuguese. Confirmed gradient states, marker placement, sticky top/bottom bars through long lists, full-width phone rows with a 16px checkbox inset, compact counts, long-name truncation, and Edit details retaining the Match draft. Calendar weekend numerals render #75edbf at weight 650; no horizontal overflow occurred. A service-worker-controlled offline reload loaded the revised form. No automated tests were read or run. Isolated account/download responses were mocked, no forms were saved, and all preview fixtures and ownership metadata were removed afterward.

The follow-up density refinement removes Edit details from the Review summary; visited-step navigation still returns to Match details. Step markers are 32px and repeated step headings use smaller accent text. Wizard actions have no desktop divider or extra top padding; mobile drops the extra margin above the actions and the page/shell padding below them. Other form action layouts retain their spacing. The player editor groups identity and Match-only guidance with a small gap and removes paragraph margins before the fields. No draft, validation or save rules change.

Production review at 390×844 confirmed 32px markers, 16px accent step headings, zero extra list/action and action/footer gaps, and no horizontal overflow. The 1440×900 Review has no action divider or Edit details button. The player editor uses an 8px identity/guidance gap and 24px before fields. Build/type checking, scoped lint, formatting and diff whitespace checks passed. No automated tests ran. Preview fixtures were isolated, no forms were saved and identified local data was removed afterward.

The mobile wizard action bar retains its subtle top separator; the desktop action divider stays removed. Footer vertical padding is reduced to 8px on wider screens and 6px on phones, preserving existing control heights and behaviour. CSS formatting and diff whitespace checks passed; no automated tests ran.

The mobile wizard now fills the available shell height through the page, wizard and form flex columns. The action bar uses automatic top space to stay directly above the footer on short steps, while remaining sticky on long content. Form content has 16px bottom padding before the separator. Production review at 390×844 confirmed the empty Review action bar ends exactly where the footer starts, the footer ends at the viewport bottom, and long Call-up content retains the sticky bar. Production build/type checking, CSS formatting and diff whitespace checks passed; no automated tests ran. No form was saved during the isolated preview and identified fixtures were removed afterward.

## Match overview and separate setup editors

The user accepted New match and authorized the setup/live Match overview with separate Edit details and Edit call-up actions. Use the actual matchup as PageHeader's title, optional date/venue beneath, lifecycle pill and compact delivery indicator. Remove UUID, boxed metadata/players and repeated storage notice. Reuse the compact call-up summary and avatar rows. Setup offers Prepare match, which still opens the existing starters/periods page; Live offers Open live match. The primary action is beside the heading on desktop and in a sticky mobile bottom bar. Empty setup call-ups offer Add players.

Edit details uses ResponsiveFormDialog with opponent, optional calendar date and venue segments; team/call-up stay fixed. Edit call-up uses a full-page two-step Select/Review mode on the existing /app/matches/view?id=…&edit=call-up route, reusing selection, progress and player draft controls. Existing players remain available with snapshot names even if membership/player records have changed. Both editors capture the starting revision, preserve failed drafts and call the existing updateMatchSetup mutation only on Save. The completed summary retains its current presentation and read-only recorder. The starters/periods page and live recorder get later increments.

Implementation reuses MatchMetadataFields and MatchFlowProgress with creation, and allows MatchCallUpReview to render read-only rows on the overview. Legacy MatchForm and MatchPlayerSelection were removed after their final callers migrated. No schema, service, query, route-cache allowlist or recorder rules changed. PageHeader has an opt-in second action row on phones so status/edit controls do not squeeze long match names. Metadata date/venue controls stack in narrow containers, including the compact laptop dialog.

Non-test verification passed on the production build at 1440×900 and 390×844: setup/live overview actions, completed read-only summary, metadata calendar selection/save, separate call-up selection/review/save, historical player identity retention after membership removal, unchanged team membership numbers, accent-insensitive search and retained conflict drafts. Mobile production offline reload passed for both overview and the edit query mode; a call-up change saved offline and survived reload. New match shared-control rendering was checked after extraction. Type checking, scoped ESLint, formatting, catalog key parity and diff whitespace checks passed. No automated tests ran. Preview data stayed in an isolated browser context and command uploads were blocked.

## Creation duration and match preparation

Duration belongs in the Match creation Details step and the pre-start Edit details dialog. Configure two equal halves through one duration-per-half control. Team category supplies a default: Senior, U-19 and Veteran use 25 minutes; U-17 and U-15 use 20; U-13 uses 18. Veteran's default is the user's product choice. Add U-13 to the existing Team category choices without renaming existing categories. Custom or missing categories require an explicit duration choice. Allow overriding the suggested duration for competition-specific formats.

The youth/Senior defaults follow Article 6 of the [FPP July 2026 regulation](https://fpp.pt/wp-content/uploads/202627_RGHP_vf.pdf#page=11). Specific competitions can differ, including women's youth nationals under Article 102, so these are editable defaults rather than exhaustive competition rules.

The approved starting-five selection uses compact selectable rows grouped by field players and goalkeepers, with four/one limits and clear insufficient-call-up feedback. Preparation no longer owns duration or attack direction. The recorder increment will address attack-direction selection; changing duration while recording is lower priority. Cup-specific extra periods remain in the backlog. The user approved a single starting-five preparation page after moving settings into creation.

Implementation must persist the selected format on the Match rather than recalculate it from the Team later. Current setup snapshots require an empty periods array, so moving configuration earlier requires coordinated validation/create/update/start changes. Keep existing stored setup/live/completed records readable and preserve existing period configurations. Do not add a second authoritative duration field alongside periods.

## Component policy

Use Mantine directly for generic controls: Button, TextInput, PasswordInput, Checkbox, Alert, Menu and Modal as their increments arrive. Use Paper/Card, typography and layout components where helpful. Do not create a wrapper for every library component.

Keep feature compositions such as player assignment, match setup, scoreboard, clock and timeline application-owned. Preserve the recorder's first-tap context, save locks and failed-save retry when its dialog is migrated. Existing controls can coexist with redesigned pages during this branch; remove them only after their callers migrate.

## Verification policy

Follow [AGENTS.md](../AGENTS.md) and the [Development plan](development-plan.md). Run relevant non-test checks. When layout verification is needed, check one representative phone size and one laptop size only. Do not run enlarged-text checks or additional viewport sizes unless the user requests them. Earlier multi-size verification above is historical evidence, not the ongoing verification scope. Verify service-worker/offline behavior in production. Do not mark a phase complete from source inspection alone. Record unavailable checks and outstanding physical-device/browser-family review honestly.

### Duration/preparation implementation and verification

Implemented for review. MatchDurationField shares the preset/custom control between creation and Edit details. matchFormat centralizes category defaults and period conversion. Creation persists the selected format immediately, Review and overview display it, and call-up edits preserve it. StartMatchPage/StartMatchForm use grouped compact checkbox rows with four-field/one-goalkeeper limits, retained conflict drafts and sticky mobile actions. Legacy setup records without a duration show recovery feedback; existing live/completed formats stay readable. Start uses saved periods and leaves the clock paused at zero. Server acceptance guards an already configured format against Start-time replacement, while preserving legacy queued commands. No packages, SQL columns, IndexedDB versions or offline routes were added.

Production browser checks at 1440×900 and 390×844 covered category defaults for U-13/U-17/Senior, custom-duration validation and fractional input, creation persistence, duration updates, preservation through call-up edits, starter limits/deselection and revision-conflict retention. The phone check used Portuguese and verified no horizontal overflow, production offline reload, offline Start and live reload retaining the two halves/five starters/paused zero clock. Legacy empty-period setup feedback and an existing completed single-period snapshot rendered correctly. Automated tests were not read, changed or run. Backend uploads were blocked in the isolated preview; real PostgreSQL acceptance was not exercised.

The custom-category phone flow also required an explicit duration, then created an empty-call-up Match offline with two 15-minute halves that survived reload. Build, TypeScript, scoped ESLint, source formatting, catalog parity and diff whitespace checks passed. Identified preview fixtures and their outbox entries were removed, and the preview server was stopped.

### Live recorder: balanced board

Approved layout: compact scoreboard with the clock centred between the teams, sticky recording controls, two-column field players and a centred goalkeeper. Bench selection and a stable six-action grid follow. Undo and opponent goal remain directly accessible. Mobile uses a dedicated workspace without the application header/footer, with recent events below and full history in a dialog; desktop keeps the timeline alongside capture controls.

Event entry uses a full-screen phone dialog and a restrained glass desktop dialog, one required choice at a time. Simple events save on the final choice. Back revises choices without recapturing event identity, wall-clock time, period or known game time. Cards, penalty completion, period completion and match completion retain explicit confirmation. Event entry does not pause the clock. Attack direction moves into recorder options and changes only the current period through the revision-checked match.control queue. Duration editing remains deferred.

Implemented for review as feature-owned sections with adjacent styles and interfaces. The coordinator retains the existing draft store, event mutations and eligibility rules. End period now confirms before advancing. Completed views keep a read-only score and full timeline.

Non-test verification passed: scoped ESLint, TypeScript, production build, formatting, English/Portuguese catalog parity and diff whitespace checks. Production browser review at 390×844 and 1440×900 covered long-name truncation, 44px touch targets, sticky controls, both event-entry orders, Back retaining captured time while the clock runs, goal/score updates, atomic substitutions, blue-card confirmation, reduced lineup, Undo, clock adjustment, direction persistence and explicit period/match completion. Phone recent history shows three rows and opens all events in a full-screen dialog. A simulated local save failure retained its draft and retried successfully; focus returned to its trigger. Portuguese rendering had no horizontal overflow. A service-worker-controlled reload and a new event save under offline network emulation retained the score, events and pending outbox commands after reload. Automated tests were not read, changed or run. Preview data stayed isolated and command uploads were blocked; real PostgreSQL acceptance and physical-device keyboard ergonomics were not exercised.

### Live recorder density refinement

Approved next increment: place the action section above the player board and keep a visible goalkeeper border. Event rows use at most two lines, with participant/substitution identity above action and half/time metadata; time uses the existing accent token. Truncate long content and retain full event details, card effects and delivery information through accessible tooltips. Replace first/second period wording with localized half labels, retaining a numbered fallback for older extra-period records. Action-modal redesign remains a separate discussion.

Implemented and checked on the production build at 390×844 in Portuguese and 1440×900 in English. Actions precede the player board, the goalkeeper has the accent border, and every reviewed event row remains 53px high with two text lines. Long participant/action text truncates without horizontal overflow; focus/touch reveals complete details, including card effects. First/second-half labels render correctly in scoreboard and timeline. Scoped ESLint, TypeScript, production build, formatting and whitespace checks passed. No automated tests or recorder mutation rules changed; action-modal refinements remain a separate discussion.

### Recorder dialogs, countdown and event context

Approved scope: remove the event-dialog stepper; use a consistent New event title and one-line player/action context with a prominent identity and accented frozen countdown. Reuse board icons on action choices and semantic yellow/blue/red accents on card choices. All event time displays use the captured elapsed value and that event's own half duration, with the same countdown rounding as the live clock; stored elapsed timestamps remain unchanged. Legacy unknown durations/times show unavailable time rather than an invented countdown.

Attack direction exposes only left-to-right/right-to-left, defaults to left-to-right and never wraps its labels. Existing unknown direction records remain readable and use the default in the control; no automatic second-half reversal is introduced. New regulation configurations carry the default explicitly.

New recoveries and losses require a defensive/attacking half with no preselection. Legacy events retain absent/unknown location. Coordinates remain optional and are not synthesized. Opponent score alone can be corrected using current-total counters; our score stays read-only and tied to shot history. Existing score adjustments remain readable. Shared counters compose Mantine NumberInput with accessible touch-sized minus/plus controls. Clock editing supports minutes/seconds, carry/borrow, direct typing, bounded remaining time and one explicit save. New event commands use a versioned contract while older stored events and queued commands retain their compatibility paths. No automated test work is authorized.

Implemented with shared NumberStepper, DurationCounter and RecorderContext components, plus feature-owned score/time forms. Version-4 commands require the new event context while stored legacy events and older queued commands retain their validation paths. SQL migration 0012 adds a nullable rink_half column and was applied locally.

Non-test checks passed: TypeScript, scoped ESLint, production build, source/catalog formatting, catalog key parity and diff whitespace. Production browser review at 390×844 in Portuguese and 1440×900 in English covered both entry orders, action icons, coloured cards, single-line context with long-name truncation, required half selection, Back preserving captured time, opponent-only score correction, clock typing and second/minute carry/borrow. An empty clock field disabled Save. Legacy recovery and own-score adjustment records stayed readable. A ball-loss save under offline network emulation survived a service-worker-controlled reload with its defensive half and version-4 outbox command intact; previous timestamps stayed unchanged after clock correction. Backend uploads were blocked in the isolated preview; real PostgreSQL event acceptance and physical-device keyboard behaviour were not exercised. Automated tests were not read, changed or run.

### Recorder dialog footer refinement

Approved scope: align team scores in score correction, remove its repeated Save heading and move Save to the modal footer beside Cancel. Event flows no longer show Back. Keep player and action adjacent and vertically centred; only the timestamp is bold and accented, with a muted period label. Preserve captured timing, validation and persistence behaviour.

Implemented and checked on the production build at 390×844 in Portuguese and 1440×900 in English. Score correction has aligned team scores and one footer Save button; unchanged values disable Save, Cancel discards edits, and Save updates only the opponent score. Event dialogs have no Back button. The player/action gap is 6px on phone with matching vertical centres; period text uses normal weight and muted colour, while the timestamp uses the accent and weight 600. TypeScript, scoped ESLint, production build, source formatting and whitespace checks passed. No automated tests were read, changed or run. Identified preview records were removed and the preview server stopped.

### Save labels and score presentation

Approved refinement: use concise Save / Guardar labels for save actions across forms and dialogs. Keep creation and lifecycle verbs explicit. The recorder Save button uses standard sizing and fills the remaining phone footer width. Our score is plain read-only text, vertically aligned with the editable opponent score without an input border.

Production review passed at 390×844 in Portuguese and 1440×900 in English. Phone Save is 48px tall and fills the remaining footer width; the read-only score has no border and its value shares the opponent input’s vertical centre. Save stays disabled until the opponent score changes. TypeScript, scoped ESLint, production build, source/catalog formatting, catalog key parity and whitespace checks passed. Automated tests were untouched. Identified preview data was removed and the preview server stopped.

### Live powerplay refinement

Approved on 2026-10-21: remove the standalone powerplay block; show outstanding blue/red cards beside the main clock, the summed remaining time across all outstanding penalties and restrained red Powerplay active text near On field. Blue penalties last two minutes and direct reds four, with sequential playing-time expiry only. Carry remaining time across halves. Match-clock correction affects pending penalties; Correct powerplay also edits the current remaining duration or explicitly ends it at zero. Opponent penalties remain outside this increment.

When the final penalty expires, open Player in without automatically changing the lineup. Preserve open event/control dialogs and prompt afterward; cancellation retains the action beside the lineup heading. Derive expiry from saved card times and clock anchors without background events, so Undo remains observer-driven. Historical untimed cards stay readable and can be corrected.

Implemented for review. TypeScript, scoped ESLint, source/docs/migration formatting, English/Portuguese catalog parity and the production build passed. SQL migration 0013 applied to local PostgreSQL. Browser acceptance covered sequential blue/red expiry, pause/resume, current-penalty correction, explicit zero completion, a forced local insert failure with exact Retry, final-penalty prompts deferred behind an open timed shot draft, cancellation, Player in, Undo and repeated completion after Undo. A backward clock correction retained a recorded fifth-player entry. A four-minute red penalty carried three minutes into the second half after a one-minute clock advance.

The final indicator showed two blue symbols and 04:00 beside the main clock. Red status, long names and the correction dialog were reviewed at 390×844 and 1440×900, plus 320px with 125% text scaling. Narrow correction counters/actions stack to retain readable values and labels. A service-worker-controlled reload under offline network emulation retained the four-minute total and both cards; an uncached API request was blocked. Review records stayed in isolated browser contexts and were removed afterward. Authenticated event upload/server workflow acceptance and physical-device/browser-family checks were not exercised. Automated tests were not read, changed or run.

### Clock centring with powerplay

Keep the main Match clock, half label and running status centred within the scoreboard when powerplay cards are visible. MatchControls reserves equal grid tracks on both sides of the timer; the left track contains the penalty indicator and the right stays empty. Penalty rules and recording behavior are unchanged.

Production build and formatting checks passed. Browser geometry confirmed the clock midpoint matches the scoreboard midpoint with cards at 390px, 1440px and 320px with 125% text scaling, with less than 0.01px rounding error and no horizontal overflow. The no-card desktop layout also stayed centred. Identified review data was removed and the preview server stopped. Automated tests were untouched.

### Rink-first recording

The approved rink uses the 40-by-20 metre playing-area proportions with rounded corners and the application accent. HockeyRink renders one shared inline drawing with supplied markers for future reuse. The desktop placement is refined by the viewport increment below; compact screens show Record on rink and use a dedicated picker inside the existing event dialog. Touch hold/drag uses a magnifier, release continues to action/player choices and keyboard access remains available.

The observer view follows the saved direction for each half. First contact freezes capture context; accepted points convert to team-relative coordinates and supply recovery/loss half except on halfway. Change position and Back retain captured time. History overlays, filters and statistics are a later increment. Implementation and production-browser verification are recorded in Development plan; physical-device acceptance remains outstanding.

### Desktop recorder viewport refinement

Approved scope: keep the desktop scoreboard/clock controls, action grid and lineup in the left column, with a slightly smaller rink above the timeline on the right. Cap the rink at 480px wide, use compact desktop action/lineup spacing, retain event-row readability and scroll only the event list beneath its visible heading. The desktop rink uses a short selection hint with accessible help for full instructions.

Target 1366×768 and 1440×900 browser viewports at normal text size. Shorter windows, larger text and long content must retain accessible page scrolling. Compact-screen layout and mobile recording flow remain unchanged.

Implemented for review. Production browser checks with a ten-player call-up and 30 events fit at 1366×768 and 1440×900 in English/Portuguese without page scrolling. The rink is 480px wide at default text size, and event rows retain their existing dimensions. Scrolling the list leaves its heading stationary; keyboard-accessible help opens and dismisses normally. Shorter windows and 150% text sizing retain page scrolling without horizontal overflow. A 390px touch-emulated phone retained the existing button placement, action grid and rink-to-event flow. Source lint, TypeScript and production build passed; automated tests were untouched.

### Rink orientation and selected position

Approved scope: replace the external attacking-direction sentence with Attack and Defence labels inside the rink and a subtle accent tint on the attacking half, fading around halfway. Keep team goal labels above the rink. Use the existing accent, text and background tokens; labels carry the meaning independently of color. Orientation follows the saved direction for the recorded team.

Make the selected point readable at every rendering size with an accent centre, contrasting ring and dark halo. Enlarge the desktop dialog preview and keep the accepted point visible on the background rink until the draft is saved or cancelled. Remove visible percentages during selection, retaining semantic half announcements for assistive technology. Mobile recording flow and magnification are unchanged.

Implemented for review. The desktop preview is 136px wide at default text size; the marker keeps its screen size across full and compact renderings. Both saved directions, preview/background alignment, clearing on save/cancel, keyboard feedback and production offline reload passed browser review. Portuguese mobile views at 390px and 320px with enlarged text retained a clear marker without horizontal overflow. Source lint, TypeScript, formatting, catalog parity and production build passed. A touch-release action click-through remains for the separate mobile-flow pass; physical-device acceptance is still pending. Automated tests were untouched.

### Rink desktop and mobile polish

Approved refinement on 2026-10-22: invert the tint to the defensive half, enlarge the event preview to the available dialog width, remove the separate rink heading and both team goal labels, and move the desktop help control beside the existing click instruction. Keep Attack and Defence inside the rink with larger lettering, especially on phones.

Replace the mobile map-pin button with a small shared rink SVG followed by Record on rink on a glass-style control. Remove event-dialog Back navigation and retain Cancel and Change position. Reduce touch magnification from 3× to 1.5× and show a centre marker in the offset lens. Prevent the release click from selecting a choice on the following screen. General font sizing remains a later increment.

Implemented for review. Desktop fit passed at 1366×768 and 1440×900 with 30 or more events; the dialog rink spans approximately 400px. The help control opens beside the hint, supports Escape and restores focus. Mobile review confirmed larger labels, the small rink control, full-width previews, 1.5× magnification and three touch releases without action click-through. Change position retains the point, and the footer has Cancel without Back. Portuguese 320px enlarged-text layouts had no horizontal overflow. Source lint, TypeScript, formatting, catalog parity and production build passed; both desktop and mobile production offline reloads worked. Automated tests were untouched. Physical-device and browser-family acceptance remain pending.

### Recorder spacing and rink guidance

Approved scope: use consistent recorder insets and section gaps, give scores room above the separator, balance the space around clock controls, and increase the desktop rink's top inset. Swap the half-label colors to muted Attack and accent Defence, move them slightly lower and reduce their size slightly. Keep the mobile rink horizontal, use short touch-only instructions and remove the reserved magnifier gap. Place the lens above or below the finger as space allows. Include shared rink previews in attack-direction choices. Action/player button appearance and general font sizing remain for a later discussion.

Implemented for review. Production review with an active powerplay and 31 events retained full-page fit at 1366×768 and 1440×900. Mobile guidance excludes keyboard text, and the lens stays clear of top/bottom selections without an empty spacer. Direction previews switch with Left/Right; Save updates the recorder. Portuguese 320px enlarged-text direction options and the picker had no horizontal overflow. Desktop and mobile production offline reloads passed, with no runtime page errors. Source lint, TypeScript and build passed; automated tests were untouched. Physical-device and browser-family acceptance remain pending.
