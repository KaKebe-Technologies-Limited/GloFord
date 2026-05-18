# CLAUDE.md — Gloford Platform Standing Instructions

## Active Skills (auto-load every session)

### frontend-design
Apply production-grade UI engineering standards to every component touched:
- Replace ALL browser-native form controls (select, input[type=date/time/color/file],
  textarea, checkbox, radio) with fully styled, accessible custom components.
- No raw browser confirmation dialogs (window.confirm / window.alert / window.prompt).
  Every confirmation, toast, and info popup must use the project's design-system modal/toast.
- Every dropdown/popover/tooltip must use Radix UI primitives + Tailwind CSS 4 tokens.
- All interactive states (hover, focus-visible, active, disabled, loading) must be explicitly styled.

### theme-engine
The project uses Tailwind CSS 4 with CSS-variable tokens defined in the `Theme` database row.
At runtime, the admin-configured token values must be injected as CSS custom properties on `:root`
via a server component or middleware — never hardcoded. Every design token (color, radius, shadow,
font) must round-trip through: DB → ThemeService → CSS vars → Tailwind `@theme` block.

### security-ux
UX-layer security posture:
- Confirm destructive actions (delete, revoke, archive) with a typed-name or checkbox modal, not a naked button click.
- Server actions must never trust client-supplied `organizationId`; always resolve from session.
- Sensitive fields (API keys, tokens, passwords) must mask by default with an explicit show/hide toggle.
- Form submissions must debounce / disable-on-submit to prevent double-POST.
- Error messages surfaced to users must never leak stack traces, internal IDs, or SQL detail.

### ckeditor5
Every rich-text field in the admin must use CKEditor 5 (latest). The editor instance must be
configured with the full plugin suite. The editor output is HTML stored in the DB;
sanitise with DOMPurify on both save and render paths.

### testing
Every fix must be accompanied by or verified against the Vitest + Playwright test suite.
Run `pnpm test` after every phase. Run `pnpm test:e2e` (Playwright) after the final phase.
A fix is not done until its tests are green.
