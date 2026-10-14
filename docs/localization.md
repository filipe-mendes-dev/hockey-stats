# Localization

## Baseline

Use next-intl from Phase 0. Support English (`en`) and European Portuguese (`pt-PT`). English is the fallback language. Application language does not change the instruction to communicate with the developer in English.

Keep URLs independent of language, including `/offline`. No `[locale]` route segment or locale redirect is required.

## Planned files

- `apps/web/messages/en.json`: English messages.
- `apps/web/messages/pt-PT.json`: Portuguese messages with the same keys and interpolation arguments.
- `apps/web/src/i18n`: supported locales, request configuration and browser/provider integration.

Use feature namespaces as features arrive, such as `common`, `accounts`, `game`, `recorder`, `offline` and `errors`. Phase 0 needs only the placeholder shell and language-control messages.

## Message rules

- Translate every user-facing label, validation message, error, toast, empty state and accessibility label in both catalogs.
- Use stable semantic keys rather than English sentences as identifiers.
- Use complete messages with ICU interpolation/plurals. Do not build translated sentences by concatenating fragments.
- Type-check message keys and validate catalog key/argument parity.
- Keep domain enums, identifiers and API error codes language-neutral. Map them to messages in the UI.
- Do not translate player/team names or other user-entered data.
- Format dates and numbers for the selected locale. Locale does not change stored time, event order or coordinates.
- Render match time as a duration, not a time of day.
- Report missing translations during development; incomplete Portuguese coverage does not pass.

## Language preference

Provide an English/Portuguese selector in the Phase 0 shell and retain the choice locally. A locale cookie may supply the online server-rendered preference; the browser's saved preference must remain available without the server. Account-level preference sync can follow later.

Validate against the supported list. Fall back to English for absent/unsupported preferences. Keep online server/browser initial rendering consistent to prevent hydration mismatches.

The generic `/offline` shell starts with a deterministic initial locale. After browser initialization, read the saved preference and supply locale/messages explicitly to its client provider. Update document language with the visible language. Keep this bootstrap independent of server cookie/session reads.

Bundle both offline catalogs into the required asset graph. Do not fetch remote translations or call `router.refresh` to switch language in `/offline`. Switching language preserves the current event draft, clock and unsynced records.

## Phase 0 verification

- Render the placeholder shell and language selector in both languages.
- Verify locale validation, catalog key/argument parity and fallback behavior.
- Confirm selection persists after reload without hydration errors.
- Do not implement recorder features or a service worker in this phase.

## Later checks

- Verify recorder workflows and error states in both languages.
- Test Portuguese text at the smallest viewport and with increased text size.
- Switch language offline with no translation request/server refresh or loss of draft/pending work.
- Keep catalog versions aligned with the cached application build.

Reference: [next-intl App Router setup](https://next-intl.dev/docs/getting-started/app-router), [client-provider configuration](https://next-intl.dev/docs/usage/configuration).
