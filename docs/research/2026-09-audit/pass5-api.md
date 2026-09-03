# Pass 5 — lens: public API surface + cross-component consistency (`api`)

Read-only audit. Nothing edited. Date 2026-09-03.

**Measurement base.** `dist/ngx-tw/` was rebuilt 2026-09-03 00:48; `find projects/ngx-tw
-name '*.ts' ! -name '*.spec.ts' -newer dist/ngx-tw/types/cdevhub-ngx-tw.d.ts` returns **0**,
so every `dist/`-derived number below is against current source. The 60 files in
`dist/ngx-tw/types/*.d.ts` are ng-packagr's flat per-entry-point rollups — i.e. *the shipped
public API*, which is what I measured rather than source barrels.

---

## 0. Already-closed items — confirmed, one line each

| Claim | Result |
|---|---|
| Entry points 56/56 in all four places | **56** `projects/ngx-tw/*/ng-package.json`, **56** `export * from '@cdevhub` lines in `src/public-api.ts`, **60** rollups in `dist/ngx-tw/types/` (56 + 3 nested + 1 root). Confirmed. |
| `tv()` conformance 63/63 with `twMerge` + `defaultVariants` | **63** `= tv(` configs, **63** `twMerge: true`, **63** `defaultVariants`. Confirmed. |
| Zero `@Input`/`@Output`/`@HostBinding`/`@HostListener` | grep over all of `projects/ngx-tw` returns **0**. Confirmed. |
| CVA registration on 14 controls | **13** `ngControl.valueAccessor = this` sites across 10 components (`radio` declares two classes) + **4** static `NG_VALUE_ACCESSOR` (`calendar`, `date-picker`, `date-range-picker`, `time-picker`) = 14. `number-input` is the documented pure-CVA static exception. Confirmed. |

---

# Part A — the approved-but-unlanded queue, scope rebuilt from source

`scratchpad/wave2-variant-scope.md` is gone; both scopes below are re-derived from the real
`tv()` configs, type declarations, specs and demo pages. **These two sections are scope
documents, not findings** — they carry no `Severity:` block by design.

## A1. Variant vocabulary unification — 11 renames across 6 components

### A1.0 The mechanism, decided once so the fix agent does not re-decide

**Measured first, because it changes the risk profile** — with `tailwind-variants@latest` as
installed here:

```
tv({base:'x', variants:{variant:{a:'A',b:'B'}}, defaultVariants:{variant:'a'}})
  ({variant:'b'})        -> "x B"
  ({variant:'zzz'})      -> "x"      <-- NOT the default; NO classes at all
  ({variant:undefined})  -> "x A"
```

So if a fix agent renames the `tv()` key and forgets the alias, a consumer still passing
`variant="outlined"` gets a **silently unstyled** component — no console error, no thrown
exception. That is the failure mode to design against.

**Recommended mechanism: (a) normalise before `tv()`. Do NOT duplicate the `tv()` key.**

Rationale for rejecting (b) "duplicate the `tv()` variant key": it doubles every affected
`compoundVariants` block (`card` 7→14 rows, `collapsible` 15→30 rows). Duplicated style rows
are exactly the drift CLAUDE.md already codifies against for shared `tv()` configs, and they
are invisible to any test that only asserts the new spelling.

**Code shape — apply this 11 times.** Canonical single-input case (`card`):

```ts
/** Visual style of the card container. */
type CardVariantCanonical = 'elevated' | 'outline' | 'ghost';

/**
 * Legacy spellings kept so existing templates keep compiling.
 * @deprecated `'outlined'` is an alias for `'outline'`; it will be removed in the
 * next major. Prefer `'outline'`.
 */
export type CardVariantLegacy = 'outlined';

/** Visual style of the card container. */
export type CardVariant = CardVariantCanonical | CardVariantLegacy;

/** Maps every legacy spelling onto its canonical replacement. */
const VARIANT_ALIASES: Readonly<Record<CardVariantLegacy, CardVariantCanonical>> = {
  outlined: 'outline',
};

// inside the component:
  /** Controls the visual elevation style. Defaults to `'elevated'`. `'outlined'` is a deprecated alias for `'outline'`. */
  readonly variant = input<CardVariant>('elevated');

  private readonly resolvedVariant = computed<CardVariantCanonical>(
    () => VARIANT_ALIASES[this.variant() as CardVariantLegacy] ?? (this.variant() as CardVariantCanonical),
  );
```

Name the canonical union explicitly rather than deriving it with `Exclude<>`: a
`computed<Exclude<CardVariant, CardVariantLegacy>>` whose body can still widen to `CardVariant`
is a TS2322 under this repo's strict settings, and it is the kind of thing that costs a fix
agent an hour eleven times over. `CardVariantCanonical` stays module-private — only
`CardVariant` and `CardVariantLegacy` are exported.

…then feed `this.resolvedVariant()` (not `this.variant()`) into the `tv()` call, and rename
the `tv()` variant key + every `compoundVariants` reference + `defaultVariants` to the
canonical spelling.

Notes for the fix agent:
- Keep the alias map **module-private in the component file**. Do not add a shared helper to
  `core/` — that would create new public API for a temporary compatibility shim. Eleven
  three-line maps is the cheaper shape.
- The `@deprecated` tag goes on the `*Legacy` type alias **and** is restated in the input's
  JSDoc, because Compodoc renders the input JSDoc into the demo API table and will not
  follow the type alias.
- Semver: this is **additive**. The old string still compiles and still renders. Removing the
  `*Legacy` union arm is the breaking step and belongs to the next major.
- Every spec that sets the old spelling should be **kept** and paired with a new-spelling
  twin, so the alias itself is covered. That is the only thing standing between the alias and
  a silent regression to the "unstyled" failure above.

### A1.1 `outlined` → `outline` (4 components)

| Component | `tv()` variant key | union type decl | exported type alias | `defaultVariants` | `compoundVariants` refs | spec refs | demo refs |
|---|---|---|---|---|---|---|---|
| `card` | `card/card.ts:28` | `card/card.ts:13` | `CardVariant` — `card/index.ts:8` | `card/card.ts:63` (`'elevated'`, unaffected) | `card/card.ts:54,55,56,57,58,59,60` (7 rows) | `card.spec.ts:134,135,176,177,191,395,400` | `card-examples.component.ts:14,64,99,115,149,268,292,429,437,485`; `card-api.component.ts:36,146`; `card-overview.component.ts:109,112,185`; `empty-state-examples.component.ts:212,477` |
| `flip-card` | `flip-card/flip-card.ts:44` | `flip-card/flip-card.ts:20` | `FlipCardVariant` — `flip-card/index.ts:3` | `flip-card/flip-card.ts:82` (**is `'outlined'`** — must change) | none | `flip-card.spec.ts:32,144` | `flip-card-examples.component.ts:11,27,234`; `flip-card-api.component.ts:29,139`; `flip-card-overview.component.ts:107` |
| `code-block` | `code-block/code-block.ts:69` | `code-block/code-block.ts:18` | `CodeBlockVariant` — `code-block/index.ts:2` | `code-block/code-block.ts:77` (`'filled'`, see A1.3) | none | `code-block.spec.ts:54,55` | `code-block-examples.component.ts:10,43,62`; `code-block-api.component.ts:140`; `code-block-overview.component.ts:31,33,51,91,95,98` |
| `stat` | `stat/stat.ts:72` | `stat/stat.ts:22` | `StatVariant` — `stat/index.ts:10` | `stat/stat.ts:125` (**is `'outlined'`** — must change) | none | `stat.spec.ts:37,177` | `stat-examples.component.ts:18,48,60,691,720`; `stat-api.component.ts:29,30,206`; `stat-overview.component.ts:67` |

Also update the prose in `card/card.ts:83` (JSDoc says "Only applies to `outlined` variant
borders") and `flip-card/flip-card.ts:145` (JSDoc names `'outlined'` as the default).

### A1.2 `bordered` → `outline` (2 components)

| Component | `tv()` variant key | union type decl | exported type alias | `defaultVariants` | `compoundVariants` refs | spec refs | demo refs |
|---|---|---|---|---|---|---|---|
| `accordion` | `accordion/accordion.ts:30` | `accordion/accordion.ts:16` | `AccordionVariant` — `accordion/index.ts:2` | `accordion/accordion.ts:39` (`'default'`, unaffected) | none | `accordion.spec.ts:76,173,184,193,201` | `accordion-examples.component.ts:10,54,73,92,116,244`; `accordion-api.component.ts:35,88`; `accordion-overview.component.ts:71,98,109`; `foundations/rhythm/panels/container-panel.ts:134,151,320,326` |
| `collapsible` | `collapsible/collapsible.ts:60` | `collapsible/collapsible.ts:26` | `CollapsibleVariant` — `collapsible/index.ts:7` | `collapsible/collapsible.ts:127` (`'default'`) **and** `DISPLAY_DEFAULTS` at `collapsible/collapsible.ts:39` | `collapsible/collapsible.ts:118,119,120,121,122,123,124` (7 rows) | `collapsible.spec.ts:164,187,225,235,236,238` | `collapsible-examples.component.ts:14,38,67,68,92,118,143,147,171,237,241,245,270,277,447,455,461,466,471,501,505,509,515`; `collapsible-api.component.ts:190,195`; `collapsible-overview.component.ts:80,98,102,153` |

### A1.3 `filled` → `solid` (4 components)

| Component | `tv()` variant key | union type decl | exported type alias | `defaultVariants` | `compoundVariants` refs | spec refs | demo refs |
|---|---|---|---|---|---|---|---|
| `code-block` | `code-block/code-block.ts:68` | `code-block/code-block.ts:18` | `CodeBlockVariant` | `code-block/code-block.ts:77` (**is `'filled'`** — must change) + input default `code-block/code-block.ts:144` + its JSDoc `:143` | none | none (default path only) | `code-block-examples.component.ts:10,177`; `code-block-api.component.ts:41,140`; `code-block-overview.component.ts:50` |
| `collapsible` | `collapsible/collapsible.ts:69` | `collapsible/collapsible.ts:26` | `CollapsibleVariant` | n/a | `collapsible/collapsible.ts:108,109,110,111,112,113,114,115` (8 rows) | `collapsible.spec.ts:164` | `collapsible-examples.component.ts:14,42,65,68,81,205,209,213,294,439,486,490,494`; `collapsible-api.component.ts:190,195`; `collapsible-overview.component.ts:100,102` |
| `segmented-control` | `segmented-control/segmented-control.ts:82` | `segmented-control/segmented-control.ts:38` | `SegmentedControlVariant` — `segmented-control/index.ts:2` | `'surface'` (unaffected) | `segmented-control/segmented-control.ts:145,146,147,148,149,150,151,152` (8 rows) + comment `:144` | `segmented-control.spec.ts:201,213,236,255,554,599` | `segmented-control-examples.component.ts:10,37,62,503`; `segmented-control-api.component.ts:28,188`; `segmented-control-overview.component.ts:108` |
| `stat` | `stat/stat.ts:76` | `stat/stat.ts:22` | `StatVariant` | `'outlined'` (unaffected by this row) | none | `stat.spec.ts:192,193` | `stat-examples.component.ts:18,52,72,734`; `stat-api.component.ts:30,206`; `stat-overview.component.ts:70` |

Also update the `variant` JSDoc at `segmented-control/segmented-control.ts:290` and
`collapsible/collapsible.ts:32` (the `CollapsibleDisplay.color` doc names both `bordered` and
`filled`).

### A1.4 `plain` → `ghost` (1 component)

| Component | `tv()` variant key | union type decl | exported type alias | `defaultVariants` | spec refs | demo refs |
|---|---|---|---|---|---|---|
| `stat` | `stat/stat.ts:71` | `stat/stat.ts:22` | `StatVariant` | `'outlined'` (unaffected) | `stat.spec.ts:199,200` | `stat-examples.component.ts:18,54,78,90,741`; `stat-api.component.ts:30,206`; `stat-overview.component.ts:71` |

Also the `variant` JSDoc at `stat/stat.ts:474`, which enumerates all four spellings.

### A1.5 Semver-relevant exported types

Six exported type aliases change their union membership. All six are exported from their own
entry point and, via `export *` in `src/public-api.ts`, from the root barrel:

`CardVariant`, `FlipCardVariant`, `CodeBlockVariant`, `StatVariant`, `AccordionVariant`,
`CollapsibleVariant`.

Under mechanism (a) each **gains** an arm (`| Card­VariantLegacy`) and keeps every existing
arm, so the change is additive and non-breaking. `CollapsibleDisplay` (`collapsible/index.ts:7`)
is transitively affected because its `variant?: CollapsibleVariant` member widens the same way.

### A1.6 Exclusions — verified individually, not taken on trust

| Excluded | Why it is genuinely a different axis |
|---|---|
| `table`'s `default \| striped \| bordered` (`table/table.ts:69`, `TwTableVariant`) | A **grid-style** axis, not a surface treatment. `striped` (alternating row fills) has no analogue anywhere in the surface vocabulary, and `bordered` here means "cell gridlines", not "the container has an outline". Renaming one arm would leave a two-vocabulary union. Also reached through the `appearance` config bag (`table/table.ts:91`), not a bare `variant` input. **Correctly excluded.** |
| `segmented-control`'s `surface` (`segmented-control/segmented-control.ts:38`) | A genuine third state and the **default**: `surface` = raised neutral pill, `filled` = solid colored pill, `outline` = colored ring. It is not a spelling of `solid`/`outline`/`ghost`. **Correctly excluded** — only its `filled` arm is in scope (A1.3). |
| `default \| naked` field chrome | **The brief says "the three pickers"; there are four.** `DatePickerVariant` (`date-picker/date-picker.ts:73`), `DateRangePickerVariant` (`date-range-picker/date-range-picker.ts:78`), `TimePickerVariant` (`time-picker/time-picker.ts:71`) **and `SelectVariant` (`select/select.ts:74`)**. `naked` means "suppress my own border/padding because a `tw-form-field` already draws them", which is a *composition* axis, not a surface treatment. **Correctly excluded — but the fix agent must know it is four files, not three.** |
| `form-field`'s `appearance: 'outline' \| 'filled'` (`form-field/form-field.ts:26`, key at `:156`, ~15 compound rows `:255–:288`) | **A fourth exclusion the brief does not name.** Different input (`appearance`, not `variant`); `filled` is the universal industry term for that field chrome (Material uses exactly this pair) and pairs with `outline`, which is already canonical. Renaming `filled`→`solid` here would *break* the pairing rather than fix it. **Exclude, and record the reason so a grep-driven agent does not sweep it in.** |
| `calendar.bordered` — a **boolean** input, not a variant | `calendar/calendar.ts:488` (`input(true)`), `tv()` boolean key `:98`, `defaultVariants` `:107`, call site `:1040`, and the template binding `date-range-picker/date-range-picker-overlay.ts:124` `[bordered]="false"`. Nothing to rename. |
| Prose-only `bordered`/`filled`/`plain` hits | `split/split.ts:205`, `progress-bar/progress-bar.ts:203,307,308`, `slider/slider.ts:439,755`, `carousel/carousel.ts:139,1500`, `stepper/stepper.ts:315`, `time-picker/time-picker.ts:236,584,704`, `date-range-picker/date-range-picker.ts:237`, `input/input.ts:46`, `number-input/number-input.ts:17`, `transfer/transfer.ts:442,649,664`, `combobox/combobox.ts:366,407,556`, `radio` + `timeline` + `badge` + `checkbox` + `alert` demo prose, `foundations/rhythm/rhythm-page.ts:217`, `foundations/rhythm/rhythm-row.ts:50`. Comments and English, not API. |

**e2e blast radius is nil.** The only hit across `e2e/` for any of the 11 renames is a comment
at `e2e/specs/01-components/card.spec.ts:15`.

### A1.7 Shape wrinkles that will trip a mechanical fix agent

1. **`collapsible` does not take `variant` as a bare input.** It arrives through the `display`
   config bag: `CollapsibleDisplay.variant` (`collapsible/collapsible.ts:31`),
   `DISPLAY_DEFAULTS` (`:39`), the `display` input (`:269`), `resolvedDisplay()` (`:310`) and
   the destructure at `:318`. The normalisation belongs **inside `resolvedDisplay()`**, and
   `DISPLAY_DEFAULTS.variant` must also move to the canonical spelling.
   **`CollapsibleGroupComponent` (`collapsible/collapsible.ts:381`) carries no `variant` or
   `display` input** — verified; its only public input is `accordion` (`:393`), and its
   variant-driven container class is an `@internal` overridable `hostClasses` that
   `AccordionComponent` overrides (`accordion/accordion.ts:106-108`). So the collapsible row of
   the scope is complete with `CollapsibleComponent` alone, and the accordion row is complete
   with `AccordionComponent.variant` alone.
2. **`stat` has two `tv()` configs and two exported `*Variant` types.** `statTile.variant`
   (`stat/stat.ts:70–76`, default `:125`, input `:475`, type `StatVariant` `:22`) is in scope.
   `statDelta.variant` (`'badge' | 'inline' | 'icon-only'`, `stat/stat.ts:142–165`, default
   `:221`, input `:278`, type `StatDeltaVariant` `:28`) is a **different axis and must not be
   touched**.
3. **`code-block` is hit twice** — it needs both `outlined`→`outline` and `filled`→`solid`,
   and `filled` is its `defaultVariants` value *and* its input default (`:144`) *and* named in
   its JSDoc (`:143`).
4. **`flip-card` and `stat` have `'outlined'` as their `defaultVariants` value**, so the
   default itself changes spelling. Their demo API tables print the default literally
   (`flip-card-api.component.ts:29`, `stat-api.component.ts:29`) and must be updated or they
   will document a string the component no longer canonically uses.

## A2. `TW_` prefix on injection tokens — full enumeration

**24 `new InjectionToken(...)` sites in the library. 12 carry the `TW_` prefix; 12 do not.**

### A2.1 Already conformant (12) — no action

`TW_ERROR_STATE_MATCHER` (`core/error-state-matcher.ts:47`), `TW_SORT_HANDLE`
(`core/sort-handle.ts:22`), `TW_INPUT_VALUE_ACCESSOR` (`input/input.ts:49`), `TW_TOAST_DATA` /
`TW_TOAST_REF` / `TW_TOAST_DEFAULT_OPTIONS` (`toast/toast-config.ts:138,141,144`),
`TW_DIALOG_DATA` / `TW_DIALOG_DEFAULT_OPTIONS` (`dialog/dialog-config.ts:75,78`),
`TW_FORM_FIELD_CONTROL` / `TW_FORM_FIELD` (`form-field/form-field.ts:98,121`),
`TW_ICON_REGISTRAR` (`icon/icon.providers.ts:10`), `TW_TIMELINE_SCROLL_LABELS`
(`timeline/timeline.ts:92`).

### A2.2 Non-conformant (12) — **all 12 are public and all 12 reach the root barrel**

Measured against `dist/ngx-tw/types/cdevhub-ngx-tw-<entry>.d.ts` export lists, plus
`src/public-api.ts`'s `export *` of each of the five owning entry points:

| Token | Declared at | Entry point | In rollup export list | Root-barrel importable | lib refs / demo refs / docs refs |
|---|---|---|---|---|---|
| `DATE_ADAPTER` | `calendar/date-adapter.ts:245` | `calendar` | yes | **yes** | 14 / 0 / 1 |
| `DATE_FORMATS` | `calendar/date-adapter.ts:53` | `calendar` | yes | **yes** | 2 / 0 / 1 |
| `TZ_OVERRIDE` | `calendar/date-adapter.ts:11` | `calendar` | yes | **yes** | 4 / 0 / 0 |
| `DATE_SERIALIZATION` | `calendar/date-adapter.ts:19` | `calendar` | yes | **yes** | 2 / 0 / 0 |
| `CALENDAR_SELECTION_STRATEGY` | `calendar/selection/selection-strategy.ts:43` | `calendar` (via `calendar/index.ts:116` `export * from './selection'`) | yes | **yes** | 4 / 1 / 1 |
| `POPOVER_DATA` | `popover/popover-tokens.ts:22` | `popover` | yes | **yes** | 4 / 3 / 2 |
| `POPOVER_REF` | `popover/popover-tokens.ts:25` | `popover` | yes | **yes** | 6 / 3 / 1 |
| `COMMAND_PALETTE_REF` | `command-palette/command-palette-tokens.ts:40` | `command-palette` | yes | **yes** | 3 / 1 / 0 |
| `THEME_CONFIG` | `theme/theme.config.ts:15` | `theme` | yes | **yes** | 6 / 1 / 3 |
| `AVATAR_GROUP_SIZE` | `avatar/avatar.ts:37` | `avatar` | yes | **yes** | 2 / 1 / 4 |
| `SHEET_DATA` | `sheet/sheet-config.ts:104` | `sheet` | yes | **yes** | 4 / 3 / 2 |
| `SHEET_DEFAULT_OPTIONS` | `sheet/sheet-config.ts:107` | `sheet` | yes | **yes** | 3 / 1 / 1 |

This **contradicts the register** — see F-1 below. The brief hoped this would shrink the work
by finding internal tokens that need no rename; it does the opposite. There is no internal
subset: the work is all 12.

### A2.3 Alias mechanism

Rename the declaration, then re-export the old name from the same module and the same
`index.ts`:

```ts
// calendar/date-adapter.ts
export const TW_DATE_ADAPTER = new InjectionToken<DateAdapter<unknown>>('tw-calendar/DateAdapter');

/** @deprecated Renamed to `TW_DATE_ADAPTER` for consistency with every other ngx-tw
 *  injection token. This alias is the same token instance and will be removed in the
 *  next major. */
export const DATE_ADAPTER = TW_DATE_ADAPTER;
```

```ts
// calendar/index.ts
export { TW_DATE_ADAPTER, DATE_ADAPTER, /* … */ } from './date-adapter';
```

Because the alias is *the same `InjectionToken` instance*, a consumer who provides via
`DATE_ADAPTER` and a library that injects via `TW_DATE_ADAPTER` still resolve to the same DI
key. **Do not** create a second `new InjectionToken(...)` with the old name — that silently
splits the DI graph, and nothing in the test suite would catch it. This is the single most
important instruction in A2.

Semver: additive. Both names ship; the old one carries `@deprecated`.

Blast radius per token is small (the "lib refs" column above counts *files*, including the
declaring file). The largest is `DATE_ADAPTER` at 14 library files; every other token is ≤ 6.

**Ordering note for the fix wave:** A1 and A2 touch disjoint files except `stat`/`avatar`
(none overlap in practice — A1 is `card, flip-card, code-block, stat, accordion, collapsible`;
A2 is `calendar, popover, command-palette, theme, avatar, sheet`). They can be run in parallel
by two agents with no ownership conflict.

---

# Part B — public API defects

### F-1 The register's injection-token count is under-stated: 12 of 12 non-prefixed tokens are root-barrel public, not 6
Severity: MEDIUM
Anchor: docs/audit-2026-09-register.md:768
Register: contradicts `## Open — carried to pass 5`, item 2
Confidence: [measured]
What: The register says twelve tokens lack the `TW_` prefix, "six of which (`DATE_ADAPTER`,
`DATE_FORMATS`, `THEME_CONFIG`, `SHEET_DATA`, `POPOVER_DATA`, `AVATAR_GROUP_SIZE`) import
cleanly from the root barrel and can collide in consumer code". All **twelve** do. Each
appears in the `export { … }` list of its entry point's shipped rollup
(`dist/ngx-tw/types/cdevhub-ngx-tw-{calendar,popover,command-palette,theme,avatar,sheet}.d.ts`),
and `src/public-api.ts` re-exports all six of those entry points with `export *`. The extra six
are `TZ_OVERRIDE`, `DATE_SERIALIZATION`, `CALENDAR_SELECTION_STRATEGY`, `POPOVER_REF`,
`COMMAND_PALETTE_REF`, `SHEET_DEFAULT_OPTIONS`. `CALENDAR_SELECTION_STRATEGY` reaches the barrel
through `calendar/index.ts:116` (`export * from './selection'`), which is easy to miss by
reading `calendar/index.ts`'s explicit export lists alone.
Why it matters: The brief scoped A2 hoping some tokens were internal (no rename, no alias,
less work). There is no internal subset — `import { DATE_ADAPTER, POPOVER_REF, SHEET_DATA }
from '@cdevhub/ngx-tw'` compiles today, and every one of these bare names (`SHEET_DATA`,
`POPOVER_DATA`, `THEME_CONFIG`) is a plausible identifier in an application. Scoping the fix
wave to six would leave half the collision surface.
Fix: Apply the A2.3 alias shape to all 12 (full table in §A2.2). Non-breaking: the deprecated
name must be `export const OLD = TW_NEW;` — the *same token instance* — never a second
`new InjectionToken(...)`, which would silently split the DI graph with no test to catch it.

### F-2 Five unexported types sit in eight non-`@internal` public signatures; the class is exactly those five and no more
Severity: MEDIUM
Anchor: projects/ngx-tw/command-palette/command-palette.ts:504
Register: extends `## Open — carried to pass 5`, "Five unexported types in public signatures"
Confidence: [measured]
What: I swept every shipped rollup for names that ng-packagr emits as a bare `declare`/`type`
but omits from the entry point's `export` list, then checked each reference site's source
annotation. **20 such names across 11 entry points**, but only **5 types in 8 signatures** are
reachable from a member that is *not* `@internal`:

| Type | Entry point | Non-`@internal` public signature |
|---|---|---|
| `ResolvedItem` | command-palette | `CommandPaletteComponent.filteredItems` (`command-palette.ts:504`), `.selectItem()` (`:659`), `.setActiveItem()` (`:668`) |
| `ResolvedGroup` | command-palette | `CommandPaletteComponent.grouped` (`command-palette.ts:521`) |
| `ThumbId` | slider | `SliderComponent.onThumbPointerDown()` (`slider.ts:849`), `.onThumbKeyDown()` (`slider.ts:897`) |
| `DialogContainer` | dialog | `TwDialogRef.containerInstance` getter (`dialog/dialog-ref.ts:66`) |
| `SheetContainer` | sheet | `SheetRef.containerInstance` getter (`sheet/sheet-ref.ts:73`) |

The other 15 (`RenderedItem`/`RenderedSeparator`/`RenderedOverflow`/`RenderedEntry` in
breadcrumbs, `CalendarFormControlCommon`, `ComboboxVisibleOption`/`ComboboxRenderedRow`,
`PaginationRangeItem`/`PageChangeSource`/`PaginatorFocusableDirective`, `StepStyleState`,
`TabTriggerElementDirective`, `RowBase`/`RowView`/`PanelView`) are reachable **only** through
members annotated `@internal`, so they disappear the moment the F-3 leak is closed. This is
the positive result the brief asked for: the register's list of five is complete for the
non-`@internal` surface, and the mechanical sweep confirms it rather than extending it.
Why it matters: A consumer holding `viewChild(CommandPaletteComponent)` can read
`filteredItems()`, can pass the result to `selectItem()`, and cannot write down the type of
either. `TwDialogRef.containerInstance` and `SheetRef.containerInstance` are documented
getters — the JSDoc invites the call — whose return type is unnameable. The same is true of
`onThumbKeyDown`, which a consumer would reasonably call to script a slider in a test.
Fix: Two shapes, both additive:
(a) For `ThumbId`, `ResolvedItem`, `ResolvedGroup` — export the types from
`slider/index.ts` and `command-palette/index.ts`. `ResolvedItem`/`ResolvedGroup` should be
renamed on export (`export type { ResolvedItem as CommandPaletteResolvedItem }`) since the
bare names are far too generic for a root-barrel symbol.
(b) For `DialogContainer`/`SheetContainer` — see F-4; the honest fix is to change the getters,
not to export the containers.

### F-3 `dialog` and `sheet` barrels declare the container "no longer part of the public API" while a documented public getter hands it out
Severity: MEDIUM
Anchor: projects/ngx-tw/dialog/index.ts:3
Register: extends pass 2 §2.5 / `## Open — carried to pass 5`, same bullet as F-2
Confidence: [measured]
What: `dialog/index.ts:3-5` and `sheet/index.ts:3-5` both carry the comment "`DialogContainer`
/ `SheetContainer` is the internal render surface — it now lives in the dynamically-imported
renderer chunk and is no longer part of the public API. Only its lifecycle types remain
exported." But `dialog-ref.ts:7` and `sheet-ref.ts:7` `import type` the class, and
`dialog-ref.ts:66` / `sheet-ref.ts:73` expose it:

```ts
/** The Tailwind container instance, or `null` until the dialog has attached. */
get containerInstance(): DialogContainer | null { … }
```

so ng-packagr pulls the whole class declaration into the shipped rollup anyway
(`cdevhub-ngx-tw-dialog.d.ts` `declare class DialogContainer …`, `cdevhub-ngx-tw-sheet.d.ts:105`).
The comment describes the *runtime* chunking accurately and the *type* surface inaccurately.
Why it matters: The barrel comment is the thing a maintainer reads before deciding whether the
container is safe to change. It says "internal" while the type is shipped, the getter is
documented, and the class's full member list (including every `@internal` one) is visible to
consumers. Someone will refactor the container believing nothing depends on it.
Fix: Narrow the getter's return type to a small exported interface rather than exporting the
container class. Additive and non-breaking for readers:
```ts
/** The subset of the container that is safe for consumers to touch. */
export interface TwDialogContainerHandle {
  readonly state: Signal<DialogState>;
  // …only what the getter is actually meant to expose
}
get containerInstance(): TwDialogContainerHandle | null { … }
```
If the getter is not meant to be consumer API at all, mark it `@internal` — but then it is
covered by F-4 instead, and the barrel comment finally becomes true.

### F-4 The 991-member `@internal` leak is 999 class members and 2 module symbols — the barrel mechanism is dead, and `protected` closes callability but not the leak
Severity: MEDIUM
Anchor: projects/ngx-tw/tsconfig.lib.prod.json:6
Register: extends `## Open — carried to pass 5`, `stripInternal` bullet, and the dedicated
`stripInternal` section (line 675). **Does not re-litigate the decision or retry the flag.**
Confidence: [measured]
What: Quantified per entry point against the shipped rollups. **1001 `@internal` JSDoc lines
survive into `dist/ngx-tw/types/*.d.ts`** (the register's 991 has drifted up by 10). Of those,
**999 are members of exported classes/interfaces and 2 are module-scope symbols.**

Worst offenders (exported-member `@internal` count per entry point):

| entry point | count | | entry point | count |
|---|---|---|---|---|
| select | 68 | | date-range-picker | 42 |
| slider | 61 | | paginator | 36 |
| time-picker | 60 | | calendar | 31 |
| table | 59 | | timeline | 31 |
| combobox | 57 | | toast | 31 |
| transfer | 57 | | carousel | 29 |
| file-upload | 50 | | tags-input | 29 |
| form-field | 46 | | tree | 26 |
| date-picker | 43 | | (30 more, ≤ 23 each) | |

**Evaluation of the two candidate mechanisms:**

- **Barrel / `index.ts` convention (the P4-13 trick): not viable as the primary fix.** It can
  reach **2 of 1001**. Class members are not module exports; keeping a name out of `index.ts`
  does nothing for `SelectComponent.resolvedSticky`. The two it *can* reach are real, though —
  one is `toTwDateRange`, annotated `/** @internal … */` at `calendar/date-range.ts` and
  re-exported from `calendar/index.ts:113`, i.e. an exact repeat of P4-13's "annotation
  contradicting the barrel". That is a 2-line fix worth doing on its own merits, but it is not
  the mechanism.
- **api-extractor: viable, but it is not the cheapest first step.** It is not currently a
  dependency (`grep` over `package.json` finds only `ng-packagr`). It would need one config
  per entry point (59) and a post-`build:lib` step. Crucially, though, it would operate on
  `dist/ngx-tw/types/*.d.ts`, which are **already flat single-file rollups** — so it runs
  *after* the ng-packagr flattening step that pass 4 proved is where `stripInternal` loses
  `tabTriggerVariants`. That ordering is why it can work where the compiler flag could not.
  The same reasoning means a ~40-line post-build script that strips `@internal`-annotated
  *members* from those rollups would get the same result with no new dependency — worth
  costing before committing to api-extractor. Either way the script must skip whole-declaration
  `@internal` (`toTwDateRange`) or it will corrupt an export list.
- **`protected`: closes *callability* with no tooling, but does NOT shrink the shipped
  surface.** Be precise about what it buys, because the two goals are separable and only one
  of them is served here. TypeScript emits `protected foo: T;` **into** the `.d.ts`, JSDoc and
  all — so a `protected` sweep leaves all 1001 `@internal` lines exactly where they are. What
  it does do is make `paginator.goTo(3, 'click')` and `table.resolvedSticky()` stop compiling
  in consumer code, which is the behaviour the annotation is *for*. Splitting the goals:
  **`protected` = callability; post-rollup strip / api-extractor = published surface.** Doing
  the `protected` sweep does not remove the need for the tooling decision.

  Feasibility is settled empirically rather than assumed: the library already binds a
  `protected` member from a `host` object — `code-block.ts:102` and `stat.ts:244` / `:405` all
  declare `'[class]': 'rootClasses()'` against a `protected readonly rootClasses`
  (`code-block.ts:184`, `stat.ts:374`, `:531`) and the library builds. So `protected` is legal
  in both template *and* host-binding expressions here. It also means the library already runs
  both conventions side by side: `card.ts:97` declares the same member public.

  Sizing, with both error directions stated: of 1142 member-level `@internal` annotations in
  source, 81 are already `protected`/`private`; **397 are public and referenced only inside
  their own file (or its `templateUrl` sibling)**, plus **13 referenced only from `.spec`
  files**. Concentrated where the leak is worst: table 39, slider 32, form-field 27,
  time-picker 26, paginator 23, file-upload 21, transfer 20, timeline 19, stepper 18,
  date-range-picker 17, select 17. **397 is not a clean lower bound — it errs in both
  directions and the downward error is the bigger one.** Upward: the cross-file check matches a
  bare name anywhere in `projects/`+`e2e/`, so common names (`value`, `disabled`) count as
  external when they are not. Downward, and more serious: the check *excludes the declaring
  file entirely*, so a member read by a **sibling class in the same file** counts as
  convertible — and `protected` forbids exactly that access. That idiom is the library's
  dominant shape (`CardBodyDirective`/`CardFooterDirective` inject `CardComponent` and read its
  `*Classes`; `CollapsibleTriggerDirective`/`CollapsibleIconDirective` do the same to
  `CollapsibleComponent`), so expect the true convertible count to land **well below 397**.
  Re-derive with a same-file class-boundary check before a fix agent acts on the number.
Why it matters: `paginator.goTo(3, 'click')` and `table.resolvedSticky()` compile in consumer
code today, and every one of these members is free to change shape without a major bump —
which is the whole point of the annotation. The leak has been "open, needs a mechanism" for
two passes; this narrows it to one decision (post-rollup strip vs api-extractor) plus one
mechanical pass that can start immediately.
Fix: (0) Re-derive the convertible set with a real same-file class-boundary check — the 397
is a sizing estimate, not a work list. (1) Then do the `protected` sweep on one component
first (`stat` or `code-block`, which already use the idiom) to confirm the pattern end to end,
then `table`, `slider`, `form-field`; one component per commit, `npm run build:lib` after each,
because `protected` breaks any sibling-class access the heuristic missed. This closes
callability only. (2) Fix `toTwDateRange`'s barrel export (2 lines) — an exact P4-13 repeat.
(3) Separately, decide the published-surface mechanism: cost a ~40-line post-rollup strip
script before adopting api-extractor; prototype it on
`dist/ngx-tw/types/cdevhub-ngx-tw-card.d.ts` and check the rollup still type-checks from the
demo. Steps (1) and (3) are independent and can run in either order.

### F-5 Semver hygiene of exported interfaces: clean; the pass-4 softening held
Severity: LOW
Anchor: dist/ngx-tw/types/cdevhub-ngx-tw-carousel.d.ts:1
Register: extends "Semver discipline held this time" (line ~660)
Confidence: [measured]
What: I enumerated every exported `interface` in every shipped rollup and counted required
(non-`?`) members. **`TwCarouselLabels`, `TwPaginatorLabels`, `TwThemeConfig` and
`TwTimelineScrollLabels` have zero required members** — pass 4's softening held on the current
tree. Every remaining interface with required members falls into one of three safe buckets:
(a) **event payloads** the library constructs and the consumer only reads (`TwSortEvent`,
`TwRowClickEvent`, `SplitResizeEvent`, `DatePickerChangeEvent`, …) — adding a member here is
non-breaking; (b) **template contexts** (`TwCellContext`, `TwSelectOptionContext`,
`TwTransferItemContext`, …) — same; (c) **consumer-constructed configs that are consumed as
`Partial<>`**: `RangeBehaviorConfig` (4 required, but `calendar.ts:479` and
`date-range-picker.ts:465` both take `Partial<RangeBehaviorConfig>`), `TwTableLabels`
(`table.ts:906`), `TwTransferLabels` (`transfer.ts:554`), `TwTreeSelectionConfig`
(`tree.ts:271`). The genuinely consumer-constructed non-`Partial` interfaces have small,
intentional required sets: `TwBreadcrumbsItem` (`label`), `TwSelectOption`/`TwComboboxOption`
(`label`, `value`), `CommandPaletteItem` (`id`, `label`), `DatePickerPreset` (`label`, `date`),
`SliderMark` (`value`), `ToastAction` (`label`).
Why it matters: Nothing to fix — but the shape is worth recording so pass 6 does not re-sweep,
and so the one watch item is visible.
Fix: None required. One watch item: `PromiseMessages<T>` (`toast/toast.ts:33`) is
consumer-constructed with three required members (`loading`, `success`, `error`) and no
`Partial<>` at the call site (`toast.ts:133`). That is correct today — all three states must be
named — but it means any future fourth promise state is a breaking change. If one is ever
contemplated, add it optional.

---

# Part C — cross-component consistency (axes prior passes did not cover)

Ranked by how likely a real consumer is to trip on it.

## C.0 Output denominator: 88, not 69 — reconciled before the table was built

`grep "= output"` over all non-spec library sources returns **88** output declarations, and
**none** of them is annotated `@internal`, `protected` or `private` (checked by parsing the
JSDoc block above each declaration). The shipped rollups declare **96** `OutputEmitterRef`
members, the extra 8 being inherited re-declarations in `calendar`'s view subclasses. No filter
I could construct reproduces the register's "**69**" (line ~706, "three public outputs
referenced by no test is now zero of 69"): 88 minus every `calendar` sub-component
(`calendar-cell` 4, `calendar-header` 3, `calendar-view-base` 3) is 78; minus all of `calendar`
is 70. **Treat 69 as stale.** Everything below uses 88, and states the definition.

### F-6 Seven components ship two outputs for the same transition with an *undocumented* semantic split
Severity: HIGH
Anchor: projects/ngx-tw/checkbox/checkbox.ts:567
Register: not in register
Confidence: outputs-map enumeration [measured] (read from the shipped
`ɵɵComponentDeclaration` maps in `dist/ngx-tw/types/*.d.ts`); emit-site semantics [verified]
(read from source).

> **Correction to my own first draft.** I initially concluded these were redundant duplicates
> because the payload types match, and recommended `@deprecated` on four of them. That was
> modelling, not measuring. Checking the emit sites falsifies it: they are *not* duplicates.
> Recording the correction because the wrong version would have deprecated four load-bearing
> outputs.

| Component | shipped outputs map | the two channels |
|---|---|---|
| `tw-checkbox` | `{ checked: checkedChange, indeterminate: indeterminateChange, change: change }` | `checked = model(false)` (`checkbox.ts:346`) → `checkedChange` fires on **any** change, including `writeValue()` (`:587-590` calls `checked.set(next)`). `change` (`:352`) is emitted **only** from `toggle()` (`:567`), i.e. user gesture. |
| `tw-switch` | `{ checked: checkedChange, change: change }` | Same split: model `switch.ts:259`; `change.emit` only at `:385` inside the toggle handler; `writeValue` at `:405-408` sets the model without emitting. |
| `tw-radio` | `{ checked: checkedChange, change: change }` | Same: `radio.ts:307` model, `change.emit` at `:463`/`:474` (selection gestures) and `:742` (group), `writeValue` at `:505`/`:826` sets silently. |
| `tw-collapsible` | `{ open: openChange, toggled: toggled }` | `open = model(false)` (`collapsible.ts:279`) → `openChange` on any change including `setOpen()` (`:353-354`). `toggled` (`:282`) only from `toggle()` (`:347`) and the group's user path (`:546`). |
| `tw-slider` | `{ value: valueChange, valueInput: input, change: change }` | Three genuinely distinct channels: model (any change), live-during-drag (`slider.ts:508`, aliased `input`), commit (`:511`). |
| `tw-select` | `{ value: valueChange, open: openChange, openedChange, selectionChange, searchChange }` | `open = model(false)` (`select.ts:583`) → `openChange` (`boolean`); `openedChange` (`:588`) is `TwSelectOpenedEvent` and carries a `trigger`. Also `valueChange` (model) vs `selectionChange` (`:591`, carries `added`/`removed`/`source`). |
| `tw-combobox` | `{ value: valueChange, inputValue: inputValueChange, open: openChange, queryChange, optionSelected, valueCommit, openedChange }` | Same `openChange` / `openedChange` split (`combobox.ts:471` model, `:485` output), plus `valueChange` / `valueCommit` / `optionSelected`. |

What: Every one of these components declares a `model()`, which **silently mints a second
output** (`checkedChange`, `openChange`, `valueChange`) that never appears in the source file,
never appears in the component's JSDoc, and never appears in the demo API table. The
hand-written output next to it is the *user-gesture* channel; the auto-minted one is the
*any-change* channel. That distinction is real, useful, and **documented nowhere** — not in a
single JSDoc block, not in a single demo API table.
Why it matters: This is the most consumer-visible item in this report, and the two ways to get
it wrong are both real bugs, not style issues.
- Bind `(checkedChange)` to a handler that writes back into the form, and you get an echo loop,
  because `writeValue` re-fires it. Bind `(change)` and you don't.
- Bind `(change)` expecting to observe a programmatic `form.setValue(...)`, and it never fires.
- On `tw-select`, IntelliSense offers `openChange` and `openedChange` side by side, with
  different payload types and no doc on either mentioning the other.
Fix: **Documentation, not deprecation.** No output here should be removed or deprecated.
- Add a cross-reference line to each hand-written output's JSDoc, e.g. on `checkbox.change`:
  *"Fires only on user interaction. For any change including programmatic `writeValue` /
  `setValue`, bind the model's `(checkedChange)` instead."* — and the mirror sentence in the
  demo API table.
- The auto-minted `propertyChange` outputs have no declaration site to document, so the
  **demo API tables must list them explicitly** (`checkedChange`, `openChange`, `valueChange`,
  `indeterminateChange`, `inputValueChange`, `expandedKeysChange`). They are public API that
  no page currently mentions. Compodoc will not generate them; they have to be hand-added.
- On `select`/`combobox`, state in `openedChange`'s JSDoc that it is the richer sibling of the
  auto-minted `openChange` and carries the trigger.
- Consider a short "two-way outputs" section in the demo's Forms foundations page, since the
  pattern repeats across seven components.

### F-7 "How do I control dismissal?" has nine different shapes of answer across the overlay/dismissible family
Severity: HIGH
Anchor: projects/ngx-tw/sheet/sheet-config.ts:76
Register: extends pass 2's recorded "seven different answers" observation
Confidence: [verified]
What: Full matrix (component × dismissal knob × default), all read from source. Nine
distinct answer shapes: `disableClose` only; sheet's triple; command-palette's unprefixed
triple; popover's `tw`-prefixed pair plus a backdrop enum; select's tri-state `closeOnSelect`;
toast's `dismissible`+`swipeToDismiss`+`pauseOnInteraction`; alert/badge's bare `dismissible`;
tabs' per-item `closable`; and *nothing at all* (combobox, menu, tooltip, all three pickers).

| Component | select-dismiss | Escape | outside / backdrop | master switch | open/close outputs |
|---|---|---|---|---|---|
| `dialog` (`TwDialogConfig`) | — | — | — | `disableClose = false` (`dialog-config.ts:59`), `hasBackdrop = true` (`:68`), `closeOnNavigation = true` (`:70`) | via `TwDialogRef` |
| `sheet` (`SheetConfig`) | — | `closeOnEscape = true` (`sheet-config.ts:76`) | `closeOnBackdropClick = true` (`:85`) | `disableClose = false` (`:91`), `hasBackdrop = true` (`:67`), `closeOnNavigation = true` (`:94`) | via `SheetRef` |
| `command-palette` | `closeOnSelect = true` (`command-palette.ts:424`) | `closeOnEscape = true` (`:427`) | `closeOnBackdropClick = true` (`:430`) | — | `opened` / `closed` (both `void`) |
| `popover` | — | `twPopoverCloseOnEscape = true` (`popover.ts:366`) | `twPopoverCloseOnOutside = true` (`:361`) + `twPopoverBackdrop = 'transparent'` (`:356`) | — | `twPopoverOpened` / `twPopoverClosed` (`void`) |
| `select` | `closeOnSelect = undefined` **tri-state** (`select.ts:551`; resolves `true` single / `false` multiple) | — | — | — | `openChange` (bool) + `openedChange` (event) |
| `combobox` | — (hard-wired) | — | — | — | `openChange` (bool) + `openedChange` (event) |
| `menu` | — | — | — | — (all delegated to `CdkMenuTrigger`, `menu.ts:206-218`) | `opened` / `closed` (`void`, CDK-aliased) |
| `tooltip` | — | — | — | — (only `twTooltipDisabled`, `tooltip.ts:352`) | `twTooltipShown` / `twTooltipHidden` |
| `date-picker` / `date-range-picker` / `time-picker` | — | — | — | — (only `scrollStrategy`) | `opened` / `closed` (`closed` carries a `CloseReason`) |
| `toast` | — | — | — | `dismissible = true` (`toast-config.ts:81`), `swipeToDismiss = true` (`:119`), `pauseOnInteraction = true` (`:114`) | `dismissed` (`void`) |
| `alert` / `badge` | — | — | — | `dismissible = false` (`alert.ts:191`, `badge.ts:219`) | `dismissed` (`void`) |
| `tabs` | — | — | — | `closable = false` per-tab (`tabs.ts:185`) | `closed` (payload: tab value) |

Three distinct problems fall out of that matrix:

1. **`dialog` and `sheet` are the same shape with different granularity.** Both extend CDK's
   `DialogConfig`, both carry a `TW_*_DATA` token, both have a container and a ref. `sheet`
   offers `closeOnEscape` + `closeOnBackdropClick` + `disableClose`; `dialog` offers only
   `disableClose`. A consumer who learns one cannot transfer the knowledge.
2. **Prefix inconsistency.** `popover` alone prefixes its dismissal knobs (`twPopoverCloseOnEscape`);
   `command-palette` spells the identical concept `closeOnEscape`. That is correct per the
   attribute-directive-vs-component rule, but the *demo API tables sit side by side* and read
   as two different features.
3. **`select.closeOnSelect` is a tri-state `boolean | undefined`** while `command-palette`'s
   is a plain `boolean`. `undefined` meaning "resolve from `multiple`" is defensible, but it
   is the only tri-state boolean input in the library and it makes
   `[closeOnSelect]="someBoolean()"` behave differently from `[closeOnSelect]="someBoolean() || undefined"`.

Why it matters: Pass 2 already flagged this as "a real consumer-facing wart" and it is
unchanged. Someone building a form with a `tw-select`, a `tw-date-picker` and a `tw-sheet`
must learn three vocabularies to answer one question, and for the pickers the answer is
"you can't".
Fix (unified vocabulary, all additive, all with deprecated aliases):
- **Canonical names**: `closeOnSelect`, `closeOnEscape`, `closeOnOutside`, `disableClose`
  (master override). Directive-hosted components keep their `tw*` prefix on the same stems:
  `twPopoverCloseOnEscape`, `twPopoverCloseOnOutside`.
- `sheet`: rename `closeOnBackdropClick` → `closeOnOutside`; keep
  `closeOnBackdropClick?: boolean` on the config with `@deprecated`, and have the resolver read
  `closeOnOutside ?? closeOnBackdropClick ?? true`. Config-object members are optional, so this
  is non-breaking.
- `command-palette`: same rename, same alias shape, on the `input()` (add
  `closeOnOutside = input<boolean|undefined>(undefined)` and resolve
  `closeOnOutside() ?? closeOnBackdropClick()`; mark the old input `@deprecated`).
- `dialog`: **add** `closeOnEscape?: boolean = true` and `closeOnOutside?: boolean = true` to
  `TwDialogConfig`, resolved exactly as `sheet` does (`disableClose` still wins). Purely
  additive; brings the two overlay services level.
- `date-picker` / `date-range-picker` / `time-picker`: add `closeOnEscape` and `closeOnOutside`
  inputs defaulting to `true`. Each needs a `true`-default JSDoc justification per CLAUDE.md.
- `select.closeOnSelect`: leave the tri-state (changing it is breaking) but document the
  `undefined` semantics in the demo API table, which currently only says "when unset".
- Do **not** unify `menu` — it delegates wholesale to `CdkMenuTrigger`, and adding knobs there
  means reimplementing CDK behaviour, which CLAUDE.md forbids. Document the delegation instead.

### F-8 The picker family is not uniform: `date-range-picker` has no text-entry path at all, which justifies both its missing `readonly` and its missing `*Input` output
Severity: LOW
Anchor: projects/ngx-tw/date-range-picker/date-range-picker.ts:311
Register: not in register
Confidence: [measured]

> **Correction to my own first draft.** I first wrote this as a MEDIUM gap — "`date-range-picker`
> is the only picker with no `readonly` input, add one". Reading its template falsifies that:
> the proposed fix would have added a permanently meaningless input to a published API, which
> is additive but unremovable. Recording the corrected version instead.

What: `date-range-picker`'s entire trigger is a `<button role="combobox">` containing `<span>`
text (`date-range-picker.ts:311-360`). There is **no `<input>`, no `(input)` handler and no
`onInput` method anywhere in the component** — the only keyboard handler is
`(keydown)="onTriggerKeydown($event)"` at `:329`, which opens the overlay. Its
`emptyStartLabel` / `emptyEndLabel` (`:415`, `:418`) are display strings for unfilled
segments, not `<input>` placeholders. By contrast `date-picker.ts:350` renders a real `<input>`
and `time-picker` renders typeable segment fields.

That single fact explains two asymmetries that otherwise read as gaps:

| | text entry | `readonly` input | `*Input` output |
|---|---|---|---|
| `date-picker` | `<input>` (`date-picker.ts:350`) | yes (`:482`) | `dateInput` (`:582`) |
| `time-picker` | typeable segments | yes (`:544`) | `timeInput` (`:617`) |
| `date-range-picker` | **none** — button + spans | **no, and correctly so** | **none, and correctly so** |

`readonly` on the other two is documented as *"blocks typing but still allows picking via the
calendar trigger"* (`date-picker.ts:481`). With no typing to block, the input would be inert.
Why it matters: Two things, both small. (1) A future audit pass will re-derive the same
"missing `readonly`" gap from the same input matrix and propose the same wrong fix — this entry
exists to stop that. (2) CLAUDE.md, the register and the demo all refer to "the three pickers"
as a uniform family (the `default | naked` exclusion in the brief does exactly this), and they
are not uniform on the axis consumers care about most: whether a user can type a date. Nothing
in the `date-range-picker` demo page says the field is not typeable.
Fix: No code change. Add one sentence to the `date-range-picker` overview page stating that
the range is selected exclusively through the calendar overlay and the trigger is not a text
field, and stop describing the three as interchangeable. If typed range entry is ever wanted,
it arrives as a `rangeInput` output plus a `readonly` input **together** — not `readonly`
alone.

### F-9 `options` names a config bag on `progress-bar` and a choice collection everywhere else
Severity: LOW
Anchor: projects/ngx-tw/progress-bar/progress-bar.ts:213
Register: not in register
Confidence: [verified]
What: The library's collection inputs are `data` (`table.ts:862`, `tree.ts:262`,
`transfer.ts:545`), `options` (`select.ts:493`, `combobox.ts:367`), `commands`
(`command-palette.ts:418`), `items` (`breadcrumbs.ts:402`), `presets`
(`date-picker.ts:549`, `date-range-picker.ts:448`), `marks` (`slider.ts:466`). Its config-bag
inputs are named after their domain: `display` (`collapsible.ts:269`, `tree`, `transfer`),
`appearance` / `sticky` / `responsive` / `selection` / `labels` (`table`), `behavior`
(`transfer`), `rangeBehavior` (`calendar.ts:479`), `selection` (`tree.ts:271`).
`progress-bar.options` (`progress-bar.ts:213`) is the sole config bag named `options` — the
same word that means "the list of choices" on `tw-select` and `tw-combobox`.
Why it matters: Small, but it is a name a consumer types from memory. `[options]` on a
progress bar taking `{min, max, segments, showValue, formatter, ariaLabel, ariaLabelledby}` is
a genuine surprise next to `[options]` on a select taking an array. `progress-bar` is also
explicitly listed in CLAUDE.md as a primitive that must "reshape with config objects", so this
input is the intended shape — only the name is off.
Fix: Add `display = input<ProgressBarOptions | undefined>(undefined)` and resolve
`display() ?? options()`; mark `options` `@deprecated` in its JSDoc. Rename the exported type
`ProgressBarOptions` → `ProgressBarDisplay` with `export type ProgressBarOptions =
ProgressBarDisplay;` kept as a deprecated alias. Both steps additive. Lower priority than
F-6/F-7 — fold it into whichever wave touches `progress-bar`.

### F-10 "The surface went away" is spelled five ways across the overlay/dismissible family
Severity: LOW
Anchor: projects/ngx-tw/tooltip/tooltip.ts:367
Register: not in register (the brief names it: `closed` vs `dismissed` vs `openedChange`)
Confidence: [verified]
What: Same concept, five spellings, and one genuine semantic clash:
`closed` (`command-palette.ts:451` — void; `date-picker.ts:579` / `date-range-picker.ts:555` —
carries a `CloseReason`), `twPopoverClosed` (`popover.ts:392` — void),
`twTooltipHidden` (`tooltip.ts:367` — void), `dismissed` (`alert.ts:206`, `badge.ts:233`,
`toast-component.ts:218` — void), `openChange`/`openedChange` (`select.ts:588`,
`combobox.ts:485`). **The clash**: `tabs.closed` (`tabs.ts:273`) does *not* mean "the surface
closed" — it means "a closable tab was removed", payload the tab's `value`. It is the only
`closed` in the library that is a collection mutation rather than a visibility transition.
Why it matters: Lowest-ranked of the Part C findings because each name is locally
defensible (a tooltip is "hidden", an alert is "dismissed") and none is wrong on its own. It
still costs a consumer one doc lookup per component. `tabs.closed` is the one worth an
explicit note, because `(closed)` on a `tw-tabs` next to `(closed)` on a `tw-date-picker` in
the same template reads as the same event and is not.
Fix: Documentation, not renames — renaming any of these is breaking for negative value. Add a
cross-reference line to each JSDoc ("the visibility-transition counterpart of `opened`") and,
for `tabs.closed`, state plainly in the demo API table that it is a tab-removal event, not a
panel-close event. If a rename ever happens, `tabs.closed` → `tabClosed` is the one worth
doing, with `closed` kept as a deprecated alias output.

---

## Residual risks and things I did not close

- **The 397-member `protected` estimate in F-4 errs in both directions and is not a work
  list.** It is a name-match heuristic, not an AST analysis. The downward error dominates: the
  check excludes the declaring file, so members read by a **sibling class in the same file**
  (the `CardBodyDirective` → `CardComponent.bodyClasses` idiom, which is everywhere) are
  counted as convertible when `protected` forbids that access. Expect the true number well
  below 397. Re-derive with a class-boundary check before any fix agent acts on it.
- **The register's "69 outputs" could not be reconciled** with any filter I tried (§C.0). If a
  future pass finds the original definition, the "zero of 69 untested outputs" claim should be
  re-derived against 88.
- **F-7's unified vocabulary is a proposal, not an approved decision.** It changes the shape of
  five public config surfaces (additively) and should be signed off before a fix agent starts.
- **Two of my own first-draft findings were falsified by re-checking and are recorded as
  corrections in place** (F-6's "identical payloads, deprecate them" and F-8's "add a
  `readonly` to date-range-picker"). Both came from reasoning off a type signature or an input
  matrix instead of reading the emit sites and the template — the same failure mode pass 4
  recorded. The corrected versions are the ones to act on; do not resurrect the drafts.
- I did **not** audit whether the demo pages and MCP snippets would need regeneration after the
  A1 renames beyond listing the affected files; `verify:mcp-index` and `ng build demo` are the
  gates and I was instructed not to run them.
- **F-6's fix requires hand-editing demo API tables** to list outputs that have no declaration
  site (the `model()`-minted `checkedChange` / `openChange` / `valueChange` family). I did not
  check whether the `demo-doc-page` convention or the MCP index builder has a place to put a
  member Compodoc cannot see; that needs confirming before the docs wave starts.
