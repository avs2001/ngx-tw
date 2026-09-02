# ngx-tw — public API consistency audit (fresh pass, read-only)

Branch `feat/vertical-rhythm`, 2026-09-02. Audited against `.claude/CLAUDE.md` as the normative
spec, cross-checked against `docs/audit-2026-09-register.md`.

**Method.** Every claim below is anchored to `file:line`. I parsed all 233 non-spec `.ts` files in
`projects/ngx-tw/` into a structured index of **798 signal-API members** (674 `input`, 36 `model`,
88 `output`) with their JSDoc, defaults, generics and owning class, then ran mechanical sweeps over
that index plus targeted reads. Confidence markers:

- **[verified]** — I read the source line myself.
- **[inferred]** — derived from the index or from a pattern, not read line-by-line.
- No code was run. Nothing under `projects/`, `e2e/` or `.claude/` was written.

---

## 1. What is already consistent — the bar

A register of only defects misrepresents this codebase. These are load-bearing and they hold:

| Property | Result | Confidence |
|---|---|---|
| **JSDoc coverage on signal API** | **798 / 798** inputs, models and outputs carry a JSDoc block. **Zero** gaps. | [verified] — mechanical sweep over all 233 files |
| **JSDoc states the default** | 620 / 668 non-`required` inputs+models state a default explicitly. The 48 that don't are listed in §2 (LOW-3). | [verified] |
| **`OnPush`** | **78 `@Component(` decorators, 78 `ChangeDetectionStrategy.OnPush`, matched per-file.** No component is missing it. (The register's "61/61" undercounts the true component population by 17 — same conclusion, different denominator.) | [verified] |
| **`Tw*` class prefix rule** | Exactly four `Tw*` classes exist: `TwDateRange` (`calendar/date-range.ts:8`), `TwDialogConfig` (`dialog/dialog-config.ts:30`), `TwDialogRef` (`dialog/dialog-ref.ts:21`), `TwDialog` (`dialog/dialog.ts:45`). **No component or directive class carries the prefix.** The rule holds by the letter. | [verified] |
| **Entry-point registration (top level)** | **56 / 56.** Every component directory has `ng-package.json` with byte-identical `{"lib":{"entryFile":"index.ts"}}`, an `index.ts`, and a matching `export * from '@cdevhub/ngx-tw/<dir>'` line in `src/public-api.ts` (56 lines, zero orphans in either direction). Register claim **independently confirmed**. | [verified] |
| **Exported `tv()` configs** | Exactly **one**: `tabTriggerVariants` (`core/tab-trigger-variants.ts:24`, re-exported `core/index.ts:43`). Every other `tv()` in the library is module-private. | [verified] |
| **Shared type adoption** | 33 components take `color`, 38 take `size`. Of those, **only 5 declarations** use a non-`Tw*` type, and 4 of those 5 are principled widenings/narrowings *derived from* the shared type. | [verified] |
| **Unexported types in signal-API signatures** | **Zero.** Every type named in an `input`/`model`/`output` generic is exported from some entry point. The F1 shape does *not* recur on the signal API. `PromiseMessages` is now exported (`toast/index.ts:1`) — F1 confirmed fixed. | [verified] |
| **Element selectors** | Every component element selector is `tw-*`. No exceptions. | [verified] |
| **`model()` discipline** | 33 of 36 `model()`s are unambiguously correct two-way bindings (`value`, `open`, `checked`, `page`, `pageSize`, `expandedKeys`, `selected`, `query`, `inputValue`, `flipped`, `activeIndex`, `sort.active`/`direction`). See §2 MEDIUM-8 for the three worth a second look. | [verified] |
| **Boolean `true` defaults** | All **30** carry a written justification. The register's "all 17 unlisted ones *do* carry justification" is **confirmed**. See §5. | [verified] |

Also worth stating: `disabledInput` / `requiredInput` / `idInput` / `userAriaDescribedByInput` all
carry `alias:` back to the natural attribute name, so the `*Input` suffix drift in §3 is invisible
in templates. It costs Compodoc readability, not consumer ergonomics.

---

## 2. Findings, by severity

### BLOCKER

None. Nothing here breaks a consumer at runtime or silently corrupts behaviour library-wide.

---

### HIGH

#### H1 — `containerInstance` returns a type the entry point deliberately does not export **[NEW]**

`dialog/dialog-ref.ts:66`
```ts
/** The Tailwind container instance, or `null` until the dialog has attached. */
get containerInstance(): DialogContainer | null {
```
`sheet/sheet-ref.ts:73` — identical shape with `SheetContainer`.

`dialog/index.ts:3-5` says, in a comment:

> `DialogContainer` is the internal render surface — it now lives in the dynamically-imported
> renderer chunk and is **no longer part of the public API**.

…and then a **documented, non-`@internal` public getter on the exported `TwDialogRef`** hands that
exact type back. `sheet/index.ts:3-5` carries the same comment with the same contradiction.

This is precisely the F1 shape the register found by accident: a consumer can *hold* the value but
cannot *name* its type, so they cannot write `const c: DialogContainer = ref.containerInstance`,
store it in a typed field, or write a typed wrapper. Worse than F1, because the index file states
in prose that the type is private while the API keeps handing it out. **[verified]**

**Fix (pick one, apply to both dialog and sheet):** either mark the getter `@internal` and prefix it
`_containerInstance` (matching the `_attach` convention two lines below at `dialog-ref.ts:76`), or
narrow the return type to an exported interface (`DialogState` and `DialogAnimationEvent` are
already exported from the same file, so the pattern exists).

#### H2 — Six components host-bind `[attr.aria-label]` but do **not** alias `aria-label` **[NEW — complement of register F10]**

Register F10 covers the nine components that *do* alias `aria-label` (an `[attr.aria-label]`
binding by the consumer never feeds the input). The **inverse population was not audited** and is
worse, because it breaks the *plain, correct-looking* attribute. Two distinct mechanisms:

**(a) The consumer's attribute is REMOVED.** The host binding evaluates to `null`, and Angular's
`[attr.x]` semantics remove the attribute when the expression is `null`/`undefined`. **[verified]**

| Component | Host binding | Result of `aria-label="Save"` |
|---|---|---|
| `toast/toast-component.ts:139` | `'[attr.aria-label]': 'ariaLabel() \|\| null'` (input defaults `undefined`, `:215`) | attribute **removed** — element left unnamed |
| `carousel/carousel.ts:426` | `'[attr.aria-label]': 'ariaLabel()'` (default `null`, `:522`) | attribute **removed** |
| `carousel/carousel.ts:427` | `'[attr.aria-labelledby]': 'ariaLabelledBy()'` (default `null`, `:525`) | `aria-labelledby` **removed** |

`carousel` is the sharper case: `:521`'s JSDoc says a dev-mode `console.warn` fires when both are
`null` — so the consumer gets *warned* about a missing name they believe they supplied.

**(b) The consumer's attribute is SILENTLY OVERWRITTEN by a fallback.** The binding never resolves
to null, so a wrong name wins. **[verified for the binding; the winning value is [inferred]]**

| Component | Fallback | Result of `aria-label="Save"` |
|---|---|---|
| `flip-card/flip-card.ts:115` → `:209-213` | `'Flip card'` (or `null` when `trigger !== 'manual'`) | **overwritten** with `'Flip card'`, or removed |
| `stat/stat.ts:245` → `:330-338` (`StatDeltaComponent`) | composed "increased … " sentence | **overwritten** with the composed delta sentence |
| `avatar/avatar.ts:245` (`AvatarGroupComponent`, default `'Avatar group'` `:262`) | never null | **overwritten** with `'Avatar group'` |

**Fix (both groups): add `{ alias: 'aria-label' }` to the input** (and `'aria-labelledby'` to
`carousel.ariaLabelledBy`), matching the 17 components that already do. **Do not "fix" group (b) by
deleting the fallback** — the fallbacks at `flip-card.ts:210-211` and `stat.ts:331-332` already
prefer an explicit value over the computed one, so once the alias routes the consumer's attribute
*into* the input, both branches become correct with no other change.

#### H3 — `calendar` strips a consumer-supplied `aria-describedby` **[NEW]**

`calendar/calendar.ts:150`
```
'[attr.aria-describedby]': 'errorAriaDescribedBy() || null',
```
`calendar` is the **only** component in the library that host-binds `aria-describedby` without a
matching aliased input. Every other one — `radio.ts:260,597`, `checkbox.ts:291`, `transfer.ts:389`,
`tags-input.ts:231`, `file-upload.ts:260`, `switch.ts:199` — pairs the binding with
`ariaDescribedby = input(..., { alias: 'aria-describedby' })`. `calendar`'s only related input is
`errorAriaDescribedBy` (`calendar.ts:432`), a **fourth spelling** of the concept, unaliased.
`<tw-calendar aria-describedby="hint-1">` therefore has its description silently removed.
**[verified]**

**Fix:** rename to `ariaDescribedby` with `alias: 'aria-describedby'` and merge the error id inside
the component, exactly as `checkbox`'s `effectiveAriaDescribedby()` does.

#### H4 — `SegmentedControlComponent` is a `ControlValueAccessor` with none of the form-control surface **[NEW]**

`segmented-control/segmented-control.ts:264` — `implements ControlValueAccessor`. Its entire input
surface is `color`, `size`, `variant`, `orientation`, `rounded`, `disabled`, `value` (7).

It has **no** `ariaLabel`, `ariaLabelledby`, `ariaDescribedby`, `errorStateMatcher`, `required`,
`name`, or `id`. CLAUDE.md's form-control exception explicitly names that ARIA+Forms baseline as
"~12 inputs minimum". Every other CVA in the library carries most of it (see the matrix in §3.4).
A `role="radiogroup"`-shaped control with no programmatic name and no error-state integration
cannot be labelled from outside or participate in `TW_ERROR_STATE_MATCHER`. **[verified]**

This compounds register Tier-2's finding that `segmented-control` does not handle Space
(`:293-320`) — the component looks like the least-finished form control in the library.

**Fix:** add the standard six (`ariaLabel`/`ariaLabelledby`/`ariaDescribedby` aliased,
`errorStateMatcher`, `required`, `name`) copying `switch.ts:230-245` verbatim.

#### H5 — The overlay family gives seven different answers to "how do I control dismissal?" **[NEW]**

See the drift table §3.1 row 1 for the full matrix. The sharpest instance:

`select/select.ts:513` — `readonly closeOnSelect = input<boolean | undefined>(undefined);`
`command-palette/command-palette.ts:423` — `readonly closeOnSelect = input<boolean>(true);`

Two components, an **identically named input**, different type and different default semantics
(`select` resolves `undefined` → `true` for single / `false` for multi at `:743`). A consumer who
learns `[closeOnSelect]` on one and reads `false` back from the other's default will guess wrong.
`combobox` and `tooltip` have no close-behaviour inputs at all; `dialog` exposes only
`disableClose` while `sheet` exposes `disableClose` **plus** `closeOnEscape` **plus**
`closeOnBackdropClick` (`sheet/sheet-config.ts:76,85,91` vs `dialog/dialog-config.ts:59`).
**[verified]**

**Fix:** the cheapest high-value step is to bring `DialogConfig` to parity with `SheetConfig`
(`closeOnEscape`, `closeOnBackdropClick`), and to make `select.closeOnSelect` a plain
`input<boolean>` with a documented multi-select carve-out, or rename it to signal the tri-state.

#### H6 — `dialog` and `sheet` are the same component shape under three different naming schemes **[NEW]**

| Role | dialog | sheet | toast |
|---|---|---|---|
| service | `TwDialog` (`dialog/dialog.ts:45`) | `Sheet` (`sheet/sheet.ts:45`) | `ToastService` (`toast/toast.ts:59`) |
| ref | `TwDialogRef` | `SheetRef` | `ToastRef` |
| config | `TwDialogConfig` | `SheetConfig` | `ToastConfig` |
| container | `DialogContainer` | `SheetContainer` | `ToastContainerComponent` |
| size type | `TwDialogSize` | `SheetSize` | — |
| "biggest" size member | `'fullscreen'` | `'full'` | — |

Three imperative overlay services, three conventions: `Tw`-prefix-no-suffix, bare noun,
`Service`-suffix. `Sheet` in particular is an extremely generic identifier for a top-level export.
And the two size types are structurally identical up to the last member, which is spelled
differently in each (`dialog/dialog-config.ts:10` vs `sheet/sheet-config.ts:19`). **[verified]**

The register (Tier 4 #6) notes the `Tw*` classes exist but frames it only as "not violations by the
letter" — it does not record that the *sibling* family diverges. That is the consumer-visible half.

**Fix:** this is a policy call (breaking rename), but at minimum align `SheetSize`'s `'full'` with
`TwDialogSize`'s `'fullscreen'` and record the service-naming decision in CLAUDE.md so the next
overlay service does not invent a fourth scheme.

---

### MEDIUM

#### M1 — `date-range-picker`'s own value type is not nameable from its entry point **[NEW]**

`date-picker/index.ts:3-16` deliberately re-exports four types it does not own — `TimePickerFormat`,
`CalendarViewState`, `DateFilterFn`, `DateClassFn` — so a consumer of
`@cdevhub/ngx-tw/date-picker` can name every type in the component's signature from one import.

`date-range-picker/index.ts:2-10` exports **only its own** seven types. But
`DateRangePickerComponent` (`date-range-picker.ts:384`) has inputs and a model typed
`TwDateRange<D>` (`:544`), `DateFilterFn` (`:400`), `CalendarViewState` (`:403`),
`RangeBehaviorConfig` (`:465`), `RangeClickBehavior` (`:468`), `DateClassFn` (`:477`),
`CalendarCell` (`:480`), `TimePickerFormat` (`:489`). **None** is reachable from
`@cdevhub/ngx-tw/date-range-picker`; a consumer must also import `@cdevhub/ngx-tw/calendar` and
`@cdevhub/ngx-tw/core` just to declare `myRange: TwDateRange<Date> | null`. **[verified]**

**Fix:** mirror `date-picker/index.ts` — add the eight re-exports. Two-line change, removes a
guaranteed papercut on the library's most complex component.

#### M2 — Two public methods take a file-private type **[NEW]**

- `command-palette/command-palette.ts:656` `selectItem(item: ResolvedItem): void` and `:665`
  `setActiveItem(item: ResolvedItem): void`. `ResolvedItem` is a **non-exported** interface at
  `command-palette.ts:51`. Both sit under a `// ── Internal wiring (used by overlay) ──` banner at
  `:652` but carry ordinary JSDoc, not `@internal` — so Compodoc publishes them as public API with
  an unresolvable parameter type. **[verified]**
- `slider/slider.ts:816` `onThumbPointerDown(event: PointerEvent, thumb: ThumbId)` and `:864`
  `onThumbKeyDown(...)`. `ThumbId` is `type ThumbId = 'single' | 'start' | 'end'` at `slider.ts:66`,
  **not exported**. **[verified]**

**Fix:** add `/** @internal */` to all four (both files already use that marker elsewhere — e.g.
`combobox/combobox.ts:194,197,209`), or export the types.

#### M2b — `<tw-icon aria-label="…">` leaves the glyph hidden **[NEW — related to H2, different mechanism]**

`icon/icon.ts` is **not** an H2 case: it has no host `[attr.aria-label]` binding at all, so a
consumer's attribute is neither removed nor overwritten — it simply lands on the host and does
nothing useful. The label is applied to the generated `<svg>` via `Renderer2`:

`icon/icon.ts:233-236`
```ts
if (label) { renderer.setAttribute(svg, 'role', 'img');
             renderer.setAttribute(svg, 'aria-label', label); }
else       { renderer.setAttribute(svg, 'aria-hidden', 'true'); }
```
With `ariaLabel` unset (because the consumer wrote the attribute, not the input), the else branch
runs: the SVG is explicitly `aria-hidden`, sitting inside a role-less `<tw-icon>` host that now
carries a stray `aria-label`. The net outcome is an unlabelled, hidden icon that *looks* labelled
in the DOM inspector. `icon.ts:85`'s own usage example writes `ariaLabel="Warning"` — a property
spelling used nowhere else in the library's public examples. **[verified]**

**Fix:** `readonly ariaLabel = input<string>(undefined, { alias: 'aria-label' });` — same one-line
change as H2, but list it separately so a reviewer checking `icon` first and finding nothing
stripped does not dismiss H2's table.

#### M3 — `[tw-sort-header]` is the only kebab-case attribute selector in the library **[NEW]**

`sort/sort-header.ts:140` — `selector: '[tw-sort-header]'`.

Every other attribute directive in the library uses `twCamelCase`: `[twSort]`, `[twMenuItem]`,
`[twCardHeader]`, `[twSplitGutter]`, … — **125 `[tw…]` attribute selector tokens** across the
library, and this is the sole kebab-case one. CLAUDE.md: *"attribute selectors keep the
`tw` camelCase prefix (`twBadge`)"*. This is almost certainly a carry-over from Material's
`[mat-sort-header]`. It also breaks the pairing with its own sibling `[twSort]` (`sort/sort.ts`).
**[verified]**

Second, milder instance: `paginator/paginator.ts:438` `PaginatorFocusableDirective` uses
`'[data-tw-paginator-focusable]'` — a data-attribute selector with no camelCase `tw` prefix. It is
exported from `paginator/index.ts`, so it is public surface.

**Fix:** `[twSortHeader]` with `[tw-sort-header]` kept as a deprecated alias in the same selector
string (`'[twSortHeader], [tw-sort-header]'`) for one minor version.

#### M4 — `ProgressBarSize` and `TwDialogSize`/`SheetSize` hand-copy the `TwSize` literals **[NEW]**

`progress-bar/progress-bar.ts:36` — `export type ProgressBarSize = 'sm' | 'md' | 'lg';`

The library already has an idiom for narrowing the shared scale: `item/item.ts:19`
`export type ItemSize = Extract<TwSize, 'sm' | 'md' | 'lg'>;` — the *identical* narrowing, derived.
`ProgressBarSize` re-types the literals by hand, so a change to `TwSize` will not surface here.
Same shape at `dialog/dialog-config.ts:10` (`'xs'|'sm'|'md'|'lg'|'xl'|'fullscreen'`, should be
`TwSize | 'fullscreen'`) and `sheet/sheet-config.ts:19`. Compare the correct widenings:
`spinner/spinner.ts:14,17` (`TwColor | 'current'`, `TwSize | 'inherit'`) and
`icon/icon.types.ts:13` (`TwColor | 'current'`). **[verified]**

**Verdict per CLAUDE.md's "must use the shared types":** `SpinnerColor`, `SpinnerSize`,
`TwIconColor`, `ItemSize` are **legitimate** (derived). `ProgressBarSize`, `TwDialogSize`,
`SheetSize` are **drift** — mechanically equal today, structurally decoupled.

**Fix:** `export type ProgressBarSize = Extract<TwSize, 'sm' | 'md' | 'lg'>;` and
`export type TwDialogSize = TwSize | 'fullscreen';`. Zero behaviour change.

#### M5 — `carousel` is 16 inputs and fits none of the five codified exceptions **[NEW]**

`carousel/carousel.ts:479` — `CarouselComponent` has **15 inputs + 1 model = 16**, against a
default cap of 5–6. It is not overlay-bearing, not a form control, not a structural-layout
primitive, not a data primitive, and the navigation-primitive exception is written specifically
about pagination ("boundary/sibling counts, … page-size selector"). See §2 LOW-1 for the full
over-cap census. **[verified]**

**Fix:** either fold the four autoplay knobs (`autoplay`, `autoplayInterval`, `pauseOnHover`,
`pauseOnFocusIn` at `:501-507`) and the three layout knobs (`slidesPerView`, `slidesToScroll`,
`gap`) into config objects — the `ProgressBarOptions` / `RangeBehaviorConfig` pattern already
exists in the library — or add a sixth codified exception for media/gallery primitives.

#### M6 — `badge` (7 inputs) is a visual primitive over the cap **[NEW]**

`badge/badge.ts:205` — `variant`, `color`, `size`, `pill`, `dismissible`, `dismissLabel`, `live`
= 7 inputs + 1 output, against the 5–6 cap. CLAUDE.md is explicit: *"Visual primitives (avatar,
icon) … do **not** qualify — reshape with config objects."* `avatar` and `icon` both sit at exactly
6; `badge` is the one visual primitive that crossed. **[verified]**

**Fix:** `pill` is a `variant` value in disguise (`variant: 'solid' | 'outline' | 'pill'`), or fold
`dismissible` + `dismissLabel` + `live` into one `dismiss` config object.

#### M7 — Three comments cite a `<tw-input>` clear button that does not exist **[NEW, F4-shaped]**

`time-picker/time-picker.ts:576`
> `// TRUE-default: matches <tw-date-picker> and <tw-input> clear behaviour; …`

`date-picker/date-picker.ts:498` and `date-range-picker/date-range-picker.ts:453`
> `// TRUE-default: … most form pickers expect the inline clear, matching <tw-input>'s clear button.`

`grep -rn "clearable\|showClear\|clearButton" input/ form-field/` returns **nothing**.
`InputDirective` (`input/input.ts:185`) has no clear affordance and neither does `form-field`.
These three comments justify a `true` default by appeal to a sibling behaviour that was never
built. Same class as register F4: a maintainer reading them would draw a false conclusion about
the library's conventions. **[verified]**

**Fix:** drop the `<tw-input>` clause from all three, or build the input clear button (which would
also close the `select` gap in §3.1 row 2).

#### M8 — `model()` usage: three worth a second look, 33 correct **[NEW]**

Of 36 `model()`s, 33 are unambiguously two-way state the parent owns. The three to examine:

- `code-block/code-block.ts:163` `isCopied = model(false)` — the JSDoc explicitly documents
  `[(isCopied)]` and the auto-reset, so this is **defensible**, but the component also exposes a
  `copied` output at `:157`. Two members for one concept, and the `is*` prefix is the only one in
  the library's input surface besides `tabs.ts:210 isActive` / `:213 isDisabled` and
  `paginator.ts:442 isDisabled`. CLAUDE.md says adjectives (`disabled`, `selected`), not `is*`.
  **[verified]**
- `calendar/calendar-form-directives.ts:103,154,205` `touched = model<boolean>(false)` ×3 — these
  are signal-forms bridge directives that call `wireSignalFormsInputs`; the field's touched flag
  genuinely round-trips. **Correct as written**, recorded only so it is not re-investigated.
  **[verified]**

No case of `input()` where a two-way binding is clearly needed was found.

---

### LOW

#### L1 — Full over-cap census (input+model counts) **[NEW — the register only covered `table`]**

| Class | count | Exception claimed | Verdict |
|---|---|---|---|
| `DateRangePickerComponent` `date-range-picker.ts:384` | **48** | overlay-bearing | valid, but 48 is 2.5× the next-widest overlay |
| `DatePickerComponent` `date-picker.ts:435` | 37 | overlay-bearing | valid |
| `ComboboxComponent` `combobox.ts:354` | 26 | overlay-bearing | valid |
| `SliderComponent` `slider.ts:404` | **24** | form control | valid; 2× the `checkbox` canonical (16) |
| `TimePickerComponent` `time-picker.ts:506` | 24 | overlay-bearing | valid |
| `SelectComponent` `select.ts:451` | 22 | overlay-bearing | valid |
| `CalendarComponent` `calendar.ts:290` | 20 | overlay/form | valid |
| `PaginatorComponent` `paginator.ts:475` | 19 | navigation primitive | valid (codified) |
| `TagsInputComponent` `tags-input.ts:241` | 18 | form control | valid |
| `FileUploadComponent` `file-upload.ts:269` | 17 | form control | valid |
| **`CarouselComponent` `carousel.ts:479`** | **16** | **none** | **see M5** |
| `CheckboxComponent` `checkbox.ts:275` | 16 | form control | valid (canonical) |
| `PopoverDirective` `popover.ts:326` | 16 | overlay-bearing | valid |
| `RadioComponent` `radio.ts:240` | 14 | form control | valid |
| **`TableComponent` `table.ts:829`** | **14** (12 input + 2 model) | data primitive — **self-expired** | **KNOWN**, register Tier 4 #2. My count is 14, not 12; the register counted inputs only. |
| `CommandPaletteComponent` | 13 | overlay-bearing | valid |
| `SwitchComponent` | 13 | form control | valid |
| `TransferComponent` | 12 | form control | valid |
| `RadioGroupComponent` | 12 | form control | valid |
| `CalendarViewBase` `calendar-view-base.ts:34` | 11 | calendar family (abstract base) | valid |
| `TooltipDirective` | 9 | overlay-bearing | valid |
| `SplitComponent` (8) / `SplitPaneComponent` (7) | 8 / 7 | structural-layout | valid (codified) |
| `SortHeaderComponent` `sort-header.ts:153` | 8 | — | data-primitive-adjacent; **not codified** |
| `TabNavComponent` `tab-nav.ts:106` | 8 | — | navigation-adjacent; **not codified** |
| `CalendarHeaderComponent` (7), `CalendarSingle/Multiple/RangeDirective` (8 each) | 7–8 | calendar family | valid |
| **`BadgeComponent` `badge.ts:205`** | **7** | **none — visual primitive** | **see M6** |
| `FormFieldComponent` (7), `InputDirective` (7), `ColumnComponent` (7), `CommandPaletteItemDirective` (7), `SegmentedControlComponent` (7) | 7 | form/data/overlay | valid |

`AvatarComponent`, `IconComponent`, `ProgressBarComponent` all sit at exactly **6** — the three
components CLAUDE.md names as ineligible are the three that comply. Good.

#### L2 — `SheetSize`/`TwDialogSize` "biggest member" spelling — see H6. **[NEW]**

#### L3 — 48 optional inputs whose JSDoc omits the default **[partially KNOWN — register F15]**

The register's F15 says 126 missing defaults were completed. 48 remain, all defaulting to
`undefined` or a trivial empty value. The inconsistency is what matters: `accordion.ts:95`
documents "Defaults to `undefined`" for `ariaLabel` while `checkbox.ts:298` (`description`) does
not, in the same paragraph of the same style guide. **[verified]**

Worst offenders by count: `radio.ts` (5: `:260,266,281,600,615`), `checkbox.ts` (4:
`:298,304,307,319`), `slider.ts` (4: `:445,448,454,481`), `switch.ts` (3: `:224,230,245`),
`file-upload.ts` (3: `:328,331,334`), `date-range-picker.ts` (3: `:391,421,528`),
`sort-header.ts` (3: `:155,158,161`), `combobox.ts` (2 — of which `:461`
`inputValue = model<string>('')` defaults to `''`, **not** `undefined`, so the omission is
substantive), `code-block.ts:141` `language = input<string>()`, `icon.ts:129` `svg`.

`errorStateMatcher` accounts for 14 of the 48 across every form control — a single copy-paste fix.

No JSDoc block was found that describes the TypeScript type instead of the behaviour. That
particular anti-pattern is absent. **[verified]**

#### L4 — Three nested secondary entry points are absent from the root barrel **[NEW]**

`find . -name ng-package.json` returns **60** (1 root + 59 secondary). The root `public-api.ts`
lists 56. The three unlisted are `calendar/luxon`, `calendar/testing`, `icon/lucide` — each has
its own `ng-package.json` + `index.ts` and is importable as `@cdevhub/ngx-tw/calendar/luxon` etc.
(`verify:package`'s "59 entry points" in the register's hand-off table corroborates the count.)

Excluding them is **defensible** — pulling `luxon` or a test harness into the root barrel would
force every root-barrel consumer to resolve those optional deps. But CLAUDE.md line 78 says
"Root `public-api.ts` re-exports **all** entry points", which is now false, and the register's
"56/56" is right about the top level while understating the total. **[verified]**

**Fix:** amend CLAUDE.md to "re-exports all *component* entry points; optional-peer and testing
entry points (`calendar/luxon`, `calendar/testing`, `icon/lucide`) are deliberately excluded".

#### L5 — `tabTriggerVariants` exported from `core` **[KNOWN — register Tier 4 #3]**

Confirmed at `core/tab-trigger-variants.ts:24` / `core/index.ts:43`. **I additionally verified it
is the only one** — no other `tv()` config anywhere in the library is exported. So the carve-out,
if granted, is a single documented exception rather than an eroding rule. **[verified]**

#### L6 — Selector/class-name mismatches **[NEW, cosmetic]**

- `menu/menu.ts:438` `MenuItemSubmenuIndicatorDirective` ↔ selector `[twMenuItemSubmenuIcon]`
  ("Indicator" vs "Icon").
- `calendar/multi-year-view.ts:54` `YearsViewComponent` ↔ selector `tw-calendar-years-view`, in a
  file named `multi-year-view.ts`. Three names for one thing.
- `segmented-control/segmented-control.ts:174` `SegmentedControlOptionComponent` ↔ selector
  `tw-segmented-option`. Every other child element selector keeps the full parent prefix
  (`tw-split-pane`, `tw-stat-delta`, `tw-command-palette-item`, `tw-carousel-slide`); this one
  drops `-control`.
- `tab-nav/tab-nav.ts:85` `TabNavPanel` — the only component/directive class in the library with no
  `Component`/`Directive` suffix. **[verified]**

---

## 3. Cross-component naming-drift table

The **Visible in** column is the triage key: *template* drift is a consumer-facing defect;
*Compodoc/`setInput`* drift only costs documentation quality.

### 3.1 The overlay-bearing family

| Concept | popover | tooltip | dialog | sheet | menu | select | combobox | command-palette | date-picker | date-range-picker | time-picker | Visible in |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **close on Escape** | `twPopoverCloseOnEscape`=`true` `popover.ts:366` | — | — (only `disableClose` `dialog-config.ts:59`) | `closeOnEscape`=`true` `sheet-config.ts:76` | — | — | — | `closeOnEscape`=`true` `cp.ts:426` | — | — | — | **template** |
| **close on outside click** | `twPopoverCloseOnOutside`=`true` `:361` | — | — | `closeOnBackdropClick`=`true` `sheet-config.ts:85` | — | — | — | `closeOnBackdropClick`=`true` `cp.ts:429` | — | — | — | **template** |
| **close after choosing** | — | — | — | — | — | `closeOnSelect` **`boolean\|undefined`**=`undefined` `select.ts:513` | — | `closeOnSelect` **`boolean`**=`true` `cp.ts:423` | — | — | — | **template** |
| **inline clear affordance** | — | — | — | — | — | **none — hard-wired `computed()` `select.ts:711`** | `clearable`=`true` `combobox.ts:406` | — | `showClear`=`true` `dp.ts:497` | `showClear`=`true` `drp.ts:452` | `showClear`=`true` `tp.ts:575` | **template** |
| **opened/closed events** | `twPopoverOpened`/`twPopoverClosed` `:389,392` | `twTooltipShown`/`twTooltipHidden` `:356,359` | — | — | — | `openedChange` `select.ts:550` | `openedChange` `combobox.ts:478` | `opened`/`closed` `cp.ts:447,450` | `opened`/`closed` `dp.ts:573,576` | `opened`/`closed` `drp.ts:552,555` | — | **template** |
| **two-way open state** | `twPopoverOpen` model `:342` | — | — | — | — | `open` model `:545` | `open` model `:464` | `open` model `:414` | `open` model `:568` | `open` model `:547` | — | **template** |
| **panel class** | `twPopoverPanelClass` `:380` | `twTooltipPanelClass` `:352` | via config | via config | — | `panelClass` | `panelClass` | `panelClass` | `panelClass` | `panelClass` | — | template (prefix is by directive convention — OK) |
| **arrow** | `twPopoverArrow`=`true` `:353` | `twTooltipArrow`=`true` `:350` | — | — | — | — | — | — | — | — | — | consistent |

**Reading:** four different vocabularies for "the overlay opened" (`*Opened`/`*Shown`,
`openedChange`, `opened`) and three for "clear the value" (`clearable`, `showClear`, none).
A consumer who learns `combobox` cannot guess `select`.

### 3.2 State / value concepts across the whole library

| Concept | Names in use | Where | Visible in |
|---|---|---|---|
| disabled | `disabled` (26 classes) · `disabledInput` (9, **aliased to `disabled`**) · `isDisabled` (2) | `paginator.ts:442`, `tabs.ts:213` for `isDisabled` | Compodoc only for `*Input`; **template** for `isDisabled` |
| required | `required` (6) · `requiredInput` (10, **aliased to `required`**) | `switch`/`slider`/`radio-group` vs the rest | Compodoc only |
| readonly | `readonly` (4) · `readonlyInput` (3, aliased) · `readonlyGrid` (1, `calendar-view-base.ts`) | — | Compodoc only |
| element id | `id` (8) · `idInput` (8, aliased to `id`) · `linkId` (1, `tab-nav.ts`) | — | Compodoc only |
| accessible name | `ariaLabel` **aliased** (17) · `ariaLabel` **not aliased** (7 — see H2) · `twPopoverAriaLabel` · `triggerAriaLabel` (`date-picker.ts:527`) · `searchAriaLabel` (`cp.ts:438`) · `customAriaLabel` (`paginator.ts:542`) · `clearAriaLabel` (`date-range-picker.ts:525`) | — | **template** (H2) |
| labelled-by | `ariaLabelledby` (15) · `ariaLabelledBy` (2: `menu.ts:175` **aliased**, `carousel.ts:525` **not**) | — | Compodoc for `menu`; **template** for `carousel` |
| described-by | `ariaDescribedby` (10, aliased) · `userAriaDescribedByInput` (3, aliased) · `errorAriaDescribedBy` (1, **not** aliased — H3) | `date-picker.ts:561`, `calendar.ts:432` | Compodoc for the first two; **template** for `calendar` |
| "copied/active/disabled" adjectives | `isCopied` model, `isActive`, `isDisabled` — the only `is*` names in a library that otherwise uses bare adjectives | `code-block.ts:163`, `tabs.ts:210,213`, `paginator.ts:442` | **template** |
| show/hide polarity | `showFirstLastButtons`, `showPageInfo`, `showPageSizeSelector` **vs** `hideOnEmpty`, `hideOnSinglePage` — mixed polarity **inside one component** | `paginator.ts:508,511,519,524,527` + `hideRequiredMarker` `form-field.ts:479` | **template** |
| negated boolean | `disableClear` (`sort-header.ts:161`, `sort.ts`) — a `disable*` boolean where CLAUDE.md prescribes positive adjectives | — | **template** |
| collapse events | `collapseChange` (`split.ts:150`) **vs** `collapsedChange` (`split-pane.ts:60`) — **same entry point** | — | **template** |
| expansion events | `expandedChange` (`tree.ts:264`) **vs** `expansionChange` (`table.ts:894`) | — | **template** |
| selection events | `selectionChange` (select/table/tree) · `optionSelected` (`combobox.ts:472`) · `itemSelected` (`cp.ts:444`) · `selected` (`item.ts:166`) · `moved` (`transfer.ts:580`) | — | **template** |
| value events | `valueChange` (number-input/tags-input/transfer) · `valueCommit` (`combobox.ts:475`) · `valueInput` (`slider.ts:475`) · `change` (checkbox/radio/radio-group/slider/switch) | — | **template** |
| committed vs live value | `dateInput`+`dateChange` (`dp.ts:579,582`) · `timeInput`+`timeChange` (`tp.ts:602,605`) · **`rangeChange` only** — `date-range-picker` has no `rangeInput` counterpart | — | **template** |
| labels bag | `labels` `Partial<…>` on 6 components (carousel, code-block, paginator, tab-nav, table, transfer) — **consistent** ✓ | — | — |
| single-label i18n | `applyLabel`/`cancelLabel`/`clearLabel`/`todayLabel` on the pickers **vs** the `labels` bag elsewhere | `dp.ts`, `drp.ts`, `tp.ts` | **template** |
| dismiss text | `dismissLabel` (alert, badge) — consistent ✓; `toast` uses `dismissible` only | — | — |

### 3.3 `change` as an output name

`checkbox.ts:328`, `radio.ts:284`, `radio.ts:618`, `slider.ts:478`, `switch.ts:248` each declare
`change = output<...>()` **alongside** a `checked`/`value` `model()` that already auto-generates
`checkedChange`/`valueChange`. `change` is neither Angular's `propertyChange` pattern nor past
tense, and it shadows the native DOM `change` event name on components that host a native input.
`menu` solves the same problem with `checkedChange` (`menu.ts:299,359`). **[verified]**

Not necessarily wrong — mirroring `MatCheckboxChange` is a defensible Material affordance — but it
is undocumented in CLAUDE.md's outputs rule and it is the single most-repeated exception to it.

### 3.4 Form-control baseline matrix

`Y` = the control declares this input. Built mechanically from the parsed index. **[verified]**

| control | label | description | required* | disabled* | labelPosition | aria-label | aria-labelledby | aria-describedby | name | id* | errorStateMatcher | placeholder |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `CheckboxComponent` | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | . |
| `RadioComponent` | Y | Y | . | Y | Y | Y | Y | Y | Y | . | Y | . |
| `RadioGroupComponent` | . | . | Y | Y | . | Y | Y | Y | Y | . | Y | . |
| `SwitchComponent` | Y | Y | Y | Y | Y | Y | Y | Y | Y | . | Y | . |
| `SliderComponent` | Y | Y | Y | Y | **.** | Y | Y | Y | Y | **.** | Y | . |
| `SelectComponent` | . | **.** | Y | Y | . | Y | Y | Y | **.** | **.** | Y | Y |
| `ComboboxComponent` | . | . | Y | Y | . | Y | Y | Y | . | . | Y | Y |
| `InputDirective` | . | . | Y | Y | . | **.** | **.** | **.** | . | Y | Y | . |
| `TagsInputComponent` | . | . | Y | Y | . | Y | Y | Y | Y | Y | Y | Y |
| `FileUploadComponent` | Y | Y | Y | Y | . | Y | Y | Y | Y | Y | Y | . |
| `TransferComponent` | . | . | Y | Y | . | Y | Y | Y | Y | Y | Y | . |
| `DatePickerComponent` | . | . | Y | Y | . | Y | Y | *(`userAriaDescribedByInput`)* | . | Y | Y | Y |
| `DateRangePickerComponent` | . | . | Y | Y | . | Y | Y | *(same)* | . | Y | Y | Y |
| `TimePickerComponent` | . | . | Y | Y | . | Y | Y | *(same)* | . | Y | Y | Y |
| **`SegmentedControlComponent`** | **.** | **.** | **.** | Y | **.** | **.** | **.** | **.** | **.** | **.** | **.** | . |
| `CalendarComponent` | . | . | . | Y | . | **.** | **.** | *(`errorAriaDescribedBy`)* | . | . | **.** | . |
| `NumberInputDirective` | . | . | . | . | . | . | . | . | . | . | . | . |

\* `required`/`disabled`/`id` columns collapse the aliased `requiredInput`/`disabledInput`/`idInput`
spellings, since the template contract is identical.

**Gaps worth deciding on:** `SegmentedControlComponent` (H4). `CalendarComponent` has no
`errorStateMatcher` despite being an `NG_VALIDATORS` control. `SliderComponent` has `label` +
`description` but no `labelPosition`, unlike the other three label-bearing selection controls.
`InputDirective` has no aria-* inputs at all — arguably correct, since it is a directive on a
native `<input>` where the consumer writes the attributes directly; worth an explicit JSDoc note so
it does not read as an omission. `NumberInputDirective` (`number-input.ts:71`,
`implements ControlValueAccessor`) carries none of the baseline — [inferred] that it is intended to
be composed with `[twInput]` on the same element, but nothing in its JSDoc says so.

---

## 4. Full enumeration: boolean inputs defaulting to `true`

**30 in code.** All 30 carry a justification. **Verified independently.**

First, a correction of the brief: CLAUDE.md's allow-list has **13** entries, not 17
(`spinner.track`, `accordion.collapsible`, `calendar.bordered`, four `commandPalette.*`, four
`popover.*`, two `timePicker.*`; the parenthetical about `RangeBehaviorConfig` at line 438 is not a
list entry). 30 − 13 = **17 unlisted**, which is exactly what the register said. The register was
right; the task brief's "17 codified" is the mis-paraphrase.

**J** = justification lives inside the `/** … */` block (Compodoc-visible).
**//** = justification lives in a `//` comment adjacent to the input (Compodoc-**invisible**).

| # | Input | Anchor | In CLAUDE.md list? | Justification style |
|---|---|---|---|---|
| 1 | `AccordionComponent.collapsible` | `accordion/accordion.ts:92` | ✅ | **J** |
| 2 | `CalendarHeaderComponent.canSwitchView` | `calendar/calendar-header.ts:119` | ❌ | `//` (`:116-118`) |
| 3 | `CalendarComponent.bordered` | `calendar/calendar.ts:447` | ✅ | `//` (`:445-446`) |
| 4 | `CarouselComponent.pauseOnHover` | `carousel/carousel.ts:504` | ❌ | **J** |
| 5 | `CarouselComponent.pauseOnFocusIn` | `carousel/carousel.ts:507` | ❌ | **J** (cites WCAG 2.2.2) |
| 6 | `CarouselComponent.draggable` | `carousel/carousel.ts:510` | ❌ | **J** |
| 7 | `CarouselComponent.keyboard` | `carousel/carousel.ts:513` | ❌ | **J** |
| 8 | `ComboboxComponent.showChevron` | `combobox/combobox.ts:401` | ❌ | `//` (`:399-400`) |
| 9 | `ComboboxComponent.clearable` | `combobox/combobox.ts:406` | ❌ | `//` (`:404-405`) |
| 10 | `ComboboxComponent.openOnFocus` | `combobox/combobox.ts:420` | ❌ | `//` (`:418-419`) |
| 11 | `CommandPaletteComponent.closeOnSelect` | `command-palette/command-palette.ts:423` | ✅ | **J** |
| 12 | `CommandPaletteComponent.closeOnEscape` | `command-palette/command-palette.ts:426` | ✅ | **J** |
| 13 | `CommandPaletteComponent.closeOnBackdropClick` | `command-palette/command-palette.ts:429` | ✅ | **J** |
| 14 | `CommandPaletteComponent.autoFocus` | `command-palette/command-palette.ts:432` | ✅ | **J** |
| 15 | `DatePickerComponent.showClear` | `date-picker/date-picker.ts:497` | ❌ | `//` (`:496`) — **and factually wrong, see M7** |
| 16 | `DateRangePickerComponent.showClear` | `date-range-picker/date-range-picker.ts:452` | ❌ | `//` (`:451`) — **same error** |
| 17 | `PaginatorComponent.showFirstLastButtons` | `paginator/paginator.ts:508` | ❌ | `//` (`:506-507`) |
| 18 | `PaginatorComponent.showPageInfo` | `paginator/paginator.ts:519` | ❌ | `//` (`:517-518`) |
| 19 | `PaginatorComponent.hideOnEmpty` | `paginator/paginator.ts:524` | ❌ | `//` (`:522-523`) |
| 20 | `PopoverDirective.twPopoverArrow` | `popover/popover.ts:353` | ✅ | `//` (`:350-351`) |
| 21 | `PopoverDirective.twPopoverCloseOnOutside` | `popover/popover.ts:361` | ✅ | `//` (`:359-360`) |
| 22 | `PopoverDirective.twPopoverCloseOnEscape` | `popover/popover.ts:366` | ✅ | `//` (`:364-365`) |
| 23 | `PopoverDirective.twPopoverTrapFocus` | `popover/popover.ts:374` | ✅ | `//` (`:372-373`) |
| 24 | `SpinnerComponent.track` | `spinner/spinner.ts:139` | ✅ | **J** |
| 25 | `StepperComponent.showError` | `stepper/stepper.ts:327` | ❌ | `//` (`:325-326`) |
| 26 | `StepperComponent.headerInteractive` | `stepper/stepper.ts:332` | ❌ | `//` (`:330-331`) |
| 27 | `TimePickerComponent.showSteppers` | `time-picker/time-picker.ts:571` | ✅ | `//` (`:570`) |
| 28 | `TimePickerComponent.showClear` | `time-picker/time-picker.ts:575` | ✅ | `//` (`:574`) — **factually wrong, see M7** |
| 29 | `ToastComponent.dismissible` | `toast/toast-component.ts:203` | ❌ | `//` (`:200-201`, **placed above** the JSDoc) |
| 30 | `TooltipDirective.twTooltipArrow` | `tooltip/tooltip.ts:350` | ❌ | `//` (`:346-348`, **placed above** the JSDoc) |

**Tallies:**
- Compodoc-visible justification (**J**): **10 of 30** — accordion, carousel ×4, command-palette ×4, spinner.
- `//` only: **20 of 30**. (The register's "12 of 17 use `//`" was scoped to the unlisted subset; my
  20/30 is the whole population. Within the *unlisted* 17 I count 12 `//` — so the register's number
  is right for its scope.)
- Comment **placement** is itself inconsistent: 18 put the `//` block *below* the JSDoc, 2
  (`toast-component.ts:200`, `tooltip.ts:346`) put it *above*. No rule exists either way.
- **Recommendation:** move all 20 justifications inside the JSDoc block. It is a pure text move,
  it makes 20 currently-invisible rationales appear in the demo's API tables, and it removes the
  spec's two-way ambiguity (CLAUDE.md:433 says "inline JSDoc comment"; CLAUDE.md:451 says
  "inline-comment"). Then either extend the allow-list to all 30 or restate it as illustrative.

**Not counted above — 11 boolean `true` defaults on config classes** (outside the `input()`
population, so no prior audit has enumerated them). Worth a policy decision on whether the rule
reaches them: `toast/toast-config.ts:72` `dismissible`, `:103` `pauseOnInteraction`, `:108`
`swipeToDismiss`; `sheet/sheet-config.ts:76` `closeOnEscape`, `:85` `closeOnBackdropClick`;
plus six CDK `override`s whose `true` default is inherited, not chosen
(`dialog-config.ts:56,68,71`, `sheet-config.ts:64,67,94`). The two library-authored `sheet` ones
carry JSDoc justification; the three `toast` ones carry JSDoc. **[verified]**

---

## 5. What I could NOT verify without running code

1. **Whether Compodoc actually drops `//` comments.** I am asserting it from the tool's documented
   behaviour (it parses JSDoc via TypeScript's AST comment ranges attached as JSDoc nodes) and from
   CLAUDE.md's own framing at line 56. I did not build the docs. **[inferred]**
2. **Attribute removal vs overwrite.** For H2 group (a) (`toast-component.ts:139`,
   `carousel.ts:426-427`) and H3 (`calendar.ts:150`) the null-coalesce is literally in the binding
   string and Angular's documented `[attr.x]`-removal-on-null semantics settle it — I am recording
   these as **[verified]**, not inferred. For H2 group (b) (`flip-card`, `stat-delta`,
   `avatar-group`) I read the fallback `computed()` but did not observe which string reaches the
   DOM; that half is **[inferred]**. Neither was reproduced in a browser.
3. **Whether `NumberInputDirective` is meant to be composed with `[twInput]`.** Nothing in its
   JSDoc or selector says so; I did not read the demo pages. **[inferred]**
4. **Whether the 48 missing-default JSDoc gaps produce visibly blank cells** — depends on whether
   Compodoc renders a synthesised default from the initializer. Not checked.
5. **Whether renaming `[tw-sort-header]` would break the demo or e2e suites.** I did not grep
   `projects/demo/` or `e2e/` (out of scope, and other agents are editing there).
6. **Input-count exception assignments in L1** are my reading of which codified exception each
   component claims; CLAUDE.md names canonical examples, not an exhaustive mapping, so the
   "valid/invalid" verdicts for `sort-header`, `tab-nav` and `transfer` are judgement calls, not
   mechanical results. **[inferred]**
7. **Nothing in this audit was type-checked or built.** Every suggested fix is a source-level
   reading; the `dist/`-based path alias documented in CLAUDE.md means cross-entry-point edits
   (M1, M4) need a rebuild before `tsc` tells the truth about them.

---

## Appendix — KNOWN vs NEW summary

| ID | Finding | KNOWN / NEW |
|---|---|---|
| H1 | `containerInstance` leaks `DialogContainer`/`SheetContainer` | **NEW** (F1-shaped) |
| H2 | 6 components host-bind `aria-label`/`aria-labelledby` without aliasing it — 3 remove the consumer's attribute, 3 overwrite it | **NEW** (complement of F10) |
| M2b | `<tw-icon aria-label>` leaves the SVG `aria-hidden` | **NEW** |
| H3 | `calendar` strips consumer `aria-describedby` | **NEW** |
| H4 | `segmented-control` CVA missing the whole form-control baseline | **NEW** |
| H5 | Seven answers to overlay dismissal; `closeOnSelect` type/default conflict | **NEW** |
| H6 | dialog/sheet/toast three naming schemes; `'full'` vs `'fullscreen'` | **NEW** (register Tier 4 #6 notes only the `Tw*` prefix question) |
| M1 | `date-range-picker` entry point does not re-export its own value types | **NEW** |
| M2 | `ResolvedItem` / `ThumbId` in public method signatures | **NEW** (F1-shaped) |
| M3 | `[tw-sort-header]` kebab-case selector | **NEW** |
| M4 | `ProgressBarSize` / `TwDialogSize` / `SheetSize` hand-copy `TwSize` | **NEW** |
| M5 | `carousel` 16 inputs, no exception | **NEW** |
| M6 | `badge` 7 inputs, visual primitive | **NEW** |
| M7 | Three comments cite a non-existent `<tw-input>` clear button | **NEW** (F4-shaped) |
| M8 | `model()` review — 33/36 clean, `isCopied` + 3× `touched` noted | **NEW** |
| L1 | Full over-cap census | **NEW** (register covered `table` only — Tier 4 #2, confirmed) |
| L3 | 48 inputs still without a stated default | **partially KNOWN** (F15) |
| L4 | 3 nested entry points outside the root barrel | **NEW** |
| L5 | `tabTriggerVariants` exported; **and it is the only one** | **KNOWN** (Tier 4 #3) + new scope evidence |
| L6 | selector/class-name mismatches | **NEW** |
| §4 | Boolean-`true` enumeration, 30 entries, 20 `//`-only | **KNOWN** (Tier 4 #4/#5) + full enumeration and the 13-vs-17 correction |
| §1 | 56/56 entry points · 78/78 OnPush · 798/798 JSDoc · 0 `Tw*` classes | register claims **independently confirmed** |
