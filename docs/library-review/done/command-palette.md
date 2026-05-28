# Command-Palette — Production-Grade Review

**Entry point:** `ngx-tw/command-palette`
**Files:** `projects/ngx-tw/command-palette/`

## Snapshot
- Selectors: `tw-command-palette` (element — orchestrator), `tw-command-palette-item` (element — declarative item), `tw-command-palette-overlay` (element — private overlay component), `[twCommandPaletteGroup]`, `[twCommandPaletteItemIcon]`, `[twCommandPaletteItemDescription]`, `[twCommandPaletteEmpty]`, `[twCommandPaletteFooter]`
- Public classes/directives: `CommandPaletteComponent`, `CommandPaletteItemDirective`, `CommandPaletteGroupDirective`, `CommandPaletteItemIconDirective`, `CommandPaletteItemDescriptionDirective`, `CommandPaletteEmptyDirective`, `CommandPaletteFooterDirective`, `CommandPaletteOverlayComponent` (private, NOT exported)
- Inputs: 11 on `CommandPaletteComponent` (`size`, `placeholder`, `query` model, `open` model, `commands`, `filterFn`, `closeOnSelect`, `closeOnEscape`, `closeOnBackdropClick`, `autoFocus`, `ariaLabel`, `panelClass`) + 7 on `CommandPaletteItemDirective` (`id`, `label`, `keywords`, `group`, `disabled`, `shortcut`, `run`) + 1 on `CommandPaletteGroupDirective` (`label` required)
- Outputs: 3 on palette (`itemSelected`, `opened`, `closed`) + 1 on item (`activated`)
- Slots: declarative palette items, optional `[twCommandPaletteGroup]` wrappers, `[twCommandPaletteEmpty]` template, `[twCommandPaletteFooter]` template, plus per-item `[twCommandPaletteItemIcon]` / `[twCommandPaletteItemDescription]` decorations
- CVA: no
- `tv()` config: yes, 12 slots, 3 variant axes (`size`, `active`, `disabled`); `defaultVariants` present
- A11y CDK utilities used: `FocusTrapFactory`, `LiveAnnouncer`, `Overlay`, `ComponentPortal`, `Injector` (token wiring)

## Inputs
| Input | Type | Default | JSDoc? | Notes |
|---|---|---|---|---|
| `size` | `TwSize` (shared) | `'md'` | yes | Density |
| `placeholder` | `string` | `'Type a command or search…'` | yes | Search input placeholder |
| `query` (model) | `string` | `''` | yes | Two-way query |
| `open` (model) | `boolean` | `false` | yes | Two-way open state |
| `commands` | `readonly CommandPaletteItem[]` | `[]` | yes | Data-driven list |
| `filterFn` | `CommandPaletteFilterFn \| undefined` | `undefined` | yes | Custom filter |
| `closeOnSelect` | `boolean` | `true` | yes | Codified `true` candidate |
| `closeOnEscape` | `boolean` | `true` | yes | Codified `true` candidate |
| `closeOnBackdropClick` | `boolean` | `true` | yes | Codified `true` candidate |
| `autoFocus` | `boolean` | `true` | yes | Codified `true` candidate |
| `ariaLabel` | `string` | `'Command palette'` | yes | Dialog accessible name |
| `panelClass` | `string \| string[]` | `''` | yes | Consumer-supplied panel class augmentation |
| **item** `id` | `string` (required) | n/a | yes | Stable id |
| **item** `label` | `string` | `''` | yes | Filter + render fallback |
| **item** `keywords` | `readonly string[]` | `[]` | yes | Search aliases |
| **item** `group` | `string \| undefined` | `undefined` | yes | Overrides parent group |
| **item** `disabled` | `boolean` | `false` | yes | Render but inert |
| **item** `shortcut` | `string \| readonly string[] \| undefined` | `undefined` | yes | Kbd hint |
| **item** `run` | `(() => void) \| undefined` | `undefined` | yes | Pre-emit callback |
| **group** `label` | `string` (required) | n/a | yes | Heading text |

### Findings
- 11 + 1 inputs on `CommandPaletteComponent`. Overlay-bearing component exception applies (CLAUDE.md §Input count cap; MEMORY `feedback_input_count_overlay.md`). No reshape recommendation.
- 7 inputs on `CommandPaletteItemDirective` — also under any overlay budget when considered as a sub-API.
- **Four `true` defaults** (`closeOnSelect`, `closeOnEscape`, `closeOnBackdropClick`, `autoFocus`). None are in the codified list, but all have intuitive opt-out semantics. Recommend adding to the codified list with one-line rationale (e.g., "Escape closes by default; the special case is a modal palette that disables it"). Each input's JSDoc already documents the default; promote to the documented form and update CLAUDE.md.
- JSDoc one-liners are present everywhere. Compliant.
- `description` field exists on `CommandPaletteItem` (line 17 of `command-palette-tokens.ts`) but is NOT exposed as an input on `CommandPaletteItemDirective`. Consumers using the declarative API cannot set `description`. Either add a `description = input<string>('')` to the directive or document that descriptions are data-API-only.
- `icon` field on `CommandPaletteItem` is similarly orphan — there's no input on the directive and the template doesn't render it. The decoration is achieved via `[twCommandPaletteItemIcon]` directive, which sets host classes but doesn't tie to the `icon` field. Document or remove the orphan field.
- `panelClass: string | string[]` union type is handled via `Array.isArray()` (line 528) — fine, but the codified library pattern elsewhere is `string` only with `twMerge` handling the array case via Tailwind utilities; the dual-type signature is unusual. Acceptable.

## Outputs
| Output | Payload | Naming pattern | Notes |
|---|---|---|---|
| `itemSelected` | `CommandPaletteItem` | past-tense action | Fires after `run()` callback |
| `opened` | `void` | past-tense action | After attach |
| `closed` | `void` | past-tense action | After detach (post-animation) |
| **item** `activated` | `void` | past-tense action | Per-item event |

### Findings
- Output naming follows the past-tense action pattern consistently. Compliant.
- No `queryChange` event — covered by the `query` model. Good.
- No `openChange` event — covered by the `open` model. Good.
- `itemSelected` is the canonical event for consumers wiring command handlers; `activated` lets a single item subscribe without filtering inside `itemSelected`. Two ways to wire is fine.

## Customization surface
- ng-content slots: declarative items via `<tw-command-palette-item>`, decorations via the three host-class directives, structural templates via `[twCommandPaletteEmpty]` (with `$implicit: query` context) and `[twCommandPaletteFooter]`
- Structural directives: comprehensive — empty / footer
- Fallback content: the empty state has a built-in "No results found" message (overlay template line 28) used when no `[twCommandPaletteEmpty]` template is projected. Compliant.
- Class merging: `twMerge: true` (line 128)
- Findings:
  - The declarative-item + data-driven `commands` dual API is novel and well-implemented: `allItems()` (line 445) merges both with declarative-wins-on-id-collision. Consumers can mix static items projected into the template with dynamic items pushed via `commands`. Good design.
  - The `description` and `icon` orphan fields (see above) are the only customization gaps.
  - `[twCommandPaletteItemIcon]` host classes are `'size-4 shrink-0 text-fg-muted'` — uses the glyph sub-scale (`size-4` = 16px) and a semantic token. Compliant.
  - `[twCommandPaletteItemDescription]` host classes are `'block text-xs text-fg-muted mt-0.5 min-w-0 truncate'` — uses semantic typography. The class string duplicates the `itemDescription` slot value in the `tv()` config (line 82) but the description directive is applied to consumer-projected content, while the slot class is unused by the current template (the template inlines the description as a `<span>` with the slot class at line 53). Slight redundancy; consider removing the slot if the directive owns the styling.

## CSS / Styling
- tailwind-variants: yes; 12 slots, 3 variant axes
- twMerge: yes (line 128)
- Semantic tokens vs raw palette: all colour-specific styling uses surface/fg/border tokens (`surface-overlay`, `border-border`, `text-fg`, `placeholder:text-fg-subtle`, `bg-surface-muted`, `text-fg-muted`). Compliant.
- Surface/fg/border tokens usage: panel `bg-surface-overlay text-fg` (line 71) — uses the dedicated overlay-surface token. Search wrapper border `border-b border-border` (line 72). Item active `bg-surface-muted` (line 117). Compliant — exemplary token usage.
- Radius compliance: panel `rounded-lg` (line 71), kbd `rounded-md` (line 84) — compliant.
- Spacing/gap compliance: search wrapper `gap-3 px-4` (line 72), item `px-4 gap-3` (line 80), item shortcut `gap-1` (line 83) — `gap-1` is on the kbd row, which is acceptable per the documented gap scale (`gap-1` is listed). Item sizes use `py-{1,1.5,2,2.5,3}` (lines 91–115) — compliant with the inline padding scale (but applied as block padding on a flex-row item, which is the standard listbox-row pattern). Compliant.
- Typography compliance: search input scales `text-{xs,xs,sm,base,base}` (lines 91–115). Item label `text-{xs,xs,sm,sm,base}`. Group header `text-xs font-semibold uppercase tracking-wide` (line 77) — uses xs as the group-header scale. `text-2xs` on the kbd font (line 85) — uses the codified xs-density token. Compliant.
- Focus rings compliance: the listbox listbox items use `role="option"` (overlay HTML line 39). Per CLAUDE.md: command-palette items typically use `role=option` (listbox model) and MUST use the canonical outline ring (NOT the menu-item bg-shift carve-out). **The current implementation uses ONLY the bg-shift (`bg-surface-muted` on active, line 118).** This is a documented violation. The item template applies `outline-none` (slot definition line 80) and no `focus-visible:outline-*` is ever applied. Since the listbox model uses `aria-activedescendant` (line 16 of the overlay HTML — `aria-activedescendant` on the input rather than per-item focus), the items themselves are never DOM-focused. Bg-shift is the visual focus indicator. This is actually the standard ARIA listbox pattern — the active item is identified by `aria-activedescendant`, focus stays on the combobox. **HOWEVER**, the rule from CLAUDE.md (focus-ring section's menu-item carve-out) says: "carve-out does NOT extend to other listbox-like roles (`option`, `tab`, `treeitem`); those still take the canonical outline ring." Per the codified rule, when active items render they must carry the canonical `focus-visible:outline-2 outline-offset-2 outline-primary-500`. But `focus-visible` is keyed on `:focus` (which the option never receives in the activedescendant model). So either the rule needs amending for the listbox-with-aria-activedescendant pattern, or we add a non-focus-based visual ring on the active item. Current implementation matches WAI-ARIA Combobox/Listbox best practice (visual highlight via `aria-activedescendant` mapping). Flag for cross-cutting review — this is likely a CLAUDE.md amendment, not a component bug.
- Dark mode handling: relies on surface/fg/border tokens which adapt — no explicit `dark:` overrides needed at this surface. Compliant.
- Transitions: `transition-colors duration-200 motion-reduce:transition-none` on items (line 80) — compliant.
- Shadows: panel uses `shadow-md` (line 71) — matches the codified "floating panel" elevation. Compliant.
- Icon sub-scale: search icon `size-5` (line 75) — glyph standard. Kbd `min-w-5 h-5` (line 84) — interactive-tag scale (matches small button affordance). Compliant.
- Animations: `animate.enter="scale-in fade-in"` / `animate.leave="scale-out fade-out"` on the overlay host (lines 287–288); keyframes in `theme/_base.css:49-62` with reduced-motion carve-out. Compliant.
- Findings:
  - Token usage is exemplary throughout — every neutral surface uses the right surface/fg/border token.
  - The `text-2xs` on kbd (line 85) is one of the documented carve-outs for xs-density secondary text. Compliant per CLAUDE.md typography rules.

## Accessibility
- ARIA roles/attributes: panel `role="dialog" aria-modal="true" aria-label` (overlay HTML line 1). Input `role="combobox" aria-expanded="true" aria-controls aria-activedescendant` (lines 9–17). Listbox `role="listbox"` with id (line 21). Groups `role="group" aria-label` (line 32). Items `role="option" aria-selected aria-disabled` (lines 39–42). Compliant with WAI-ARIA APG "Combobox With Listbox Popup" pattern.
- Keyboard support: Escape (closeable), ArrowDown/Up (active-descendant rover, wraps, skips disabled), Home/End (first/last enabled), Enter (activate), Tab (close). Implemented in `handleOverlayKeydown` (lines 716–749). Compliant with the APG pattern.
- CDK a11y utilities: `FocusTrapFactory` (line 27, 424, 771), `LiveAnnouncer` (lines 425, 629, 555). Both used correctly. Focus trap installed on the overlay element (line 773), destroyed on close. Live announcer debounced via 200ms timer (line 551) — good UX (prevents announcement spam while typing).
- Labels/descriptions wiring: dialog has `aria-label` (default `'Command palette'`). Combobox has implicit label via the wrapping dialog (placeholder is documented as not a substitute, but `aria-label` is not set on the input). Add `aria-label="Search commands"` to the `<input>` to disambiguate. Currently the input relies on the placeholder text for visual context but has no screen-reader-readable label.
- AXE risks:
  - **Input has no `aria-label`** — the dialog has one, but the combobox input itself does not. AXE flags this as "form-field-multiple-labels" risk in some configurations; at minimum, screen readers announce "edit, blank" instead of "Search commands, edit".
  - The kbd shortcut hint is `aria-hidden="true"` (line 57 overlay HTML) so it's not double-announced — correct.
  - Group header is `role="presentation"` (line 34) so it's not announced as a region — correct, the surrounding `role="group" aria-label` already names the region.
  - Focus return after close (`previousFocus.focus()`, line 642) — correct.
- Findings:
  - Add `aria-label="Search commands"` (or a configurable input on the palette) on the `<input role="combobox">` — closes the only material a11y gap.
  - The live-announcer debounce of 200ms (line 44 — `ANNOUNCE_DEBOUNCE`) is well-chosen.
  - On open, the palette announces `"Command palette opened. N commands available."` (line 629) — informative and not over-noisy.

## Tests
- Spec file: yes (`command-palette.spec.ts`, 866 lines)
- Coverage breakdown:
  - rendering: closed-state empty overlay, opened-state full surface, all sizes
  - declarative items vs data-driven items
  - filtering: case-insensitive substring, keywords, custom filterFn
  - keyboard navigation: ArrowDown, ArrowDown wrap, ArrowUp wrap, Home, End (with active-descendant skip on disabled)
  - selection: Enter, click, disabled blocked, closeOnSelect toggle
  - close behavior: Escape, backdrop click, both flags
  - model binding: open → mount overlay, close → set open false
  - ARIA: dialog role + aria-modal + aria-label, combobox role + aria-expanded + aria-controls + aria-activedescendant, option role + aria-selected, aria-disabled
  - focus management: search input focus on open, focus return on close
  - empty state: built-in vs projected template
  - footer template
  - groups: declarative wrappers
  - overlay reuse: no double-mount on re-open
  - programmatic control: show, hide, toggle
  - outputs: opened/closed event order
  - cleanup: overlay removed on host destroy
- Vitest issues: uses `vi.useFakeTimers()` + `vi.advanceTimersByTime(CLOSE_ANIMATION_MS)` to handle the 150ms close animation (line 213–216). This is the codified replacement for `fakeAsync`/`tick`. Compliant.
- Findings:
  - Coverage is exemplary — among the strongest in the library.
  - Missing: nothing tests `aria-label` on the search input (because it isn't set today — see A11y findings).
  - Missing: nothing tests `panelClass` consumer override application.
  - Missing: nothing tests the LiveAnnouncer call on open / on query change (debounced 200ms announcement). A `vi.spyOn(announcer, 'announce')` would catch the call.
  - Missing: `description` field rendering (data-driven item). When `description` is set on a `CommandPaletteItem` data entry, the template renders a `<span class="…itemDescription">` (overlay HTML lines 52–54). No spec asserts this.
  - Missing: dual-key shortcut rendering (`shortcut: ['⌘', 'K']` renders two `<kbd>` elements).
  - Missing: orphan-field demonstration — if `icon` is set on a data entry, nothing happens. A spec that documents this (or its absence) closes the contract gap.

## Gaps & lacks
1. **Search input lacks `aria-label`** — the dialog has one, but the combobox doesn't. Single material a11y gap.
2. **`description` and `icon` fields on `CommandPaletteItem` are orphan on the declarative API** — consumers cannot set them via `<tw-command-palette-item>`.
3. **Four `true`-default booleans not in the codified list** (`closeOnSelect`, `closeOnEscape`, `closeOnBackdropClick`, `autoFocus`).
4. **Focus-ring policy for `role="option"` under `aria-activedescendant`** needs a CLAUDE.md amendment — the current bg-shift implementation matches WAI-ARIA Combobox+Listbox best practice but technically violates the codified rule. Either amend the rule or change implementation (the former is correct).
5. **Tests miss**: input aria-label, panelClass application, LiveAnnouncer mocks, description rendering, dual-key shortcut rendering.
6. **No "recently used" history** — nice-to-have for command-palette UX; not blocking.
7. **No async-search support beyond `filterFn`** — consumers can return a promise-resolved list via signals + effects, but there's no first-class debounced async path.
8. **No hotkey-to-open helper** — consumers wire `(document:keydown.meta.k)` themselves. Could be a small directive.

## Concrete recommendations (deep-dive prompt body)

### Goal
Close the single a11y gap (input aria-label), wire the orphan `description` field into the declarative API, codify the `true`-default booleans, fill test gaps, and tighten CLAUDE.md's focus-ring rule for activedescendant-driven listboxes.

### Tasks
1. **Add `aria-label` to the search input** — closes the one material a11y gap.
   - File(s): `projects/ngx-tw/command-palette/command-palette-overlay.html:6-19`, `projects/ngx-tw/command-palette/command-palette.ts:378-407`
   - Why: AXE may flag the combobox input as unlabelled. Screen readers should announce "Search commands, combobox" on focus.
   - Change: add `readonly searchAriaLabel = input<string>('Search commands')` on `CommandPaletteComponent`. Bind in the overlay template: `[attr.aria-label]="palette.searchAriaLabel()"`. Document the default.
   - Acceptance: new spec asserts the input carries `aria-label="Search commands"` by default and reflects override; AXE passes on the open palette.

2. **Expose `description` as an input on `CommandPaletteItemDirective`** — closes the orphan-field gap.
   - File(s): `projects/ngx-tw/command-palette/command-palette.ts:194-237` (item directive)
   - Why: the data API exposes `description`, the rendering path renders it (overlay HTML lines 52–54), but the declarative API has no input.
   - Change: add `readonly description = input<string>('')` to `CommandPaletteItemDirective`. Include it in the `data` computed: `description: this.description() || undefined`. Update JSDoc.
   - Acceptance: new spec mounts `<tw-command-palette-item description="A subtitle">` and asserts the subtitle renders in the overlay; existing data-driven path continues to work.

3. **Codify the four `true`-default booleans** — JSDoc rationale + CLAUDE.md update.
   - File(s): `projects/ngx-tw/command-palette/command-palette.ts:394-403`, `.claude/CLAUDE.md` §Boolean defaults
   - Why: codification requires inline rationale OR an entry in the list.
   - Change: add one-line rationale to each input's JSDoc ("Escape closes by default; the special case is a non-dismissible modal palette"). Append four entries to `.claude/CLAUDE.md`.
   - Acceptance: linter pass; CLAUDE.md updated; no behaviour change.

4. **Amend CLAUDE.md focus-ring rule for activedescendant-driven listboxes** — closes the doctrinal gap.
   - File(s): `.claude/CLAUDE.md` §Focus Rings (the menu-item carve-out paragraph)
   - Why: the current rule says `option` MUST use the canonical outline ring, but WAI-ARIA Combobox+Listbox best practice uses `aria-activedescendant` with visual highlight via background. The command-palette correctly follows the APG pattern; the rule's wording needs to allow it.
   - Change: extend the menu-item carve-out paragraph: "Elements rendered as `role="option"` inside a combobox+listbox using `aria-activedescendant` (i.e., focus stays on the combobox, the active option is identified only by id reference) MAY use the same bg-shift visual indicator as menu items. The canonical outline ring still applies when the listbox is focus-managed (each option receives `tabindex` / `focus()`)."
   - Acceptance: rule allows the current command-palette implementation; future linting policies do not flag it.

5. **Close test coverage** — panelClass, LiveAnnouncer, description, dual-key shortcut.
   - File(s): `projects/ngx-tw/command-palette/command-palette.spec.ts` (new describe blocks)
   - Why: every documented behaviour should have a DOM-level assertion.
   - Change: (a) `it('appends consumer panelClass to the overlay panel')` mounts with `[panelClass]="['foo','bar']"`, asserts the panel carries `foo bar`. (b) `it('announces a results-count message on query change (debounced)')` mounts with the announcer spy, types a query, advances timers by 200ms, asserts `announcer.announce` was called with `1 result for foo`. (c) `it('renders description text under the label')` data-driven path. (d) `it('renders each key of a dual-key shortcut as a separate kbd')`.
   - Acceptance: four new specs pass.

6. **(Optional) Add an `[twCommandPaletteHotkey]` directive** — eases the global keyboard binding.
   - File(s): new `projects/ngx-tw/command-palette/command-palette-hotkey.ts`
   - Why: every consumer needs `(document:keydown.meta.k) => palette.show()` boilerplate. A small directive that binds at the document level when the host mounts would standardise this.
   - Change: `@Directive({ selector: '[twCommandPaletteHotkey]' })` with `readonly hotkey = input<string>('Mod+K')` (using `Mod` shorthand for Meta on Mac / Ctrl elsewhere). Inject the palette via `inject(CommandPaletteComponent)`. On `host: { '(document:keydown)': 'onKey($event)' }`, parse the input, call `palette.toggle()` if matched.
   - Acceptance: a new demo example wires `<tw-command-palette twCommandPaletteHotkey>`; spec asserts `Cmd+K` toggles open.

### Out of scope
- Async/Observable search — `filterFn` is sufficient and consumers can drive `commands` from a signal.
- Recently-used history — orthogonal feature; can be a future enhancement.
- Mobile-specific styles — the panel uses `max-w-xl mt-[15vh]` which adapts well; no immediate gap.
- Renaming `tw-command-palette-item` → shorter selector — stable public API.

### Verification
- Build: `npm run build:lib`
- Test: `npm test -- command-palette`
- Visual check: `http://localhost:4600/command-palette`
- A11y: `npm run e2e:a11y` (command-palette route)

## Priority
**P2** — Component is high-quality, well-tested, ARIA-compliant, and feature-complete. The single a11y gap (search input `aria-label`) and the orphan `description` input on the declarative API are the only material issues; everything else is polish or doctrinal cleanup. No production blockers.
