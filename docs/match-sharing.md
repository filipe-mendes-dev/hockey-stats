# Completed-match sharing

## Agreed scope

An owner can create or revoke one public read-only link for a completed Match. The page at `/share/<token>` renders on the server and uses the same statistics content and interactions as the private summary, with the unauthenticated header and footer. It reads the current synchronized recording and current calculation rules; no published snapshot or stored aggregate is created.

The page includes Match details, player snapshot names/numbers/roles, team/player/goalkeeper statistics, period filters, event history, rink positions and lineup analysis. Owner controls, delivery indicators, account data, reusable identity references, undone events, capture/persistence timestamps and synchronization/debugging records are excluded from its serialized presentation data.

## Link lifecycle and access

Sharing management requires an enabled owner session and matching local account identity. Mutations validate the application origin. Link creation requires completed status and the expected server Match revision. Pending or blocked local Match operations prevent creation/copying. Revocation remains available online even when local work is pending.

Share creates or retrieves the existing link. Stop sharing removes its permission. Sharing again generates a fresh random token; previous URLs remain invalid. Tokens have no automatic expiry. They are credentials stored only in the server sharing table and returned only through authenticated owner management. Public lookup permits only the Match referenced by the token and never accepts a caller-selected owner or Match ID.

Match deletion cascades to its sharing record. Offline deletion takes effect publicly only after server synchronization. Account deletion removes its Matches and links. Disabling the owner temporarily makes its public pages unavailable; enabling restores unrevoked links.

## Rendering and failures

The public server page reads permission, Match snapshot and events consistently, derives an explicit presentation model and renders useful initial HTML. Interactive filtering and language switching hydrate that model without public API calls or IndexedDB access. SSR and initial hydration use English, preserving the existing locale preference behavior.

Unknown, malformed, revoked, deleted and ineligible links show the same unavailable response. Infrastructure failures show temporary failure separately. Responses do not permit shared caching; shared pages are outside offline precaching. Noindex and no-referrer directives apply. Do not log tokens or include their paths in proxy access logs.

Revocation prevents subsequent requests; it cannot retract an already rendered page, screenshot or saved copy. Anyone holding the link may forward it.

## Database setup

Apply migration `0016_match_sharing` with `npm run db:migrate` against the intended database before using sharing. It adds the `match_share` table and its cascading Match foreign key without changing existing Matches or events. Starting the application does not apply migrations automatically. Follow the explicit migration command in [Deployment](deployment.md) for the VPS.

If the table is missing, owner management returns the generic `unavailable` error and public lookup shows a temporary failure. Check migration status before investigating link or statistics behavior. Never include share tokens or database credentials in diagnostics.

## Separate work

Private JSON debugging export remains deferred. This scope adds no export endpoint, recording telemetry, event correction, statistics-rule change, IndexedDB migration, synchronization command or package.

## Acceptance

Verify matching owner/public statistics, useful initial HTML, unauthenticated/no-local-database access, filtering/map/lineup interactions, responsive English/Portuguese layouts, owner/revision/lifecycle enforcement, concurrent link creation, revocation and fresh links, deletion/disable behavior, safe serialized data and production cache/service-worker behavior. Use disposable records and preserve real recordings. Automated tests require explicit authorization.

Implementation and verification status belong in [Development plan](development-plan.md).
