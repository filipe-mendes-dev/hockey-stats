# Localization

Support English (`en`) and European Portuguese (`pt-PT`) through next-intl. English is the fallback. Application locale does not change the instruction to communicate with the developer in English.

## Files and bootstrap

- `src/messages/en.json` and `src/messages/pt-PT.json` contain matching keys and interpolation arguments.
- `src/i18n` defines supported locales, catalogs, preference and request configuration.
- `src/client/i18n/LanguageProvider.tsx` provides the selected locale/messages and updates document language.
- The next-intl plugin generates exact declarations for key/argument checking during type generation/builds.

URLs are independent of locale. Server rendering and initial hydration use deterministic English. After hydration, useSyncExternalStore restores the browser preference from localStorage key benchline.locale. Unsupported/absent values fall back to English. Storage restrictions allow session-only switching but may prevent preference persistence.

Both catalogs are bundled with the offline asset graph. Switching language requires no server refresh, navigation or remote translation fetch. It preserves current draft, clock and pending operations. Locale preference synchronization between tabs/accounts is not implemented.

## Message and formatting rules

- Translate labels, validation, errors, empty states and accessibility text in both catalogs.
- Use stable semantic keys and complete ICU messages; do not concatenate translated sentence fragments.
- Keep canonical enums, API error codes, IDs and user-entered names untranslated.
- Format dates/numbers for the selected locale. Match time is a duration; locale never changes stored elapsed time, replay order or coordinates.
- Check long Portuguese text and enlarged text at narrow widths. Use text alongside colour for status.
- Validate catalog structure/arguments when editing and run typecheck. Automated tests require explicit user instruction.

Verification status and remaining physical-device/browser checks are in the [Development plan](development-plan.md).
