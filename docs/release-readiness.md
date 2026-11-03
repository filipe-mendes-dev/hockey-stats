# Beta launch scope for 0.1.0

Updated 2026-11-03 after the user's launch decision. The app is already partly live according to the user. The immediate objective is focused polish and a clear project presentation for LinkedIn, the CV and portfolio.

Package and lockfile metadata are prepared as 0.1.0. Retain the existing Beta label and use GitHub's pre-release flag when publishing is authorized. The user has explicitly deferred tag and GitHub Release creation.

## Current focus

1. Review the implemented next-half confirmation. It suggests the opposite direction with manual override, preselects the carried-over lineup and records replacements as substitutions at the new half's start. The new half stays paused; original starters, historical coordinates, penalties and exclusions retain their meaning. The user agreed this behavior on 2026-11-02.
2. Review the implemented root redirect and Match-summary polish in the current app. The simplified shared layout uses a 96rem header cap, one 84rem content/footer cap and a 1.5rem minimum gutter. Page-specific caps and the separate summary cap are removed; stable scrollbar space prevents header movement between routes. The full-column rink and rounded scrollbars remain. The layout, spacing and sharing-copy changes are implemented; final product review remains. The user reports that marketing screenshots are ready and requested no further screenshot work. Shared form/recorder dialog structure, fluid sizing, footer/button spacing and desktop language-menu cleanup are also implemented for final review.
3. The project-facing README links the new [Changelog](../CHANGELOG.md), whose Unreleased section drafts the initial capabilities, known limitations and update guidance. Finalize release presentation using the user's prepared screenshots. Use [CI and publishing](ci-cd.md#first-beta-tag-and-github-release) for the branch, image and eventual tag procedure.

## Remaining release steps

- Complete final product review. Marketing screenshots are ready according to the user; no new screenshots are required for this increment.
- Record live-account acceptance of the signed-in root redirect and public share creation/view/revocation; these remain unverified by this local preparation.
- Review and commit the prepared 0.1.0 changes, squash the feature PR into staging and promote staging to master with a merge commit after required CI passes.
- Verify the exact published image, deployment and migration status. Add the verified master commit and immutable image digest to the release notes.
- Leave v0.1.0 tag and GitHub Release creation pending until the user requests them. Move the changelog's Unreleased entries into a dated 0.1.0 section only when the version ships.

Competition selection and later editing of competition, venue and date are optional proposals to discuss. They are not part of the current launch requirement.

## Deferred findings

The earlier proposed P0 work is deferred by the user and no longer blocks this beta announcement. These findings remain open; they have not been fixed or verified by changing their priority.

The [Backlog](backlog.md) is the ordered source of follow-up work. Backups and restore lead the deferred reliability work, followed by the historical Match-download repair verification, membership-pair collision, diagnostics, update/device/deployed-flow acceptance and dependency/toolchain follow-up. It also retains the remaining recorder, sync, hockey-rule, account and product proposals from "Organize app feedback by urgency" and the [Persistence review](persistence-review.md).

The user has chosen to proceed with the current beta limitations and revisit them with more time. This is a scope decision, not a new reliability or security certification. Earlier deployed-status notes and unverified scenarios must not be relabeled as passing.

## Evidence retained

The 2026-11-01 dependency increment aligned Next.js/eslint-config-next at 16.4.3 and patched Serwist's nested Zod. Clean installation, source lint, TypeScript, production build and targeted isolated offline checks passed. That day's lockfile audit reported no high/critical findings and 23 moderate package entries; see [Dependency advisories](security-advisories.md).

The README banner and eight badges loaded in a local desktop/phone preview with no page overflow. Documentation formatting and local links passed. Earlier product verification remains in [Verification history](verification-history.md).

The 2026-11-02 polish passed source lint, TypeScript, formatting, catalog parity and a production build. Isolated Chromium checks covered wide, laptop, short-window and phone layouts, enlarged Portuguese sharing copy, coarse-pointer sizing and a completed-summary offline reload. See [Current verification](development-plan.md#current-verification) for exact scenarios and limits.

The subsequent halftime increment passed the same non-test source checks and production compilation. Isolated browser acceptance verified carried-over lineups, field-player/goalkeeper replacements, manual direction overrides, unknown-direction selection, cancellation, unchanged lineups, reduced capacity/exclusions, local rollback on failure, narrow Portuguese layouts, offline save/reload and the resulting playing-time summary. Package metadata is 0.1.0 and the draft changelog is present. These checks used disposable browser records, not live-account delivery or production acceptance.

The refined halftime picker shares the ordinary direction preview and substitution buttons. Twenty draft replacements/reversals saved nothing; twenty-two choices with two final roster changes saved exactly two substitutions. A restored final roster saved none. The updated dialog retained offline save/reload, eligibility rules and narrow Portuguese layouts. See the current verification record for the scope and limits.

This work did not repair real data, configure backups, deploy, create a tag or publish a release. Authenticated root behavior and public sharing still require live-account acceptance.
