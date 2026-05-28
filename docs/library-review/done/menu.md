# Menu — Production-Grade Review

**Entry point:** `ngx-tw/menu`
**Files:** `projects/ngx-tw/menu/`

## Snapshot
- Selectors: `tw-menu` (panel component), `[twMenuTrigger]` (click trigger), `[twContextMenuTrigger]` (right-click trigger), `[twMenuItem]` (action item), `[twMenuItemCheckbox]` (checkbox item), `[twMenuItemRadio]` (radio item), `[twMenuGroup]` (radio group wrapper), `[twMenuItemIcon]`, `[twMenuItemDescription]`, `[twMenuItemShortcut]`, `[twMenuItemSubmenuIcon]`
- Public classes/directives: 11 public exports — `MenuComponent`, `MenuTriggerDirective`, `ContextMenuTriggerDirective`, `MenuItemDirective`, `MenuItemCheckboxComponent`, `MenuItemRadioComponent`, `MenuGroupDirective`, `MenuItemIconDirective`, `MenuItemDescriptionDirective`, `MenuItemShortcutDirective`, `MenuItemSubmenuIndicatorDirective`
- Inputs: per-directive:
  - `MenuComponent`: 1 (`size`)
  - `MenuTriggerDirective`: 0 own (forwards `cdkMenuTriggerFor: twMenuTrigger`)
  - `ContextMenuTriggerDirective`: 0 own (forwards `cdkContextMenuDisabled: disabled`)
  - `MenuItemDirective`: 2 (`color`, `disabled`)
  - `MenuItemCheckboxComponent`: 1 (`disabled`) + forwards `cdkMenuItemChecked: checked`
  - `MenuItemRadioComponent`: 1 (`disabled`) + forwards `cdkMenuItemChecked: checked`
- Outputs: forwarded from CDK — `MenuTrigger`: `opened`, `closed`; `ContextMenuTrigger`: `opened`, `closed`; items: `triggered`
- Slots: structural content via `<ng-content />` inside `tw-menu` and inside each item. The four content directives (`[twMenuItemIcon]`, `[twMenuItemDescription]`, `[twMenuItemShortcut]`, `[twMenuItemSubmenuIcon]`) are class-only directives that style projected children — they don't gate visibility.
- CVA: no
- `tv()` config: yes — 4 `tv()` configs: `menuVariants` (base), `menuItemVariants` (slots inline), `menuItemIconVariants`, `menuItemIndicatorVariants`. All `twMerge: true`. All have `defaultVariants`.
- A11y CDK utilities used: `@angular/cdk/menu` (`CdkMenu`, `CdkMenuTrigger`, `CdkContextMenuTrigger`, `CdkMenuItem`, `CdkMenuItemCheckbox`, `CdkMenuItemRadio`, `CdkMenuGroup`). Roving tabindex, arrow-key navigation, Home/End, type-ahead, escape, click-outside are all owned by CDK.

## Inputs
### MenuComponent
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `size` | `TwSize` | `'md'` | yes | shared type ✓ |

### MenuItemDirective
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `color` | `'default' \| TwColor` | `'default'` | yes | extends shared union — see findings |
| `disabled` | `boolean` | `false` | yes | OK |

### MenuItemCheckboxComponent / MenuItemRadioComponent
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `disabled` | `boolean` | `false` | yes | OK |
| `checked` | `boolean` | (CDK) | (CDK) | forwarded via hostDirectives — JSDoc lives on CDK |

### Findings
- **`MenuItemDirective.color` type is `'default' | TwColor`** (extends with an extra string literal). The codified `TwColor` set in `core/types.ts` is the shared palette; adding `'default'` makes the menu-item-only union non-portable. Consider `TwColor | undefined` with `undefined` meaning "default style" (matches `twPopoverColor` and other components' optional-color pattern). The variant key just needs to handle `undefined` → no extra class.
- `MenuItemCheckboxComponent.disabled` shadows the CDK forwarded input. The directive's own `disabled` signal is read in `classes()` while CDK's `disabled` is forwarded via `inputs: ['cdkMenuItemDisabled: disabled']`. **The two parallel `disabled` inputs are connected by aliasing onto the same name, so they share a value** — but the local signal also reads it for styling. Verify they truly share; if not, the directive's local `disabled` could diverge from CDK's view of disabled. This deserves a comment or a single source of truth.
- `MenuComponent` has only one input (`size`). Per the input-count cap that is fine. **Worth considering**: a `color` axis on the menu panel itself for branded menus, or moved entirely to `MenuItemDirective` color (current pattern).
- No `dense` or `divider` axis on `tw-menu` — but `[twSeparator]` is referenced in `menuVariants` (line 28-32) via `[&>tw-separator]:` selectors. Verify that `tw-separator` is the correct exported selector from the separator entry point (project file naming has been renamed before — `TwSeparator`/`tw-separator`). Likely correct but worth double-checking.
- No `aria-label` / `aria-labelledby` inputs on `MenuComponent`. The CDK panel gets `role="menu"` automatically, but consumers should be able to label it.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `MenuTriggerDirective.opened` | `void` | propertyChange/past-tense | from CDK |
| `MenuTriggerDirective.closed` | `void` | past-tense | from CDK |
| `ContextMenuTriggerDirective.opened` | `void` | past-tense | from CDK |
| `ContextMenuTriggerDirective.closed` | `void` | past-tense | from CDK |
| `MenuItemDirective.triggered` | `void` | past-tense | from CDK |
| `MenuItemCheckboxComponent.triggered` | `void` | past-tense | from CDK |
| `MenuItemRadioComponent.triggered` | `void` | past-tense | from CDK |
| `MenuComponent` host-directive forwards `CdkMenu.closed` | `void` | past-tense | from CDK |

### Findings
- All outputs are aliased from CDK and carry void payloads. **For `checkbox`/`radio` items, CDK's `cdkMenuItemTriggered` does not carry the new `checked` value** — consumers must read `checked` separately. Document this and/or expose a derived output. Material's checkbox menu items have a `checkedChange`/`changed` event pattern.

## Customization surface
- ng-content slots: `tw-menu` renders `<ng-content />` and accepts any children. Items use `<ng-content />` for label text. Checkbox/radio items have a built-in indicator span then `<ng-content />`.
- Structural directives: none — projection-only.
- Fallback content: none provided; structural by design.
- Class merging: `twMerge: true` everywhere. Consumer classes on `tw-menu` or `[twMenuItem]` merge cleanly.
- Findings:
  - Content directives (`twMenuItemIcon`, `twMenuItemDescription`, `twMenuItemShortcut`, `twMenuItemSubmenuIcon`) all bind `[class]` only — no `host` event handlers, no signals. This is the right amount of abstraction.
  - **No projection slot for a "menu header" or "menu label"** (e.g. category title above items). Material has `mat-menu-content` etc.; CDK does not natively. Optional enhancement.
  - **No submenu wiring example.** `[twMenuItemSubmenuIcon]` exists but there is no documented pattern in this file for nesting `[twMenuTrigger]` on a `[twMenuItem]`. Confirm this works via CDK and document in demo.

## CSS / Styling
- tailwind-variants: yes, four configs
- twMerge: yes on all
- Semantic tokens vs raw palette:
  - Menu panel base: `bg-surface-overlay border border-border shadow-md text-fg overflow-y-auto rounded-lg max-h-96 min-w-48 flex flex-col` (line 25). All semantic. ✓
  - Item base: `text-fg outline-none focus-visible:bg-surface-muted hover:bg-surface-muted` (line 45). ✓
  - Color variants (lines 56-69): all semantic with explicit `dark:` overrides (`dark:text-{color}-300 dark:hover:bg-{color}-950 dark:focus-visible:bg-{color}-950`). Excellent — matches the project's codified dark-mode override convention.
- Surface/fg/border tokens: extensive. `bg-surface-overlay`, `border-border`, `text-fg`, `text-fg-muted`, `text-fg-subtle`. ✓
- Radius compliance: panel `rounded-lg` (line 25), item `rounded-md` (line 45). ✓
- Spacing/gap compliance:
  - Panel padding by size (lines 28-32): `p-0.5` / `p-1` / `p-1.5` / `p-2` — `p-0.5` is NOT in the codified padding scale (`p-2`/`p-3`/`p-4`/`p-6`/`p-8`). Menu is the exception: container padding for menu panels is intentionally tighter than the "size scale" because items have their own padding. **This is a real divergence from CLAUDE.md but justified — call it out in a comment**.
  - Item gap `gap-2` (line 45). ✓
  - Item padding scale (lines 47-52): `px-1.5 py-0.5` (xs), `px-2 py-1` (sm), `px-3 py-1.5` (md), `px-4 py-2` (lg), `px-5 py-2.5` (xl). Matches the inline-element padding scale. ✓
  - Separator margins use arbitrary `[&>tw-separator]:-mx-0.5` etc. — fine because they relate to the panel padding scale.
- Typography compliance: xs/sm use `text-xs`, md/lg use `text-sm`, xl uses `text-base`. Within the allowed scale (no `text-2xs`, no `text-lg+`). ✓
- Focus rings: **menu-item carve-out applied correctly** — items use `outline-none focus-visible:bg-surface-muted` (line 45) per CLAUDE.md "Menu-item carve-out". An explicit comment at line 40-42 references the rule. ✓ This is the canonical example.
- Dark mode handling: explicit `dark:` overrides on every color variant (lines 56-69). ✓
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on items (line 45). ✓
- Shadows: `shadow-md` on panel (line 25). ✓
- Icon sub-scale: glyph icons in menu items use `size-4` / `size-5` (lines 87-91). Indicator (checkbox/radio) follows the same scale (lines 102-106). ✓
- Findings:
  - **`p-0.5` panel padding (lines 28-29) is outside the codified spacing scale.** Add a one-line comment explaining the menu's tighter density, or define an `xs/sm` row at `p-1` and accept slightly more whitespace.
  - **Long compound class strings in color variants** (e.g. line 57 is 178 chars). Refactor with a helper like `buildColorClasses(color)` or split into named string constants for readability. Pure cosmetic.
  - **No `motion-reduce:transition-none` on the indicator span** — but it doesn't transition, so no issue.

## Overlay specifics
- CDK Overlay primitives used: all via `@angular/cdk/menu` (which manages overlay creation, position strategy, scroll strategy, backdrop, focus, keyboard internally).
- Position strategy: CDK Menu's default `flexibleConnectedTo` for `MenuTrigger`, viewport-relative for `ContextMenuTrigger`.
- Scroll strategy: CDK Menu uses `reposition` by default. **Not configurable** through the current public API — consumers cannot pass a custom scroll strategy or position offset. Add inputs that forward to CDK's `cdkMenuPosition` / scroll strategy if needed (currently aliased away).
- Focus trap: roving tabindex within the menu, not a full focus trap (matches WAI-ARIA menu pattern, not dialog).
- Backdrop: invisible CDK backdrop catches outside clicks.
- Escape close: CDK Menu handles it.
- Outside click close: CDK Menu handles it.
- Animations: `[animate.enter]="'scale-in fade-in'"` / `[animate.leave]="'scale-out fade-out'"` on the menu host (lines 127-128). Keyframes in `_base.css:33-62`. ✓
- Z-index / stacking: CDK overlay manages it.
- Findings:
  - **CDK Menu's position is not exposed through any directive input.** `cdkMenuPosition` and `cdkMenuTriggerOffsetX/Y` are not forwarded. For a production-grade library, consumers should be able to choose `bottom-end` vs `bottom-start` etc. Currently the only way is to set them directly on the underlying CdkMenu directive — bypassing the wrapper.
  - **`cdkContextMenuTriggerFor` aliased but no positioning forwarded.** Context menus currently use the click coordinates; that's correct.

## Accessibility
- ARIA roles/attributes:
  - `tw-menu` → `role="menu"` (from CdkMenu).
  - `[twMenuItem]` → `role="menuitem"`.
  - `[twMenuItemCheckbox]` → `role="menuitemcheckbox"`, `aria-checked` reflected.
  - `[twMenuItemRadio]` → `role="menuitemradio"`, `aria-checked` reflected.
  - `[twMenuGroup]` → `role="group"`.
  - All correct via CDK.
- Keyboard support (all from CDK menu):
  - Arrow keys move focus.
  - Home/End jump to first/last.
  - Type-ahead skips to matching items.
  - Escape closes.
  - Tab closes and moves focus to next element.
  - Space/Enter activates an item.
- CDK a11y utilities: `cdk/menu` orchestrates `FocusKeyManager`, roving tabindex, etc. ✓
- aria-describedby wiring: N/A.
- aria-labelledby wiring: **missing** — `MenuComponent` does not accept `aria-label`/`aria-labelledby`. Setting these via `host:` from the consumer (e.g. `<tw-menu aria-label="Edit options">`) works but is undocumented and not validated.
- Focus return on close: CDK Menu handles it.
- AXE risks:
  - **No `aria-label` on the menu panel.** When a menu has no visible label, screen readers announce "menu" with no context. CDK does not assume one. The `MenuComponent` should accept an `ariaLabel` input that wires `[attr.aria-label]` on the host.

### Findings
- Add `ariaLabel: input<string | undefined>(undefined)` on `MenuComponent` and bind it via `'[attr.aria-label]': 'ariaLabel()'`.

## Tests
- Spec file: yes — `menu.spec.ts` (482 lines)
- Coverage breakdown:
  - rendering: trigger renders; menu opens on click; role=menu present; items render ✓
  - sizes: all 5 ✓
  - item colors: all 9 (`default` + 8 `TwColor` values) ✓
  - disabled item: blocks triggered ✓
  - content directives: icon/description/shortcut/submenu rendered ✓
  - checkbox item: role + aria-checked + indicator presence ✓
  - radio item: role + aria-checked + group role ✓
  - trigger outputs: opened/closed ✓
  - context menu trigger: opens on contextmenu, blocked when disabled ✓
  - accessibility: role=menu, role=menuitem ✓
- Vitest-specific issues: uses real timers (`afterEach` cleanup of overlay container), no `fakeAsync`/`tick`. Compliant.
- Findings:
  - Missing test: arrow-key navigation behavior between items (visit each item via ArrowDown, assert focus moves and `tabindex` rotates).
  - Missing test: type-ahead (press a letter, assert the first matching item is focused).
  - Missing test: Home/End keys.
  - Missing test: Escape closes the menu and returns focus to the trigger.
  - Missing test: submenu trigger chains — `[twMenuTrigger]` on a `[twMenuItem]` opens a nested menu.
  - Missing test: focus indicator carve-out — assert the focused item has `bg-surface-muted` (or color-tinted variant) and NOT `outline-2`.

## Gaps & lacks
1. No `ariaLabel` input on `MenuComponent` — menus with no visible label are unlabelled.
2. `MenuItemDirective.color` adds `'default'` to the shared `TwColor` union — non-idiomatic; should be `TwColor | undefined` or similar.
3. Position / offset of the menu overlay is not configurable via the wrapper — consumers cannot choose `bottom-start` vs `bottom-end` without bypassing the directive.
4. Two parallel `disabled` signals on `MenuItemCheckboxComponent` / `MenuItemRadioComponent` (local input + forwarded CDK alias). Confirm they always agree.
5. Test coverage missing on keyboard semantics (Arrow, Home/End, Escape return-focus, type-ahead).
6. `p-0.5` panel padding diverges from the codified container-spacing scale without a justifying inline comment.
7. `cdkMenuItemTriggered` payload is `void` — consumers querying checkbox/radio state must read `aria-checked` separately. Consider a derived `checkedChange` output.
8. Long compound class strings in color variants are hard to read — extract to constants.

## Concrete recommendations (deep-dive prompt body)

### Goal
Tighten the menu's public API surface — add label support, expose position/offset, normalize the item-color type, and round out the keyboard / focus-return test coverage. Visual / token compliance is already strong.

### Tasks
1. **Add `ariaLabel` input to `MenuComponent` (P0)** — accessibility
   - File(s): `projects/ngx-tw/menu/menu.ts:115-137`
   - Why: When a menu has no visible heading and the trigger label doesn't describe the menu (e.g. an icon-only kebab button), screen readers announce just "menu" with no context.
   - Change: Add `readonly ariaLabel = input<string | undefined>(undefined)` with JSDoc. Wire it via `host: { '[attr.aria-label]': 'ariaLabel()', ... }`. Also accept `ariaLabelledBy: input<string | undefined>(undefined)` for cases where a sibling heading labels the menu.
   - Acceptance: Setting `<tw-menu ariaLabel="Edit options">` produces `aria-label="Edit options"` on the panel. AXE on the menu in demo passes with no "missing accessible name" warning.
2. **Normalize `MenuItemDirective.color` (P1)** — type consistency
   - File(s): `projects/ngx-tw/menu/menu.ts:186-187, 195-200`
   - Why: Adding `'default'` to the shared `TwColor` union creates a menu-specific type. Other components use `TwColor | undefined`.
   - Change: Replace `'default' | TwColor` with `TwColor | undefined`. The `menuItemVariants` config should treat `undefined` as no-color-variant (i.e. use the base class only). Update the `color` variant key to handle `undefined` (delete the `default` row; rely on `defaultVariants: { color: undefined }` or omit and let `tv()` skip the variant).
   - Acceptance: TypeScript compiles. Existing demo that used `color="default"` updated to omit the input. Color variant tests still pass.
3. **Expose menu position + offset (P1)**
   - File(s): `projects/ngx-tw/menu/menu.ts:141-151`
   - Why: Consumers can't anchor a menu to the right edge of the trigger without reaching into CDK. `MenuTriggerDirective` should forward `cdkMenuPosition` and offset inputs.
   - Change: Add to `hostDirectives` inputs:
     ```ts
     'cdkMenuPosition: position',
     'cdkMenuTriggerOffsetX: offsetX',
     'cdkMenuTriggerOffsetY: offsetY',
     ```
     Document the `position` type with a JSDoc on a comment pointing at CDK's `ConnectedPosition[]`.
   - Acceptance: Demo route can pass `[position]="rightAnchor"` and see the panel anchored differently.
4. **Single source of truth for item disabled state (P1)**
   - File(s): `projects/ngx-tw/menu/menu.ts:206-247` (Checkbox + Radio components)
   - Why: Each component declares its own `disabled = input(false)` AND aliases `cdkMenuItemDisabled: disabled` on the host directive. CDK's directive owns the *behavior*; the local signal drives styling. The aliasing makes them appear to share the same value but this is fragile.
   - Change: Remove the local `disabled` input on checkbox/radio components. Instead read CDK's via `inject(CdkMenuItemCheckbox).disabled` (CDK exposes `disabled` as a getter / signal). For styling, use this CDK-owned source.
   - Acceptance: Setting `[disabled]="true"` still disables the item visually and behaviorally. Test passes.
5. **Document the `p-0.5` panel-padding divergence (P2)**
   - File(s): `projects/ngx-tw/menu/menu.ts:25-37`
   - Why: `p-0.5` for xs/sm panels is outside the codified `p-2`/`p-3`/`p-4`/`p-6`/`p-8` container scale. The choice is intentional (tighter menu density), but undocumented.
   - Change: Add a one-line comment above the size variants: `// Menu panels intentionally use sub-`p-1` padding because items carry their own padding; the size scale here measures the panel gutter only.`
   - Acceptance: Comment lands; lint rules (if any) reflect the exception.
6. **Optional: emit `checkedChange` from checkbox/radio items (P2)**
   - File(s): `projects/ngx-tw/menu/menu.ts:206-247`
   - Why: `triggered` carries no payload, so consumers must read `aria-checked` separately.
   - Change: Add a `checkedChange = output<boolean>()` driven by an `effect()` over CDK's `checked` signal. Emit only when the value changes due to an actual trigger (use `untracked` + `previous` pattern).
   - Acceptance: A test asserting consumer receives `(checkedChange)="onChange($event)"` events on every toggle.
7. **Refactor long class strings (P2)**
   - File(s): `projects/ngx-tw/menu/menu.ts:54-69`
   - Change: Extract `buildColorVariant(color)` helper or split each into a named constant. Optional — purely readability.
8. **Test coverage gaps (P1)**
   - File(s): `projects/ngx-tw/menu/menu.spec.ts`
   - Add tests:
     - Arrow-down/up rotates focus between items (assert `tabindex` and `document.activeElement`).
     - Home/End jump to first/last.
     - Escape closes the menu and returns focus to the trigger.
     - Type-ahead: dispatch a `keydown` with key `"S"`, assert the first item starting with S is focused.
     - Submenu trigger: an item that is itself `[twMenuTrigger]` opens a nested menu (verify with a fixture that has nested templates).
     - Focus carve-out style: the focused item has `bg-surface-muted` and no `outline-2`.

### Out of scope
- Adding a `[twMenuHeader]` projection slot — current pattern works; defer until a real demand surfaces.
- Submenu refactor beyond confirming the chain works.
- Adding a `dense` boolean — `size="xs"`/`"sm"` already serves that.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- menu`
- Visual check: `http://localhost:4600/components/menu`
- A11y: `npm run e2e:a11y` and manual NVDA / VoiceOver pass — confirm labelled menu announces "Edit options menu".

## Priority
**P1** — menu's visual styling, focus-carve-out, and dark-mode treatment are already exemplary (this is the canonical example for the focus carve-out per CLAUDE.md). The two P0/P1 items (`ariaLabel`, position exposure) close real accessibility and customization gaps but the component is otherwise close to production-grade. Test gaps are the most important follow-up.
