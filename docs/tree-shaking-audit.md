# ngx-tw — Tree-Shakeability Audit

**Date:** 2026-06-11  **Package:** `@cdevhub/ngx-tw@0.2.1`  **Scope:** all ~60 secondary entry points (source + freshly-built `dist/ngx-tw`).
**Method:** deterministic config/dist forensics (lead) + 13-agent fan-out (9 library shards + 4 specialists: core-hub, closure-graph, new-components, dist-forensics) → adversarial verification of every material finding. **0 false positives** survived verification.

## Verdict

**The library is very well-architected for tree-shaking.** The `sideEffects: false` contract is *honest* across every shipped file, heavy third-party deps are quarantined in leaf adapters, cross-entry coupling goes through package paths (no barrel/relative leaks), and per-component FESM bundles import — never inline — their siblings. The audit found **2 confirmed bundle-weight issues** (1 medium, 1 low), **1 registration/intent gap** needing a decision, and a few housekeeping notes. None is a `sideEffects:false` violation.

| Severity | Count | Items |
|---|---|---|
| 🟠 Medium | 1 | breadcrumbs unconditionally bundles `menu` + `@angular/cdk/menu` (overlay) |
| 🟡 Low (systemic) | 1 | **8 form controls** pin the concrete `FormFieldComponent` for parent detection; 4 removable trivially |
| 🔵 Decision | 1 | `theme` entry point absent from root barrel + stale CLAUDE.md description |
| ⚪ Housekeeping | 2 | `core/form-reset.ts` (kept — intentional scaffolding); CDK convenience re-exports |

## ✅ Resolution (applied 2026-06-11)

All findings addressed and verified against a fresh `build:lib`, the full **2896-test** suite (all green), and a **production demo build**.

| Finding | Action | Verification |
|---|---|---|
| **F1 breadcrumbs → menu** | Wrapped the overflow `<tw-menu>` in `@defer (on viewport; prefetch on idle)` with a placeholder trigger. | Demo prod build: the breadcrumbs route's eager static closure no longer contains the CDK-menu chunk — it's reachable only via the component's dynamic `@defer` import (`NGMF5MZP → import(OA6WZE36) → CDK menu`). Breadcrumbs spec moved to the defer-block render API — 39/39 pass. |
| **F2 controls → FormFieldComponent** | Added a self-provided `TW_FORM_FIELD` token + `TwFormFieldParent` (`hasLabel`) interface in `form-field`; the 8 controls inject the token, not the concrete component (transfer's dead inject deleted). | Dist FESM: all 8 control bundles dropped `FormFieldComponent`. form-field + 8 control specs — 462/462 pass. |
| **F3 theme** | Added `export * from '@cdevhub/ngx-tw/theme'` to `public-api.ts` (parity); fixed the stale CLAUDE.md description. | Lib builds; full suite green. |
| **Housekeeping** | `core/form-reset.ts` **kept** — inspection showed it's intentional Phase-3 scaffolding (a complete, documented `onFormReset` helper), not dead cruft; never imported → already a non-issue for tree-shaking. CDK convenience re-exports left as intentional. | — |

The original findings below are preserved as the audit record.

---

## 🟠 Finding 1 (Medium) — `breadcrumbs` always bundles the overlay-backed `menu` for an overflow feature that defaults OFF

**Entry point:** `@cdevhub/ngx-tw/breadcrumbs`  **Category:** heavy-dep / unconditional retention

- `breadcrumbs.ts:16-20` value-imports `{ MenuComponent, MenuItemDirective, MenuTriggerDirective }` from `@cdevhub/ngx-tw/menu` and lists them in the component `imports: […]` (`breadcrumbs.ts:281-287`).
- They are used **only** in the overflow collapse branch (`@else` at `breadcrumbs.ts:331-354`), which renders only when `maxItems > 0`. But `maxItems = input<number>(0)` (`breadcrumbs.ts:374`) **defaults to 0** — no collapsing — so the typical `<tw-breadcrumbs [items]="trail"/>` never instantiates a menu.

**Why it's not tree-shakeable (verified in dist, the airtight part):** the three menu classes appear in the compiled component in *two* places. The `ɵɵngDeclareClassMetadata(...)` block (`dist/…/breadcrumbs.mjs:360+`) *is* shakeable (dev-only reflection) — if that were the only edge this would be a false positive. But the Angular compiler also bakes them into **`ɵcmp.dependencies`** (`dist/…/breadcrumbs.mjs:358`: `{ kind: "component", type: MenuComponent }`, …) — the **runtime directive-matching array**, which is *not* tree-shakeable and is retained whenever `BreadcrumbsComponent.ɵcmp` is. That eager value reference forces the ESM edge `breadcrumbs.mjs:6 → @cdevhub/ngx-tw/menu`, and `menu.mjs:4-5` pulls `@angular/cdk/menu` (overlay + focus-trap via the `CdkMenuTrigger` host directive).

**Impact:** `import { BreadcrumbsComponent } from '@cdevhub/ngx-tw/breadcrumbs'` ships `MenuComponent`/`MenuItemDirective`/`MenuTriggerDirective` **+ the CDK menu/overlay/focus-trap chain** into every consumer, even those that never set `maxItems`. (Note: the cost is those three symbols + their CDK chain, **not** the full ~27.9 KB menu FESM — other menu exports still shake out. The `IconComponent` edge is fine: icon is a light, CDK-free leaf used in the always-on separator.)

**Recommended fix (cleanest):** wrap the overflow `<tw-menu>` `@else` branch in **`@defer`** (e.g. `@defer (when shouldCollapse())`). Angular then moves the menu + CDK deps into a lazily-loaded chunk, so the edge is paid only when collapsing actually renders. Alternatives: extract the overflow trigger into a separate opt-in sub-component/entry point, or project the overflow menu as consumer-supplied template content instead of importing `MenuComponent` directly.

---

## 🟡 Finding 2 (Low, but systemic — 8 entry points) — form controls pin the concrete `FormFieldComponent` for parent detection

**Entry points:** `combobox`, `select`, `input`, `time-picker`, `date-picker`, `date-range-picker`, `tags-input`, `transfer`  **Category:** heavy-dep / avoidable runtime edge

Eight form controls do `private readonly formField = inject(FormFieldComponent, { optional: true });` to detect a wrapping `<tw-form-field>`. This pins **`FormFieldComponent`** — the *heaviest* export of the form-field entry point (inline template + `formFieldVariants` `tv()` config + the 5 child directives it queries) — into each control's bundle.

**Mechanism (empirically confirmed in dist):** `FormFieldComponent` appears in the `from '@cdevhub/ngx-tw/form-field'` import line of all 8 FESM bundles. It is a genuine **value reference** (the class identifier passed to `inject()`), so it is retained for bundling whenever the control is used — independent of `extends`. Crucially, `extends FormFieldControl` does **not** retain it: `FormFieldControl` (the abstract base, `form-field.mjs:10`) never references `FormFieldComponent` (`form-field.mjs:338`) — the `inject(FormFieldComponent)` calls inside form-field live in its *child directives* (Label/Hint/Error/Prefix/Suffix), not the base. The 4 controls that compose form-field without this inject (`checkbox`, `file-upload`, `number-input`, `textarea`) correctly do **not** carry `FormFieldComponent`.

**Classification by how `this.formField` is actually used** — this decides removability:

| Control | Usage of `this.formField` | Removability |
|---|---|---|
| **transfer** | *never read* (injected at `:599`, zero uses) | **Dead injection — just delete it** (drops the edge + removes dead code) |
| **combobox** (`:496`) | only `!!this.formField` (`:553` `naked`) | **Trivial** — swap to a presence token |
| **input** (`:170`) | only `!!this.formField` (`:295`) | **Trivial** — presence token |
| **tags-input** (`:302`) | only `!!this.formField` (`:417`) | **Trivial** — presence token |
| select, time-picker, date-picker, date-range-picker | `this.formField?.labelChild()` (real query read) | **Deeper** — genuine coupling; expose label-presence via the token/interface |

**Impact:** e.g. `import { ComboboxComponent } from '@cdevhub/ngx-tw/combobox'` ships the full `FormFieldComponent` purely to evaluate a boolean; `import { TransferComponent } from '@cdevhub/ngx-tw/transfer'` ships it for an injection that is never read at all.

**Recommended fix:** introduce one lightweight presence/`useExisting` DI token that `FormFieldComponent` provides for itself (standard CDK parent↔child decoupling), imported **type-only** on the controls. That single shared change cleans the 4 trivial cases (delete transfer's inject; turn combobox/input/tags-input's `!!` into a token check) and drops the concrete-component edge from their bundles. The 4 `labelChild()` readers need the token to also surface label presence — a follow-up, lower priority.

> **Why this isn't exempted by the "inject() tree-shakes" calibration:** that rule means the *injecting field* is no module-scope side effect — true. It does **not** immunize the choice to inject a **concrete component** instead of a token: the class is still a value edge to a heavier sibling symbol.

> **Correction to the agent's original combobox finding (kept for honesty):** it claimed `checkbox` "demonstrably proves" a token suffices. Imprecise — `checkbox` uses `TW_FORM_FIELD_CONTROL` in the *opposite* direction (child→parent registration via `providers` + `forwardRef`) and never detects parent presence. The fix is *feasible* via a new presence token, not *already proven* by checkbox.

---

## 🔵 Decision — `theme` is a real entry point but missing from the root barrel (and CLAUDE.md is stale)

**Entry points:** `@cdevhub/ngx-tw` (root barrel) ↔ `@cdevhub/ngx-tw/theme`  **Category:** registration / docs — *not a tree-shaking defect*

- `theme/` is a genuine secondary entry point (`ng-package.json` + `theme/index.ts` exporting `ThemeService`, `ThemeDirective`, `THEME_CONFIG`, `provideTheme`, `TW_THEMES`, `TW_RESOLVED_THEMES`, `DEFAULT_TW_THEME_CONFIG`). It ships in dist (`fesm2022/cdevhub-ngx-tw-theme.mjs`, 8.6 KB) and resolves via `exports["./theme"]`.
- **But** it is the *only* shipping entry point absent from `src/public-api.ts`, so `import { provideTheme } from '@cdevhub/ngx-tw'` fails — consumers must use the direct subpath `@cdevhub/ngx-tw/theme`. (No bundle impact; if anything, omitting the stateful `ThemeService` from the `export *` barrel is mildly *good*.)
- Separately, **CLAUDE.md is stale**: it calls `theme/` "a CSS asset, **not** a secondary entry point." It is in fact *both* — a CSS asset (via the root `ng-package.json` `assets` glob) **and** a TS entry point.

**Decision needed:** (a) keep theme as direct-subpath-only (defensible — document it), or (b) add `export * from '@cdevhub/ngx-tw/theme';` to `public-api.ts` for parity with every other entry point. **Either way**, update the CLAUDE.md "Library Structure" line so the doc matches reality.

---

## ⚪ Housekeeping (info-level)

1. **`core/form-reset.ts` — intentional scaffolding, kept (not deleted).** `export function onFormReset` has zero importers and is absent from the core barrel/FESM, so it never ships and is a non-issue for tree-shaking. Initially flagged "safe to delete," but on inspection it's a complete, documented form-reset helper and `calendar.ts:1151` references it as planned *"Phase 3 form-reset integration"* — deliberate groundwork, not cruft. **Left in place.**
2. **CDK convenience re-exports.** `stepper/index.ts` and `table/index.ts` re-export a couple of CDK symbols (e.g. `DataSource`, step state) for consumer convenience. Intentional and benign; noted only because they're the sole "re-export from outside the entry point" cases in the library.

> *(A third housekeeping candidate — the recurring dead/`!!`-only `FormFieldComponent` injection — was promoted into **Finding 2** once dist forensics showed it pins a real bundle edge across 8 controls, not just dead instance-level code.)*

---

## ✅ Verified clean (this *is* the result — proof, not omission)

Every item below was checked against source **and** the freshly-built dist; nothing was assumed.

**The `sideEffects: false` contract is honest.**
- No module-scope executable side effects in any shipped file. Every `console.*`, `window.*`/`document.*`, `effect()`, `new`, `setTimeout`, `localStorage`, `matchMedia` is **instance-level** (class-field initializer, constructor, or method) and dev-guarded where relevant — never at module load. The only top-level call in any FESM is `ɵɵngDeclareClassMetadata(...)`, the standard Angular partial-compilation emission that the linker dev-guards and the production optimizer drops.
- No TS `enum`, no `@NgModule`, no `declare global`/`declare module`, no `APP_INITIALIZER`/`ENVIRONMENT_INITIALIZER`, no bare side-effect imports in shipped code (the one `import 'vitest-axe/extend-expect'` is in `test-setup.ts`, not shipped).
- The single `providedIn:'root'` is the `TW_ERROR_STATE_MATCHER` **InjectionToken factory** (`core/error-state-matcher.ts:47`) — the ideal tree-shakeable pattern (realized only on injection).

**Build & dist topology.**
- `ng build` exits **0** → ng-packagr found **no circular entry-point dependencies**.
- Root `dist/package.json` has `sideEffects:false` + a complete `exports` map (**61 subpaths, 0 missing files**); each subpath routes to its **own** FESM.
- **The 59 secondary `package.json` files lack `sideEffects` — and that is benign.** Every FESM bundle physically lives in `dist/ngx-tw/fesm2022/`, so the *nearest* `package.json` to each bundle is the root one (`sideEffects:false`). Webpack/rollup determine sideEffects from the resolved file's on-disk location, not the subpath's package.json. *(This is the classic false-positive trap; it was checked, not assumed.)*
- **No FESM inlining.** Every bundle *imports* its siblings via package specifiers; none redefines a sibling's component/directive class. No duplication bloat. Bundle sizes scale with feature surface (calendar 235 K is intrinsic; the heavy composites import, not inline).
- Root barrel `cdevhub-ngx-tw.mjs` (2.5 KB) is pure `export *` re-export — the one place `sideEffects:false` is load-bearing, and it's thin.

**The `core` hub (imported by 57 entry points).**
- `core/index.ts` is named re-exports with zero module-scope side effects.
- **Headline question resolved:** `import { TW_ERROR_STATE_MATCHER } from '@cdevhub/ngx-tw/core'` does **not** force-bundle the overlay coordinators. In `core.mjs`, no top-level const references a coordinator; the only free-standing statements are two droppable `ɵɵngDeclareClassMetadata` calls. Unused core exports shake away per-symbol (verified: `select.mjs` imports exactly its 4 runtime core symbols).
- ~36 **type-only** core importers create **zero** runtime edge (e.g. `button.mjs` contains no `ngx-tw/core` string at all). The value-vs-type split is meticulous across all 57 importers — no value-imported-but-type-only symbol found.

**Heavy third-party deps are quarantined.**
- `luxon` is imported **only** in `calendar/luxon`; `lucide-angular` **only** in `icon/lucide`. Both are leaf adapter sub-entries imported by **nothing** else in the library — confirmed at the *bundle* level. They enter a consumer bundle only on an explicit `@cdevhub/ngx-tw/calendar/luxon` / `…/icon/lucide` import. The default calendar (native `Intl`) and default icon path carry no heavy dep.

**Dependency closure (authoritative, computed from shipped FESM).**
- Max transitive value-closure is **5 siblings**, only for the legitimate composites `date-picker` / `date-range-picker` / `file-upload`. **31 of 59 bundles are fully standalone leaves** (zero sibling deps). `@angular/cdk/overlay` reaches exactly the 12 overlay-bearing components + `core`. No light/decorative component (tooltip, popover, carousel, segmented-control, stepper, paginator, timeline, card, …) secretly drags overlay/calendar/luxon/lucide/form-field.

**New components `transfer` & `tree`.**
- `tree` is **fully clean** and drags in **nothing**: only `@angular/core`, `@angular/common`, `@angular/cdk/tree`, `tailwind-variants` (its `core` import is type-only).
- `transfer` is clean on side-effects, `import type` discipline, runtime-CVA registration (no static `NG_VALUE_ACCESSOR` self-cycle), and own-entry-only barrel; its closure `{core, form-field, checkbox, input}` is intrinsic (it renders `tw-checkbox` + `twInput`). Its **one** issue is the dead `inject(FormFieldComponent)` folded into Finding 2 (injected, never read → pins the concrete component). *(The fan-out's new-components specialist initially marked transfer "0 findings" on the belief that `extends FormFieldControl` already retained the component; dist forensics during verification disproved that — corrected here.)*

---

## Per-entry transitive value-closure (siblings a consumer bundles; `[core]` shakes per-symbol)

```
5  date-picker        → form-field, calendar, button, time-picker, [core]
5  date-range-picker  → form-field, calendar, button, time-picker, [core]
5  file-upload        → form-field, button, icon, progress-bar, [core]
4  transfer           → form-field, checkbox, input, [core]
3  number-input → input, form-field, [core]      3  table → checkbox, form-field, [core]
3  textarea → form-field, input, [core]          3  tags-input → form-field, badge, [core]
3  time-picker → form-field, calendar, [core]
2  badge → avatar, icon     2  breadcrumbs → icon, menu(⚠ overlay)     2  checkbox/combobox/input/select → form-field, [core]
1  accordion → collapsible   empty-state → icon   stat → skeleton   dialog/sheet/sort/radio → [core]
0  everything else (no non-core sibling value edge)
```

---

## Methodology notes / traps avoided

- **Tooling:** this machine's `grep` is **ugrep**, which silently returns empty for some flag combos (`-rng …`) — an early sweep produced false "clean" results before the catch. All sweeps were redone with `rg`; agents were mandated to use `rg`.
- **Calibration against false positives:** finders and verifiers were given an explicit allow-list (`tv({})`, `new InjectionToken()`, `Record<>` lookups, top-level `export const` data, Angular decorators, and `signal()`/`inject()` as class-field initializers are all correct under `sideEffects:false`). Verification required naming the exact consumer import that retains unused code — *"name it or it's not a finding."* This is why 0 false positives survived and why findings rest on the non-shakeable `ɵcmp.dependencies` edge, not on decorator metadata.
- **Scope limitation:** "verified clean" rests on source inspection + **dist FESM forensics** (the shipped artifact's actual import edges and module scope) — not on a real consumer bundle produced by webpack/esbuild. That is a sound proxy (FESM edges are what a consumer bundler sees), but the two confirmed findings can be made *incontrovertible* with a one-shot empirical bundle: `esbuild` an `import { BreadcrumbsComponent } from '@cdevhub/ngx-tw/breadcrumbs'` entry and grep the output for `CdkMenu`; same for `ComboboxComponent` → `FormFieldComponent`. Recommended as a regression guard once fixes land.
