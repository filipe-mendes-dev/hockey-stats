# Benchline Stats branding

The application uses the approved Glass Speedline symbol and a shared two-line wordmark, bold mint BENCHLINE above white STATS. Favicons and installed-app icons use the symbol without text.

## Design source

[Logo library in Figma](https://www.figma.com/design/wPgxfn4L9sKQryHjmujqQA?node-id=4-17) contains the approved Glass symbol. [BrandLogo](../src/client/components/BrandLogo/BrandLogo.tsx) owns the current system-sans wordmark and its compact/prominent layouts. The refined Figma wordmark is still pending because the MCP tool-call limit blocked edits.

## Identity and icons

- [symbol-glass.svg](../public/brand/symbol-glass.svg) is the cropped Glass symbol used by the shared logo and decorative watermarks.
- [icon.svg](../src/app/icon.svg) and [favicon.ico](../src/app/favicon.ico) are symbol-only favicons. The ICO includes 16px, 32px and 48px sizes.
- [icon-192.png](../public/icons/icon-192.png) and [icon-512.png](../public/icons/icon-512.png) are standard PWA icons.
- [icon-maskable-512.png](../public/icons/icon-maskable-512.png) keeps the mark inside the centered safe circle with a radius of 40% of the canvas size.
- [apple-touch-icon.png](../public/icons/apple-touch-icon.png) is the opaque 180px Apple icon.

The symbol geometry and Glass fills come from Figma Icon / Glass. Installed icons retain the dark application background. Exploration boards and review screenshots stay outside the repository.

## Navigation and offline assets

The header is 61px tall with 8px block padding and a 34px compact symbol. Desktop pills are visually 36px tall within 44px targets. Navigation is centered independently of the logo/account widths and collapses at 73.75em. The flag trigger retains full language names and the selected state in its dropdown. Mobile hamburger/drawer behavior stays unchanged; glyph offsets preserve centered 44px targets and drawer language/sign-out actions share one row.

The service worker precaches the shared SVG, installed-app icons and favicons with their asset revisions. Branding preserves the waiting-update policy and never forces a reload during recording.

## Footer

The implemented footer shows © 2026 Benchline Stats, Beta, the version from package.json and a mailto link to contact@filipemendes.dev. Clicking sync status opens the existing device/sync dialog with keyboard access and focus restoration. A separate Details button is no longer shown. Offline/pending/blocked/storage/update feedback remains visible. Healthy offline-file readiness is available inside the dialog. Phone layouts wrap without horizontal scrolling. The shared footer is hidden on sign-in while its worker hook stays mounted.

## Sign-in

Sign-in owns its compact logo/language row, one white Welcome heading, localized username/password placeholders and connection guidance in a hover/focus/touch information tooltip. From 48em it uses a 40/60 form/photo split; phones show only the form. Balanced outer tracks position the form independently of the top controls and the minimal version/contact row, with a small upward visual adjustment when height permits. A quiet decorative symbol watermark remains visible at all widths.

[rink-hockey.webp](../public/brand/rink-hockey.webp) is the approved generated photograph, compressed to WebP. It depicts a generic rink-hockey scene rather than a real match. The logo, text and mint overlays stay separate HTML/CSS elements. Photo text uses matching bottom/side insets. The photograph is outside precaching because sign-in remains online. Username/password validation and authentication behavior are unchanged. Beta-access requests remain deferred.

## Verification

See [Development plan](../docs/development-plan.md) for production-browser evidence and remaining release checks. Source checks and production compilation are repeated for each staged branding snapshot. No package, recording or authentication workflow changes are part of this branding work.
