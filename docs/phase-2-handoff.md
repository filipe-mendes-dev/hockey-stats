# Phase 2 PWA and Serwist increment

Date: 2026-10-15. This increment is complete; Phase 2 remains in progress. IndexedDB/workspace initialization and local navigation feasibility are next. No hockey features, data synchronization or sign-out cleanup are implemented.

## Implemented behavior

- `/app` is a public static placeholder and the PWA launch target. It boots without login, a session lookup or an API call. `/`, `/sign-in` and existing sign-out logic retain their Phase 1 behavior.
- The manifest defines the stable app ID, launch URL, standalone display and PNG installation icons, including a maskable icon. Existing branding supplies the icon artwork; no new design dependency was added.
- `@serwist/turbopack` and `serwist` 9.5.13 plus esbuild 0.28.2 are pinned. The standard Turbopack development/build scripts remain unchanged.
- The shared layout registers the worker in production, including on login/home visits. Development displays a disabled-installation message. Use separate development/production-check origins to avoid an already installed worker serving an older production document during development.
- The worker precaches generated JS/CSS/font assets, install icons and the explicit generic documents `/app`, `/manifest.webmanifest`, `/icon.svg` and `/favicon.ico`. No broad runtime caching, account/API responses, private HTML or auth redirects are included. RSC/prefetch requests bypass the worker handler; non-navigation fetches cannot receive cached `/app` HTML.
- The client checks the active worker's actual cache entries before reporting that application files are available offline. A failed install exposes retry. This is file availability only, not full application readiness; the latter still needs local database initialization.
- New workers remain waiting. The translated UI asks the user to close all Benchline Stats tabs/app windows and reopen when ready. No automatic reload, reconnect reload or forced activation occurs while a controlled window is open. Native activation after all windows close avoids adding an unnecessary cross-tab activation protocol in this first increment.
- The worker script uses no-cache/no-store headers and root scope permission. A one-day HTTP favicon cache also supports browser-managed favicon requests that can bypass the worker.

Document revisions combine generated asset fingerprints with the public entry/metadata source content, including uncommitted changes. This avoids depending on Git commit IDs or serving an old cached document that references a different build's assets. Worker source maps are disabled.

## Non-test verification

- `npm run check` passed formatting, lint, strict typecheck and a production Turbopack build. The production worker contains 26 precache entries, with approximately 687 KiB of discovered assets before transfer compression. Additional generic document sizes are not included in that build estimate.
- Against the production server on loopback port 3001, a fresh browser context first visited `/sign-in` and cached the application. With the network disabled, its first visit to `/app` succeeded without authentication cookies or a previous visit to that entry.
- Offline reload and English/Portuguese switching worked. Portuguese selection survived another offline reload. A 360 CSS-pixel viewport had no horizontal overflow. The final cold-launch/reload check reported no failed requests and no false first-install update notice. Screenshot: ignored `output/playwright/phase-2-pwa-pt-mobile.png`.
- A deliberately blocked required icon prevented fresh installation and displayed failure instead of cached status. Removing the network block and choosing retry completed caching. No update notice appeared for that first installation.
- A second production build installed a waiting worker while the previous build remained active. Reload kept it waiting. Releasing the controlled app page allowed native activation, and reopening used the new cache with obsolete entries removed.
- Inspected cached URLs: only the explicit generic documents, generated assets and install icons were present. An RSC request retained `text/x-component`; an auth-session API request retained JSON. No account page or API response entered Cache Storage.
- The worker response returned `Cache-Control: no-cache, no-store, must-revalidate` and `Service-Worker-Allowed: /`. The manifest returned the expected app ID, launch URL and icon sizes. Chromium's installation diagnostic reported only the expected incognito restriction in the temporary verification context.
- Local documentation file links and `git diff --check` passed. The new proposal/handoff documents were checked directly with Prettier because existing project documentation is excluded from the aggregate formatting command.

These were manual acceptance checks using browser tooling. No test files, test runner or automated test suite were read, added or run. Package installation reports the same nine dependency findings already recorded in the Phase 1 handoff; no unrelated audit fixes were applied.

## Remaining limits

- Physical-device installation, iPadOS/Safari and other browser engines have not been verified. Desktop Chromium emulation does not establish those results. HTTPS is required for deployed/physical-device environments; a plain HTTP LAN address is not equivalent to localhost.
- The public shell has no local database, team/player/game data, recorder, outbox, synchronization or real local view navigation yet. Phase 2 is not complete and the file-cache message deliberately makes no data-storage guarantee.
- Database migration/concurrency handling and richer safe-update behavior belong to later authorized increments. The current close-all-windows update policy is sufficient for the placeholder shell.
- Local-first read/write and sync semantics remain as agreed in [offline and sync](offline-sync.md). Explicit sign-out data removal and the proposed unsynced-work safeguard remain future work; this increment does not clear private data.

## File report

| File                                   | Change                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                         | Pin Serwist/Turbopack, Serwist and native esbuild.                                                                            |
| `package-lock.json`                    | Lock those packages and their dependencies; esbuild placement changes also retain older transitive copies for existing tools. |
| `next.config.ts`                       | Compose Serwist with next-intl and set worker/favicon headers.                                                                |
| `src/app/layout.tsx`                   | Add installation metadata/theme and shared production worker status/registration.                                             |
| `src/app/manifest.ts`                  | Define PWA identity, public launch target and icons.                                                                          |
| `src/app/app/page.tsx`                 | Compose the public static local app entry.                                                                                    |
| `src/app/serwist/[path]/route.ts`      | Build the worker and explicit public precache with content-based document revisions.                                          |
| `src/app/favicon.ico`                  | Add the browser favicon derived from the existing SVG.                                                                        |
| `src/worker/sw.ts`                     | Precache public assets, bypass RSC/prefetch, wait for safe native activation and answer cache checks.                         |
| `src/client/pwa/local-app.tsx`         | Render the translated placeholder without hockey features.                                                                    |
| `src/client/pwa/pwa-status.tsx`        | Render file-cache status, retry and waiting-update guidance.                                                                  |
| `src/client/pwa/use-service-worker.ts` | Register in production, inspect cache availability and observe lifecycle failures/updates.                                    |
| `src/client/pwa/styles.module.css`     | Style the placeholder, status and accessible retry control.                                                                   |
| `public/icons/icon-192.png`            | Add the 192-pixel install icon.                                                                                               |
| `public/icons/icon-512.png`            | Add the 512-pixel install icon.                                                                                               |
| `public/icons/icon-maskable-512.png`   | Add the icon with mask-safe artwork padding.                                                                                  |
| `public/icons/apple-touch-icon.png`    | Add the 180-pixel Apple touch icon.                                                                                           |
| `src/messages/en.json`                 | Add English placeholder/cache/update messages.                                                                                |
| `src/messages/pt-PT.json`              | Add corresponding European Portuguese messages.                                                                               |
| `README.md`                            | Document the implemented increment, preview, worker lifecycle and limitations.                                                |
| `docs/architecture.md`                 | Record selected versions, `/app` entry, cache boundaries and current status.                                                  |
| `docs/development-plan.md`             | Mark the increment implemented while leaving Phase 2 in progress.                                                             |
| `docs/backlog.md`                      | Resolve worker/entry selection and retain remaining gates.                                                                    |
| `docs/offline-sync.md`                 | Record the chosen entry and distinguish current asset caching from future local data.                                         |
| `docs/phase-2-offline-proposal.md`     | Update implementation status and selected integration.                                                                        |
| `docs/phase-2-handoff.md`              | Record this increment's changes, acceptance evidence and limits.                                                              |

Earlier offline-scope planning edits in the worktree are preserved; they are separate from the implementation file report above.
