# Dependency advisories

Reviewed on 2026-10-23 after the Next.js patch using `npm audit --package-lock-only --json`, the locked dependency graph, application configuration and the AMD64 production image. This is a dependency assessment, not a full application or container/OS security audit.

## Release decision

Next.js 16.4.2 resolves the framework findings. The audit reports nine affected package entries: five high, four moderate and zero critical. These entries include affected parent packages, rather than nine distinct exploits. No unrelated dependency versions or major upgrades were changed.

The remaining findings concern ESLint pattern parsing and an old esbuild development server in migration tooling. No production request path to those features was identified. They do not block the pilot on the evidence below. The image retains development tools for migration/account commands, so an audit that omits development dependencies would not describe everything installed.

## Resolved Next.js findings

The prior critical package entry combined three advisories. Each identifies 16.4.1 or later as patched; the installed 16.4.2 resolves that entry.

| Advisory                                                                                            | Previous exposure and resolution                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Image Optimization RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) | The glibc image already had the documented `sharp >=0.35.5` workaround. The framework is now patched as well. |
| [Server Action DoS](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)      | No Server Actions were found in source or the generated action manifest. Framework patch applied.             |
| [Cache typed-array RCE](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr)  | No Cache Components/use-cache functions were found. The recommended framework patch is now applied.           |

The patched production build and runtime checks are recorded in [Local verification](deployment.md#local-verification).

## High severity: ESLint glob dependencies

The five entries are `eslint-config-next`, `@next/eslint-plugin-next`, `fast-glob`, `micromatch` and `braces`. [The braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) concerns deeply nested patterns exhausting the process stack; no patched braces version is listed.

`eslint-config-next` remains at 16.4.0. The lock resolves `braces` 3.0.3 through the ESLint plugin's `fast-glob` dependency. No application request handler accepts glob patterns, and the production command runs Next.js rather than ESLint. The tools remain installed but no request-time path to this parser was identified.

Keep lint/build inputs trusted. Reassess when upstream removes or patches the affected chain. npm's proposed `eslint-config-next` 14.2.35 remediation is a cross-major downgrade, not an appropriate automatic fix for this Next.js 16 app.

## Moderate severity: migration loader esbuild

The four entries are `drizzle-kit`, `@esbuild-kit/esm-loader`, `@esbuild-kit/core-utils` and its nested `esbuild` 0.18.20. [The esbuild advisory](https://github.com/advisories/GHSA-67mh-4wv8-2f99) concerns cross-origin reads from its development server; esbuild 0.25.0 fixes it.

`db:migrate` runs the explicit Drizzle migration command. The nested loader uses esbuild for transformation, while the app starts `next start`. No esbuild development server or Drizzle Studio service is started or published. The separate top-level esbuild is already 0.28.2.

Do not expose development/Studio servers. Prefer a compatible future Drizzle release that removes the old loader; an override needs its own compatibility check. npm suggests downgrading Drizzle Kit to 0.18.1, which would change the established migration tooling and is not applied.
