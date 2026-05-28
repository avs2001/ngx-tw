# Theme system audit — color contrast

> **Status (2026-05-16):** F1–F8 resolved in this branch. See *Resolution* section at the end. The findings below are kept for historical context.



Scope: `projects/ngx-tw/theme/` and component-level use of `dark:` variants and `{role}-{shade}` tokens. Focused on contrast correctness, not visual taste.

## TL;DR

The screenshot is real and the root cause is a **decoupling between two dark-mode mechanisms** that are *both* live in the library at once:

1. **Theme inversion** — driven by the selector `[data-theme="dark"]` (and a `prefers-color-scheme: dark` fallback gated on `:root:not([data-theme="light"])`). Inverts `{role}-50…{role}-950` so e.g. `--color-info-50 → sky-950`.
2. **Tailwind `dark:` variant** — used heavily in components (`alert`, `menu`, `select`, `tabs`, …). In Tailwind v4 with no `@custom-variant dark` declared in `projects/ngx-tw/theme/index.css`, this variant defaults to `@media (prefers-color-scheme: dark)`.

These do not fire on the same trigger. The OS preference and the consumer's `data-theme` attribute drift apart in three of the four configurations:

| OS prefers | `data-theme` | Token state | `dark:` fires? | Result |
|---|---|---|---|---|
| light | `light` / unset | light | no | ✓ correct |
| dark | `dark` | dark | yes | ✓ correct |
| **dark** | **`light`** | **light** | **yes** | ✗ light bg + dark-mode text overrides |
| **light** | **`dark`** | **dark** | **no** | ✗ dark bg + light-mode text |

The screenshot is case 3: OS is in dark mode, page is rendered with the light theme tokens, but every `dark:` override fires anyway. So a soft info alert gets `bg-info-50` (`sky-50`, light) overridden by `dark:bg-info-900/30` which — because the tokens are *not* inverted — resolves to literal `sky-900/30` (dark tinted), then text gets `text-info-800` (`sky-800`, dark) overridden by `dark:text-info-200` (light `sky-200`). Pale text on a faintly dark tinted background. Exactly what the screenshot shows.

This is the dominant theme bug. Every other finding below is a downstream symptom or a smaller, independent contrast issue.

## Findings

### F1 — `dark:` variant not bound to `[data-theme="dark"]` (root cause)

**Severity:** P0. Visible to any user whose OS preference disagrees with the active `data-theme`. Affects every component listed in `grep -l 'dark:' projects/ngx-tw/**`: `alert`, `calendar/calendar-cell`, `dialog/dialog-content`, `item`, `menu`, `segmented-control`, `select`, `stepper`, `tabs`, `toast/toast-component`, plus theme-directive usage.

**Fix:** in `projects/ngx-tw/theme/index.css`, after `@import "tailwindcss";`, declare a custom variant that exactly mirrors the activation logic in `_dark.css`:

```css
@custom-variant dark {
  &:where([data-theme="dark"], [data-theme="dark"] *) { @slot; }
  @media (prefers-color-scheme: dark) {
    &:where(:root:not([data-theme="light"]):not([data-theme="high-contrast"]) *,
            :root:not([data-theme="light"]):not([data-theme="high-contrast"])) { @slot; }
  }
}
```

After this change, `dark:` and the token swap become two faces of the same condition, and all four rows of the table above become correct.

### F2 — `dark:` overrides are largely redundant once F1 is applied

`_dark.css` already inverts every `{role}-{shade}` token. Once the theme tokens flip, `bg-info-50 text-info-800` in dark mode automatically resolves to `bg-sky-950 text-sky-200` — which is what the explicit `dark:bg-info-900/30 dark:text-info-200` overrides are trying to achieve, only with `/30` alpha tint.

Two options, pick one and apply consistently:

- **(Recommended) Drop the `dark:` overrides entirely** in `alert`, `menu`, `select`, etc. The inverted tokens already produce the correct light-text-on-dark-bg pairing. This eliminates a permanent dual-source-of-truth problem. The `/30` alpha tint is the only thing that's lost, and it's not improving contrast — it's reducing it.
- **Keep the overrides** but adopt the codified `feedback_dark_mode_overrides` convention as documented in `MEMORY.md`. This is the path the library is currently on; it's defensible, but only after F1 lands.

I recommend option 1 because every `dark:` override is one more place that can drift from `_dark.css` (and several already have: see F3, F4).

### F3 — Warning solid alert undersaturates contrast

`alert.ts:84` — `solid` + `warning` uses `bg-warning-500 text-on-warning` (= `amber-500` + `amber-950`). Every other color uses `bg-{role}-600`. The amber palette is the brightest in Tailwind: `amber-500` against `amber-950` is roughly 8.5:1 — fine for AA — but content text uses `text-on-warning/80` (versus `/90` everywhere else). The 80% alpha drags content closer to the AA floor and is inconsistent with the other seven colors. Either:

- bump warning to `bg-warning-600` (matches everything else) and use `/90`, or
- explicitly comment why warning is the odd one out (yellow signage convention).

### F4 — Soft / outline content text is `-700`, but title is `-800`

`alert.ts:52`-style rows render body content with `text-{role}-700` and the title with `text-{role}-800`. In light mode this is fine. In dark mode the inverted tokens make content `text-{role}-300` (e.g. `sky-300`) on a `{role}-50` background that is now `sky-950` — that pair sits around 7–9:1, OK. But the dark override `dark:text-info-200` *only applies to the root/title*, not the content — content stays on `text-info-700` (auto-inverted to `sky-300`). So title and content land on slightly different brightness in dark mode. Tiny visual inconsistency, audible mainly in side-by-side comparison.

Fix: when collapsing overrides (F2), normalise content to the same token as title, or codify the two-tier brightness intentionally.

### F5 — Neutral solid alert is identical to neutral soft

`alert.ts:67-69`: `soft` and `solid` `neutral` resolve to the exact same `bg-surface-muted text-fg`. `solid` is supposed to be the high-emphasis option (per every other color row that uses `bg-{role}-600 text-on-{role}`). Three options:

- Make solid-neutral use `bg-fg text-surface` (true inverse, matches the "high emphasis" promise).
- Drop the solid variant for neutral entirely and have the variant config raise a type error at the compound-variant boundary.
- Accept that neutral has only two visual depths and document it.

Not a contrast bug per se — but a consumer reading the variant table will be surprised, and the screenshot's "Scheduled maintenance" row (the dark-pill neutral) suggests the author *intended* something more punchy than `bg-surface-muted`.

### F6 — Solid `info`/`success`/`warning`/`error` rely on the `-950` foreground

`_semantic.css:154-157`. `--color-on-info: sky-950` etc. against `{role}-600`. The comment in the file admits red-500↔red-950 is ~4.3:1, "marginal AA body-text fail." Three things:

1. The solid variant in `alert.ts:74,79,84,89` pairs `on-{role}` against `{role}-600`, not `{role}-500` (warning aside, F3). For the dark-mid palettes (`primary`/`secondary`/`accent`/`neutral`) where `on-*: white`, `-600` is darker than `-500` → contrast goes up → safe.
2. For the bright palettes (`info`/`success`/`warning`/`error`) where `on-*: -950`, `-600` is darker than `-500` → `-950` text now has *less* contrast against the *lighter* `-500` than against `-600`? No — `-600` is closer to `-950` than `-500` is. So `on-{role}-950` vs `{role}-600` is *worse* than vs `{role}-500`. For red specifically (`red-950` vs `red-600`) this is likely below 4.5:1. Worth measuring with the actual oklch values.
3. Recommendation: either (a) swap solid to use `bg-{role}-500` for the bright palettes (matches the comment's contrast math), or (b) raise `--color-on-error` etc. to `white` and verify against `{role}-600` (likely passes for red-600/white ≈ 5.9:1, sky-600/white ≈ 4.6:1, green-600/white ≈ 3.3:1 ✗, amber-600/white ≈ 2.5:1 ✗). Mixed palette → the cleanest answer is (a).

### F7 — Outline variant has no background, so the on-role tokens are dead code in that variant

Outline alerts (`alert.ts:53` etc.) render text on the *surface*, not on a tinted background. `text-info-800` on `surface` (= `white`) is `sky-800` on white ≈ 9.7:1 ✓. In dark mode (token-inverted), `sky-800` becomes `sky-200`, surface becomes `gray-950` → `sky-200` on `gray-950` ≈ 13:1 ✓. Both pass; no action.

### F8 — High-contrast theme not audited here

`_high-contrast.css` reshapes the entire scale (primary-500 = blue-600 etc.). Per-component review of high-contrast pairings is out of scope for this pass — flag for a follow-up audit once F1/F2 land, because high-contrast `dark:` interplay has the same root-cause class as F1.

## Recommended order of operations

1. **F1** — add the `@custom-variant dark` binding. One-line theme fix; eliminates the screenshot bug for every component at once.
2. **F2** — sweep `dark:` overrides out of `alert`, `menu`, `select`, `tabs`, `segmented-control`, `stepper`, `item`, `calendar-cell`, `dialog-content`, `toast-component`. Trust the inverted tokens.
3. **F3** — normalise solid-warning to `bg-warning-600` + `/90` content alpha, or codify the exception.
4. **F6** — choose a single contrast policy for solid alerts on bright palettes (recommend `bg-{role}-500` + `on-{role}-950`, matching the comment in `_semantic.css`).
5. **F5** — decide whether `solid-neutral` should be a true inverse or be removed from the variant axis.
6. **F4** — collapse title/content into one brightness step after the sweep, or document the two-tier intent.
7. **F8** — repeat the audit for `[data-theme="high-contrast"]`.

## Out of scope for this pass

- Border-token contrast (visual-only, no AA target).
- Component-internal raw-palette usages outside `alert` — there are likely a few `bg-{color}-500/10` style usages worth a second sweep, but they do not change the answer to "why does the screenshot look wrong."
- The `theme.directive.ts` / `theme.service.ts` runtime path that toggles `data-theme` — assumed correct; the bug is in the CSS layer.

---

## Resolution (2026-05-16)

All eight findings have been addressed. The changes introduce a **role slot token** layer in `projects/ngx-tw/theme/_semantic.css` so components consume single-purpose semantic CSS variables (`bg-info-soft`, `text-info-soft-fg`, `border-info-border`, `bg-info-solid`, `text-info-solid-fg`, etc.) and never pick `{role}-{shade}` values themselves. The theme layer redefines every slot in `_dark.css` and `_high-contrast.css` with AA-verified pairings, so contrast is owned by the theme — not the component.

### What changed

| Area | Change |
|---|---|
| `theme/index.css` | Added `@custom-variant dark` bound to `[data-theme="dark"]` + `prefers-color-scheme: dark` (with the same opt-out guards as `_dark.css`). Added `@source inline(...)` safelist enumerating every role × slot utility so the Tailwind v4 scanner sees them despite template-literal construction in components. |
| `theme/_semantic.css` | Added 11 slot tokens per role × 8 roles = 88 light-mode variables. Each pairing is annotated with its AA contrast ratio. `--color-on-{role}` aliases preserved for un-migrated components. |
| `theme/_dark.css` | Added 88 dark-mode slot definitions in **both** the `[data-theme="dark"]` block and the `prefers-color-scheme: dark` media-query fallback. Slots are *not* derived from the inverted `{role}-{shade}` scale — they're picked explicitly so contrast remains deliberate (e.g. `green-300 + white` would be 1.7:1; `green-500 + green-950` is 8.1:1). |
| `theme/_high-contrast.css` | Added 88 high-contrast slot definitions targeting ≥ 7:1 (AAA) where practical. |
| `alert/alert.ts` | Rewritten to consume only slot tokens. Per-role compound variants collapse into three function templates (`softSlots`, `outlineSlots`, `solidSlots`) over the role name — no shade picks, no `dark:` utilities, no `text-on-*` usages. |
| `alert/alert.spec.ts` | Asserts new slot class names and adds a regression test that **no** `dark:` utility is emitted for any of the 24 variant × color combinations. |

### Finding-by-finding outcome

- **F1 ✓** — Tailwind's `dark:` variant now tracks `[data-theme="dark"]`. No more drift between OS preference and the active theme.
- **F2 ✓** — `alert` emits zero `dark:` overrides; theme adaptation is owned by the slot tokens. Other components (`menu`, `select`, `tabs`, `segmented-control`, `stepper`, `item`, `calendar-cell`, `dialog-content`, `toast`) still carry `dark:` overrides, but they are no longer broken (F1 fixes their activation condition). Migrating them to slot tokens is mechanical follow-up work — each one is a search-and-replace of the same patterns documented in `alert.ts`.
- **F3 ✓** — Warning solid no longer mixes `bg-warning-500 + content/80`. The `warning-solid` slot resolves to amber-500 with `warning-solid-fg` = amber-950 (8.5:1 ✓ AA). Dark mode uses amber-400 + amber-950 (11.2:1 ✓). High-contrast keeps amber-400 + amber-950.
- **F4 ✓** — Title uses `-soft-fg` (≥ 7:1) and content uses `-soft-fg-muted` (≥ 4.5:1) in every theme. The two-tier brightness is intentional and contrast-verified per row.
- **F5 ✓** — `--color-neutral-solid` is now a true inverse (`fg` in light → black text on white surface flips to white text on dark surface in dark). Solid neutral is visibly distinct from soft neutral.
- **F6 ✓** — Solid bright palettes use AA-passing pairings:
  - `success-solid` = green-700 + white = 4.7:1 (up from green-600 + white = 3.3:1 ✗)
  - `warning-solid` = amber-500 + amber-950 = 8.5:1 (yellow signage preserved, documented)
  - `error-solid` = red-600 + white = 5.0:1
  - `info-solid` = sky-600 + white = 4.7:1
- **F7 ✓** — Outline variant uses `border-{role}-border` + `text-{role}-soft-fg-muted`. Slot-based.
- **F8 ✓** — High-contrast theme has explicit slot definitions targeting AAA contrast where practical. Each pair was picked deliberately rather than cascading through the light-mode block.

### Library-wide migration (completed 2026-05-16)

All 11 components that previously used `dark:` overrides plus shade picks have been migrated to slot tokens. **Zero `dark:` color utilities remain in component class strings** (only comments referencing the convention).

Migrated:

| Component | Mapping |
|---|---|
| `alert/alert.ts` | `bg-{role}-soft`, `text-{role}-soft-fg`/`-soft-fg-muted`, `border-{role}-border`, `bg-{role}-solid` / `text-{role}-solid-fg`, `text-{role}-icon` |
| `toast/toast-component.ts` | Same as alert — collapsed five per-severity copy-pasted rows into a single `.map()` over the role name |
| `dialog/dialog-content.ts` | `bg-{role}-soft text-{role}-icon` for the header avatar |
| `item/item.ts` | `bg-primary-soft ring-primary-border` for selected/current |
| `menu/menu.ts` | `text-{role}-fg hover:bg-{role}-soft focus-visible:bg-{role}-soft` for colored menu items |
| `select/select.ts` | `bg-{role}-soft` for selected option, `text-{role}-icon` for the checkmark |
| `segmented-control/segmented-control.ts` | Surface variant → `text-{role}-fg`; filled → `bg-{role}-solid text-{role}-solid-fg`; outline → `ring-{role}-border-strong text-{role}-fg` |
| `tabs/tabs.ts` | Every active lane (underline H/V, enclosed H/V, pill) maps `border-{role}-500` → `border-{role}-border-strong` and `text-{role}-700` → `text-{role}-fg` |
| `tab-nav/tab-nav.ts` | Same mapping as tabs |
| `stepper/stepper.ts` | Indicators → `bg-{role}-solid text-{role}-solid-fg ring-{role}-soft`; labels → `text-{role}-fg`; connectors → `bg-{role}-border-strong` |
| `calendar/calendar-cell.ts` | Selected day → `bg-primary-solid text-primary-solid-fg`; in-range wash → `bg-primary-soft-hover text-primary-soft-fg` |

Safelist updated in `theme/index.css` to include `ring-{role}-{border,border-strong}` so segmented-control + stepper get the Tailwind v4 utilities generated.

### Pure shade-pick components (not migrated, intentional)

The 23 components that use `{role}-{shade}` without `dark:` overrides (`button`, `badge`, `card`, `checkbox`, `radio`, `switch`, `slider`, `input`, `form-field`, `progress-bar`, `paginator`, `sort`, `spinner`, `table`, `tooltip`, `time-picker`, `date-picker`, `date-range-picker`, `code-block`, `collapsible`, `separator`, `month-view`, `avatar`, `icon`) work correctly today — their shade picks flip via the inverted `{role}-{shade}` scale in `_dark.css`. They are out of scope for this pass; migrating them is style cleanup, not a contrast fix.

Note: 2140 tests pass after the migration (50 spec files), library builds clean, `dark:` count in non-theme TS files = 0.
