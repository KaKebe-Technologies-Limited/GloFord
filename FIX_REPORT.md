# Fix Report — Gloford Platform Audit & Repair

Date: 2026-05-18

## 1. Theme Engine

**Status:** Already functional — verified, no changes needed.

The theme engine was fully operational before this audit:
- `lib/theme/service.ts` — `getActiveThemeTokens()` reads the singleton `Theme` row, merges DB values over defaults
- `app/layout.tsx` — injects `--token-*` CSS custom properties via `<style>` tag on every request
- `app/globals.css` — `:root` block maps `--token-*` to `--color-*` semantic variables; `@theme` block registers radius/font tokens with Tailwind v4
- Components use `var(--color-primary)`, `var(--radius-md)` etc. — never hardcoded values
- `lib/services/theme/index.ts` — `updateTheme` service calls `revalidateTag('theme')` after write
- Existing tests: `theme-tokens.test.ts` (5), `theme-service.test.ts` (7), `theme-validators.test.ts` (13), `theme-update.test.ts` (6)

## 2. Browser-Native UI Replacements

### 2a. Confirmation Dialogs (17 replacements)
| Before | After | Files |
|---|---|---|
| `window.confirm()` | `useConfirmAction()` hook (Radix AlertDialog) | 15 files |

All 17 `confirm()` calls replaced with the imperative `useConfirmAction` hook. Destructive actions use `variant: "danger"`, send/restore use `variant: "primary"`.

### 2b. Alert Dialogs (2 replacements)
| Before | After | Files |
|---|---|---|
| `alert()` | Inline error state with `useState` | SegmentRow.tsx, ToggleProviderButton.tsx |

### 2c. Select / Dropdown (~25 replacements)
| Before | After | Files |
|---|---|---|
| Raw `<select>` + `<option>` | `<Select>` + `<SelectTrigger>` + `<SelectContent>` + `<SelectItem>` (Radix UI) | 11 admin + 3 public files |

**Kept as native:** 3 server component filter forms (audit, versions, dead-letter) — these are inside `<form>` elements with URL-based actions in server components where Radix can't run.

### 2d. Date Picker (1 replacement)
| Before | After | File |
|---|---|---|
| `<Input type="date">` | `<DatePicker>` (react-day-picker + Radix Popover) | CareersClient.tsx |

**Kept as native:** 2 date inputs in audit page server form (styled `<input type="date">` with theme classes).

### 2e. New Components Created
| Component | Location | Built on |
|---|---|---|
| `Select` | `components/ui/Select.tsx` | `@radix-ui/react-select` |
| `DatePicker` | `components/ui/DatePicker.tsx` | `react-day-picker` + `@radix-ui/react-popover` |
| `Toast` / `Toaster` / `useToast` | `components/ui/Toast.tsx` | `@radix-ui/react-toast` |
| `useConfirmAction` / `ConfirmActionProvider` | `components/ui/useConfirmAction.tsx` | `@radix-ui/react-alert-dialog` |
| `MaskedField` | `components/ui/MaskedField.tsx` | Native (eye toggle, copy-to-clipboard) |
| `RichTextDisplay` | `components/ui/RichTextDisplay.tsx` | `dompurify` |

### 2f. Dependencies Installed
- `react-day-picker` — calendar UI for DatePicker
- `date-fns` — date formatting/parsing
- `dompurify` + `@types/dompurify` — HTML sanitization for RichTextDisplay

## 3. CKEditor 5

**Status:** Already integrated, enhanced with missing plugins.

Existing `components/ui/RichTextEditor.tsx` had 30+ plugins. Added 9 missing plugins from the spec:

| Plugin | Purpose |
|---|---|
| `SourceEditing` | View/edit raw HTML source |
| `WordCount` | Word/character count |
| `PageBreak` | Insert page breaks |
| `TodoList` | Checkbox/todo list items |
| `HtmlEmbed` | Embed raw HTML blocks |
| `Autoformat` | Markdown-like auto-formatting |
| `ListProperties` | List start number, type, reversed |
| `TableColumnResize` | Drag-to-resize table columns |
| `LinkImage` | Link images directly |

All plugins added to both the import list and plugin array. `sourceEditing`, `todoList`, `pageBreak`, `htmlEmbed` added to toolbar.

CKEditor version: `ckeditor5@48.0.1` + `@ckeditor/ckeditor5-react@11.1.2`

## 4. Security Audit

Full findings documented in `SECURITY_AUDIT.md`. Summary:

| Category | Finding | Status |
|---|---|---|
| **organizationId trust** | No server action accepts client-supplied orgId | PASS |
| **Sensitive field masking** | Payment secrets rendered as `type="password"` | PASS |
| **Double-submit prevention** | All forms use `useTransition` + `disabled={pending}` | PASS |
| **Error message leakage** | Typed `AppError` system with `safeMessage`; `toSafeError()` wrapper | PASS |
| **Destructive action confirmation** | 19 confirm/alert calls replaced with modal dialogs | FIXED |
| **CSRF / revalidation** | All mutations call `revalidateTag`/`revalidatePath`; Next.js CSRF built-in | PASS |

## 5. Test Coverage

### Unit tests added (3 files, 9 tests)
| File | Tests | What |
|---|---|---|
| `tests/unit/rich-text-display.test.ts` | 3 | DOMPurify config validation, XSS tag exclusion |
| `tests/unit/masked-field.test.ts` | 3 | Masking logic, short values, length limits |
| `tests/unit/confirm-action.test.ts` | 3 | Typed confirmation gating logic |

### Final test summary
- **24 test files** (was 21)
- **284 tests** (was 275, +9 new)
- **All passing**

### Package scripts added
- `test:all` — runs Vitest + Playwright sequentially
- `audit:ui` — greps for remaining browser-native patterns

## 6. Remaining Work

### Cannot be automated (manual steps)
- **DNS / env vars** — production deployment requires manual DNS + env configuration per the Client Setup section in README.md
- **E2E tests** — Playwright tests require a running dev server + database; the existing smoke test covers basic navigation. Full interactive E2E tests (theme round-trip, file upload, etc.) require a seeded test database.
- **Production build** — `pnpm build` should be run in CI to verify SSR compatibility; it requires `DATABASE_URL` and other env vars.

### Known lint warnings (pre-existing, not introduced)
- `ThemeEditor.tsx:105` — unused `clearTokensFromDOM`
- `newsletter-send.ts:73` — unused `startIdx`
- `admin.ts:8` — unused `label`

### Server component selects kept as native
3 filter forms in server pages (audit, versions, dead-letter) use native `<select>` because they're inside server-rendered `<form>` elements with URL query params. These are styled with theme CSS classes and function correctly.
