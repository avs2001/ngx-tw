# Icon — Production-Grade Review

**Entry point:** `ngx-tw/icon`
**Files:** `projects/ngx-tw/icon/`

## Snapshot
- Selectors: `tw-icon` (element)
- Public classes/directives: `IconComponent`, `IconRegistry` (service), `provideTwIcons()` (provider factory), `TW_ICON_REGISTRAR` (InjectionToken)
- Inputs: 7 (`name`, `img`, `color`, `size`, `strokeWidth`, `absoluteStrokeWidth`, `ariaLabel`, `viewBox`) — actually 8 if counting `viewBox`
- Outputs: 0
- Slots: 0 (template is empty; SVG is imperatively rendered via `Renderer2`)
- CVA: no
- `tv()` config: yes; no slots (single-element host with utility classes)
- A11y CDK utilities used: none directly — relies on dev-mode validation + ARIA on SVG

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `name` | `string \| undefined` | `undefined` | yes | Registry lookup (kebab → PascalCase) |
| `img` | `TwIconData \| undefined` | `undefined` | yes | Direct icon data; takes precedence over `name` |
| `color` | `TwIconColor` (`TwColor \| 'current'`) | `'current'` | yes | |
| `size` | `TwSize` (shared) | `'md'` | yes | |
| `strokeWidth` | `number` | `2` | yes | |
| `absoluteStrokeWidth` | `boolean` | `false` | yes | |
| `ariaLabel` | `string \| undefined` | `undefined` | yes | |
| `viewBox` | `string` | `'0 0 24 24'` | yes | |

### Findings
- Input count is 8 — exceeds the codified cap of 5–6 by 2. Icon is a primitive ("visual primitive") and CLAUDE.md states "Visual primitives (avatar, icon) and decorative primitives (progress-bar) do NOT qualify [for the input-cap exception] — reshape with config objects instead." This is a flagged violation.
  - Reasonable reshape: group SVG-author config (`strokeWidth`, `absoluteStrokeWidth`, `viewBox`) into a single `svg` input that accepts a config object. Keep `name`, `img`, `color`, `size`, `ariaLabel` as top-level inputs (5 total). Backward compat would require a deprecation cycle.
- All inputs have one-line JSDoc with default — compliant.
- Boolean `absoluteStrokeWidth` defaults to `false` — compliant.
- Uses shared `TwSize` from `core`. Defines its own `TwIconColor = TwColor | 'current'` — a justified extension of `TwColor` since `'current'` is icon-specific.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|

### Findings
- No outputs — appropriate.

## Customization surface
- ng-content slots: none. Template is `template: ''`. SVG is built imperatively via `Renderer2` (lines 207–234) and appended to the host.
- Structural directives: none.
- Fallback content: none (no template).
- Class merging: yes — `twMerge: true` (line 64).
- Findings:
  - The imperative SVG construction approach is unusual but reasonable for the use case — icon data is a serialised tuple list, and Angular's template system would require a `*ngFor` over arbitrary `(tag, attrs)` pairs, which can't be done declaratively without nested components.
  - One downside: consumers cannot project custom children into the SVG (e.g., `<title>` for hover tooltips). If they need that, they'd compose their own `<svg>` element. Acceptable.
  - `ViewEncapsulation.None` is set (line 88) — this is needed so the SVG inherits `currentColor` and the host class applies cleanly; document the choice.

## CSS / Styling
- tailwind-variants: yes, no slots.
- twMerge: yes (line 64).
- Semantic tokens vs raw palette: compliant. Lines 42–51 use `text-{role}-500` for color variants, `text-fg-muted` for neutral.
- Surface/fg/border tokens: neutral uses `text-fg-muted` correctly.
- Radius compliance: not applicable.
- Spacing compliance: not applicable.
- Typography compliance: not applicable.
- Focus rings compliance: not applicable (icons are non-interactive). If an icon ever becomes the focus target (e.g., inside a button), the parent owns focus styling.
- Dark mode handling: relies on `currentColor` + theme tokens. `text-{role}-500` inherits the consumer's dark-mode token mapping. Compliant.
- Transitions: none — appropriate.
- Shadows: none — appropriate.
- Icon sub-scale: `size-3` (xs), `size-4` (sm), `size-5` (md), `size-6` (lg), `size-8` (xl) — see line 52–58. The codified glyph scale is `size-4`/`size-5`/`size-10`. The component's scale is `size-3`/`size-4`/`size-5`/`size-6`/`size-8`. xs is below the documented glyph scale (12px); md aligns; xl (32px) is above standard glyph but below the standalone `size-10` (40px). FLAG: align with documented glyph sub-scale, OR add a per-component exception note explaining why icon offers a wider range (it parameterises sub-scale rather than picking one).
- Findings:
  - The `size-{N}` mapping does not match the codified glyph icon scale exactly. CLAUDE.md says glyph scale is `size-4/size-5/size-10`. The icon component is the source for "what is a glyph icon", and its xs/sm/md/lg/xl scale exists because the icon parametises across all sub-scales — but the values `size-3` and `size-8` do not appear in the documented scale. Either (a) update the documented icon-sub-scale section to include `size-3`/`size-6`/`size-8` for component-level scaling, or (b) collapse the icon size axis to just three options matching `size-4/size-5/size-10`.

## Accessibility
- ARIA roles/attributes: dynamic on the SVG (not host). `aria-hidden="true"` when no `ariaLabel` (line 222); else `role="img"` + `aria-label` (lines 218–220).
- Keyboard support: not focusable — correct for a decorative icon.
- CDK a11y utilities: none required.
- Labels/descriptions wiring: `ariaLabel` input drives the SVG's `aria-label`. Compliant.
- AXE risks:
  - Decorative icons (default) get `aria-hidden="true"` on the SVG — correct.
  - Labelled icons get `role="img"` + `aria-label` — correct.
  - One concern: the host `<tw-icon>` element has no ARIA. If a consumer's parent stops at `<tw-icon ariaLabel="x">`, the host is visible to AT but transparent (passes through to the inner SVG). Acceptable but worth a JSDoc clarification.
- Findings:
  - Dev-mode warning fires `console.warn` for missing icons (lines 172–176) — excellent DX, no a11y impact in prod.
  - Icon caching (lines 188–197) avoids DOM rebuild when only color/size change — good for performance.

## Form integration (if applicable)
- CVA: not applicable.

## Tests
- Spec file: yes (`icon.spec.ts`, 330 lines).
- Coverage breakdown:
  - rendering: no inputs → no SVG, name → SVG, img → SVG, img precedence over name.
  - color variants: all 9 (8 + `'current'`).
  - size variants: all 5 with pixel assertion.
  - stroke width: explicit, absolute scaling formula, no scaling when false.
  - viewBox: default + custom.
  - a11y: aria-hidden default, aria-label + role="img" when labelled.
  - dev-mode warnings: spy on `console.warn` for missing + registered.
  - SVG caching: color, size, strokeWidth, viewBox, icon-data, removal — comprehensive.
  - SVG attributes: standard attrs + child element rendering.
- Vitest-specific issues: none — uses `vi.spyOn`, `setInput`.
- Findings: spec is one of the best in the library. Comprehensive coverage.

## Gaps & lacks
1. **Input count (8) exceeds the codified cap (5–6) and Icon is explicitly not exempt.** Reshape via a config-object input grouping `strokeWidth`/`absoluteStrokeWidth`/`viewBox` into a single `svg` input.
2. Size sub-scale mismatch: component offers `size-3/4/5/6/8`, codified glyph scale is `size-4/5/10`. Either reconcile in the rules section or expand the icon scale documentation.
3. `ViewEncapsulation.None` is set without a JSDoc note explaining why (required to allow host class merging + inherited `currentColor` cascading into the imperative SVG).
4. The package exposes `IconRegistry` as a class export — consumers can `inject(IconRegistry)`. Documentation should clarify that calling `register()` at runtime is supported (per the JSDoc on line 5).
5. No test for `(load)` error event on imperative SVG construction (n/a — no such code path), but `effect()`-based re-render after `name` change is not directly asserted.

## Concrete recommendations (deep-dive prompt body)

> The block below is intended to be pasted into a fresh Claude session as the deep-dive prompt for fixing this component.

### Goal
Reshape Icon's input surface to align with the codified primitive-input cap.

### Tasks
1. **Group SVG-author config into a single `svg` input** — input-cap compliance.
   - File(s): `projects/ngx-tw/icon/icon.ts:113-122` (input declarations), `projects/ngx-tw/icon/icon.spec.ts` (test updates)
   - Why: 8 inputs exceeds the 5–6 cap. Icon is a "visual primitive" — CLAUDE.md explicitly excludes it from the exception list. The fix is to reshape via config objects.
   - Change: introduce a new input `svg = input<TwIconSvgConfig | undefined>(undefined)` where `TwIconSvgConfig = { strokeWidth?: number; absoluteStrokeWidth?: boolean; viewBox?: string }`. Deprecate the three individual inputs with a JSDoc note pointing to `svg`. Compute effective values via `linkedSignal` or `computed()` falling back to the deprecated input. Eventually remove the three individual inputs in a major release.
   - Acceptance: Public input count drops from 8 to 5 + 1 config object (= 6, within cap). Tests cover `svg` config equivalence and deprecated-input fallback. The `TwIconSvgConfig` type is exported from `index.ts`.

2. **Reconcile icon size sub-scale documentation** — codified rules vs implementation.
   - File(s): `projects/ngx-tw/icon/icon.ts:52-58` (size variants in `tv()`), and `.claude/CLAUDE.md` icon sub-scale section
   - Why: Component offers 5 sizes; codified glyph scale lists only 3 values. Either is fine, but the docs must match the implementation.
   - Change: recommended path — keep the 5-size icon scale and update the CLAUDE.md "Icon Sizing" → "Glyph icons" section to read: "Standalone icons accept the full `TwSize` scale via `<tw-icon size="...">`. The three canonical sizes for inline glyphs are `size-4` (16px / xs), `size-5` (20px / md), and `size-10` (40px / large standalone)." Add a sentence: "Components that ship their own size scale reference these values via the same canonical `TwSize` axis."
   - Acceptance: rules section in CLAUDE.md matches `ICON_SIZE_PX` map at lines 30–36.

3. **Document `ViewEncapsulation.None` rationale** — JSDoc on the class.
   - File(s): `projects/ngx-tw/icon/icon.ts:83-92` (class JSDoc / decorator)
   - Why: `ViewEncapsulation.None` is a deliberate choice (needed for class merging + inheriting `currentColor` for the imperatively built SVG). Without documentation a future contributor might revert it.
   - Change: add a `// IMPORTANT:` comment above the decorator explaining why encapsulation is disabled, and reference the SVG-build code path.
   - Acceptance: a code-level comment explains the choice; line count increases by 2.

4. **Pre-register a default Lucide subset for DX** — opt-in but discoverable.
   - File(s): `projects/ngx-tw/icon/lucide/lucide-adapter.ts` (existing; review separately)
   - Why: New consumers need to register icons before `<tw-icon name="check">` works. The dev-mode warning is helpful but a default registration would smooth onboarding. Out of scope here but worth flagging.
   - Change: review the `lucide-adapter.ts` to see if `provideTwLucideIcons()` is shipping a sensible default set. If not, add a `provideTwIconsDefault()` exporting a common-icons subset.
   - Acceptance: separate task — flag only.

5. **Add a one-line test for `effect()` re-render on `name` change after initial undefined** — covers the lifecycle.
   - File(s): `projects/ngx-tw/icon/icon.spec.ts` (add `it()` under "Rendering")
   - Why: The component caches via `prevIconData`. Switching `name` from `undefined` to `'star'` should produce an SVG — covered. But switching from `'star'` to `undefined` then back to `'check'` is not.
   - Change: add `it('rebuilds SVG when name changes after being cleared')` toggling name → undefined → 'check' and asserting two distinct SVG identities.
   - Acceptance: one new passing test.

### Out of scope
- Adding template-projected children inside the SVG (e.g., `<title>`) — consumers can wrap their own.
- Renaming `IconRegistry` — public API.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- icon`
- Visual check: demo app at `http://localhost:4600/icon`
- A11y: `npm run e2e:a11y`

## Priority
**P1** — Input-cap violation is the primary issue (visual primitives are explicitly excluded from the cap exception). Documentation reconciliation is P2; everything else is polish.
