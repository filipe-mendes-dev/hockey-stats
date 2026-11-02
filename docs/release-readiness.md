# Beta launch scope for 0.1.0

Updated 2026-11-02 after the user's launch decision. The app is already partly live according to the user. The immediate objective is focused polish and a clear project presentation for LinkedIn, the CV and portfolio.

Version 0.1.0 retains the existing Beta label and GitHub's pre-release flag. Package metadata remains unchanged until its separate release increment.

## Current focus

1. Review focused recorder improvements: automatic attack-direction switching at halftime with manual override, and confirmation/selection of each new half's starting lineup. Agree their exact behavior before implementation.
2. Review the implemented root redirect and Match-summary polish in the current app, then capture marketing screenshots. The simplified shared layout uses a 96rem header cap, one 84rem content/footer cap and a 1.5rem minimum gutter. Page-specific caps and the separate summary cap are removed; stable scrollbar space prevents header movement between routes. The full-column rink and rounded scrollbars remain. The layout, spacing and sharing-copy changes are implemented; final product review and marketing screenshots remain.
3. Keep the README project-facing, capture current marketing screenshots and finalize version/release presentation. Use [CI and publishing](ci-cd.md#first-beta-tag-and-github-release) for the existing branch, image and tag procedure.

Competition selection and later editing of competition, venue and date are optional proposals to discuss. They are not part of the current launch requirement.

## Deferred findings

The earlier proposed P0 work is deferred by the user and no longer blocks this beta announcement. These findings remain open; they have not been fixed or verified by changing their priority.

The [Backlog](backlog.md) is the ordered source of follow-up work. Backups and restore lead the deferred reliability work, followed by the historical Match-download repair verification, membership-pair collision, diagnostics, update/device/deployed-flow acceptance and dependency/toolchain follow-up. It also retains the remaining recorder, sync, hockey-rule, account and product proposals from "Organize app feedback by urgency" and the [Persistence review](persistence-review.md).

The user has chosen to proceed with the current beta limitations and revisit them with more time. This is a scope decision, not a new reliability or security certification. Earlier deployed-status notes and unverified scenarios must not be relabeled as passing.

## Evidence retained

The 2026-11-01 dependency increment aligned Next.js/eslint-config-next at 16.4.3 and patched Serwist's nested Zod. Clean installation, source lint, TypeScript, production build and targeted isolated offline checks passed. That day's lockfile audit reported no high/critical findings and 23 moderate package entries; see [Dependency advisories](security-advisories.md).

The README banner and eight badges loaded in a local desktop/phone preview with no page overflow. Documentation formatting and local links passed. Earlier product verification remains in [Verification history](verification-history.md).

The 2026-11-02 polish passed source lint, TypeScript, formatting, catalog parity and a production build. Isolated Chromium checks covered wide, laptop, short-window and phone layouts, enlarged Portuguese sharing copy, coarse-pointer sizing and a completed-summary offline reload. See [Current verification](development-plan.md#current-verification) for exact scenarios and limits.

This work did not repair real data, configure backups, deploy, create a tag or publish a release. Authenticated root behavior and public sharing still require live-account acceptance.
