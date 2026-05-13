# ngx-tw Library Audit Ruleset

This document is the **mechanical checklist** auditors apply, component by component, to verify each entry in `projects/ngx-tw/` against the project's quality bar. Every rule is specific enough to answer pass/fail by reading the code, cites the relevant `.claude/CLAUDE.md` section or token where useful, and carries one of four severities — **CRITICAL** (correctness, a11y, breaks consumers), **MAJOR** (clear policy violation), **MINOR** (cosmetic/consistency), **NIT** (style). Apply the rules in order; copy the **Component audit template** at the bottom into a working note per component.

---

## 1. Structure & packaging

- **[CRITICAL]** Component lives in its own directory at `projects/ngx-tw/<name>/` (not nested under `src/lib/`, not collapsed into another component's directory). Library Structure section.
- **[CRITICAL]** Directory contains a `ng-package.json` with exactly `{ "lib": { "entryFile": "index.ts" } }` — confirming it is a secondary entry point.
- **[CRITICAL]** Directory contains an `index.ts` that re-exports the public API for that entry point. Internal symbols (classes prefixed `_`, JSDoc-tagged `@internal`) must NOT be re-exported.
- **[CRITICAL]** Directory is referenced from `projects/ngx-tw/src/public-api.ts` via `export * from 'ngx-tw/<name>';`.
- **[MAJOR]** File naming follows Angular v21 bare names — `button.ts`, `button.spec.ts` — NOT `button.component.ts`, `button.directive.ts`, or `button.module.ts`. Angular Conventions / Library Structure.
- **[MAJOR]** Class names follow Angular CLI conventions: `ButtonComponent`, `BadgeDirective`, `TooltipService`. No manual `Tw` prefix on component/directive classes; selectors keep their `tw-` / `twX` prefix unchanged. Shared types (and only shared types) carry the `Tw` prefix (`TwColor`, `TwSize`). Library Structure. Known violators slated for rename in PR4 / PR6 of the library fix plan: `TwSplit`, `TwSplitPane`, `TwSplitGutter`, `TwSplitPaneHeader`, `TwCalendarPresets`. Audit notes on these specific identifiers should reference the scheduled rename rather than reopen the policy debate.
- **[MAJOR]** Element-selector components use the `tw-` prefix (`tw-button`, `tw-card`). Attribute-selector directives use the `tw` camelCase prefix (`twBadge`, `twAlertIcon`). Library Structure.
- **[MAJOR]** Template files larger than ~50 lines use `templateUrl: './<name>.html'`; smaller templates are inline via `template:`. Templates section. A `<name>.html` file that contains 5 lines of markup is a MINOR violation; a 200-line inline template is a MAJOR violation.
- **[MINOR]** Component directory contains nothing other than the `index.ts`, `ng-package.json`, source files (`<name>.ts`, optional `<name>.html`), and `<name>.spec.ts`. Stray utilities, fixtures, or scratch files indicate cleanup is owed.
- **[MINOR]** Shared types or helpers used by more than one component live in `projects/ngx-tw/core/` and are re-exported from `core/index.ts` — not duplicated per component.

## 2. Angular v21 conventions

- **[CRITICAL]** No `@NgModule` is declared anywhere in the directory. What NOT To Do.
- **[CRITICAL]** `@Component` and `@Directive` metadata do NOT set `standalone: true` — it is the default in v21. Setting it explicitly is a violation. Angular Conventions.
- **[CRITICAL]** Every `@Component` sets `changeDetection: ChangeDetectionStrategy.OnPush`. Angular Conventions.
- **[CRITICAL]** Dependency injection uses `inject()` only. No constructor parameter injection (`constructor(private foo: Foo)`). Angular Conventions.
- **[CRITICAL]** Host bindings live exclusively in the `host: { ... }` metadata object. No `@HostBinding` decorators. No `@HostListener` decorators. Angular Conventions.
- **[CRITICAL]** Inputs use `input()` / `input.required()`. Outputs use `output()`. Two-way bindings use `model()`. No `@Input()` or `@Output()` decorators anywhere. Angular Conventions.
- **[CRITICAL]** Templates use native control flow only — `@if`, `@for`, `@switch`. No `*ngIf`, `*ngFor`, `*ngSwitch`. Angular Conventions.
- **[CRITICAL]** Templates use `[class]` and `[class.foo]` / `[style.bar]` bindings only. No `[ngClass]`. No `[ngStyle]`. Angular Conventions.
- **[CRITICAL]** No `mutate()` is ever called on a signal. Use `update()` or `set()`. Angular Conventions.
- **[MAJOR]** `computed()` is used for purely derived, read-only values. `linkedSignal()` is used only when the value initializes from a source signal AND can be independently overwritten by user interaction. Pure derivations implemented with `linkedSignal()` are a violation; controlled internal values implemented with `computed()` (cannot be `.set()` at runtime) are a violation. `computed()` vs `linkedSignal()` section.
- **[MAJOR]** Templates contain no arrow functions (`(click)="(() => doThing())()"`, `[class]="() => x"`). Method references and computed signals are the only permitted forms. Angular Conventions.
- **[MINOR]** `ChangeDetectionStrategy.OnPush` is declared on the component itself; relying on it being set via an ancestor or a host wrapper is a smell — make it explicit.

## 3. TypeScript

- **[CRITICAL]** No use of `any` in component, directive, or service source files. Use `unknown`, a concrete type, or a generic constraint. TypeScript section.
- **[MAJOR]** Public types exposed in `index.ts` use intentional names — `ButtonVariant`, `AlertVariant`, `TabsVariant`. Internal-only types live in the component file and are NOT re-exported.
- **[MAJOR]** `index.ts` re-exports only what consumers need (components, directives, services, public types, public tokens). No `export *` from the component source file unless every symbol in that file is intentionally public.
- **[MINOR]** Type imports use `import type { ... }` when the symbol is only used as a type. TypeScript section ("prefer type inference when obvious" — and treat type-only imports as the obvious case).
- **[NIT]** Strict mode is honoured: no `// @ts-ignore`, no `// @ts-expect-error` without an inline justification comment.

## 4. JSDoc

- **[CRITICAL]** Every `input()`, `input.required()`, `model()`, and `output()` declaration in the public class has a JSDoc comment immediately above it. Missing JSDoc means Compodoc-generated demo API tables are empty. JSDoc Requirements.
- **[CRITICAL]** Every public method on directives and services has JSDoc. JSDoc Requirements.
- **[MAJOR]** JSDoc describes **purpose and behavior**, not TypeScript types — Compodoc extracts type information automatically. Comments like `/** A string. */` or `/** ButtonVariant. */` are violations.
- **[MAJOR]** Each input's JSDoc states its default value when one exists (e.g., `Defaults to 'solid'.`). The default in the JSDoc must match the actual `input(<default>)` argument. JSDoc Requirements / format example.
- **[MAJOR]** Output JSDoc states when it fires AND what its payload contains.
- **[MINOR]** Description is one line where possible. Multi-line descriptions are reserved for nuanced behavior.
- **[MINOR]** Internal members (`contentChild()`, helper signals, view children) used purely for template plumbing carry `/** @internal */` so Compodoc excludes them — but only if they MUST be public on the class for templating reasons.

## 5. Styling

- **[CRITICAL]** No `.css`, `.scss`, or `styleUrls` / `styles` array on any component. Tailwind utilities only, applied via `host` class bindings or template class attributes. Styling section, What NOT To Do.
- **[CRITICAL]** No raw Tailwind palette colors (`bg-blue-*`, `text-red-*`, `border-indigo-*`, `bg-slate-*`, `text-gray-*`, etc.) anywhere in component code. Use semantic tokens: `primary`, `secondary`, `accent`, `neutral`, `info`, `success`, `warning`, `error`. Semantic Color Tokens.
- **[CRITICAL]** No raw `neutral-*` shades (`bg-neutral-50`, `text-neutral-500`, `border-neutral-200`) for structural styling. Use surface tokens (`surface`, `surface-raised`, `surface-overlay`, `surface-sunken`, `surface-muted`), fg tokens (`fg`, `fg-muted`, `fg-subtle`), and border tokens (`border`, `border-muted`, `border-strong`) instead. Surface, Foreground & Border Tokens.
- **[CRITICAL]** No hardcoded colors (`#fff`, `rgb(...)`, `oklch(...)`) and no hardcoded pixel sizes in component classes. Use Tailwind tokens. Styling section.
- **[CRITICAL]** No usage of `@angular/animations` anywhere in component source: no `animations: [...]` metadata, no `trigger(...)`, no `state(...)`, no `style(...)`, no `transition(...)`, no `useAnimation`. DOM enter/leave must use Angular's native `animate.enter="<class>"` and `animate.leave="<class>"` features. Enter/Leave Animations section, What NOT To Do.
- **[CRITICAL]** Every interactive (focusable) element shows a visible focus indicator using the exact pattern `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`. No `focus:outline-*` (without `-visible`). Focus Rings. **Carve-out:** elements with `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"` MAY substitute a `focus-visible:bg-surface-muted` background-shift indicator (canonical example: `projects/ngx-tw/menu/menu.ts`). The carve-out does not extend to `option`, `tab`, `treeitem`, or any other focusable role.
- **[MAJOR]** Animation keyframes referenced by `animate.enter` / `animate.leave` are defined in `projects/ngx-tw/theme/default.css` (or theme partials), NOT inside the component. Components reference class names only. Enter/Leave Animations.
- **[MAJOR]** Color-specific variants (alert color, button color, tab active color) use `{color}-{shade}` tokens with the `dark:` variant added explicitly when the consumer's theme needs override (the project memory documents `dark:bg-{color}-900/X` as a convention, not a violation). Structural styling (neutral backgrounds/text/borders) uses surface/fg/border tokens and relies on the theme for dark mode — no per-component `dark:` overrides for structural pieces. Surface, Foreground & Border Tokens — "usage rule".
- **[MAJOR]** Border radius values come from the approved scale: `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`, `rounded-none`. Use of `rounded`, `rounded-sm`, `rounded-2xl`, `rounded-3xl` is a violation. Border Radius.
- **[MAJOR]** Padding follows the spacing scale per size token: `p-2`/`p-3`/`p-4`/`p-6`/`p-8` for block containers, OR the inline pattern `px-2 py-1`, `px-3 py-1.5`, `px-4 py-2`, `px-5 py-2.5`, `px-6 py-3` for inline triggers. Custom asymmetric padding outside this scale is a violation unless documented as a deliberate exception. Spacing Scale.
- **[MAJOR]** Flex/grid `gap-*` values are one of `gap-1`, `gap-1.5`, `gap-2`, `gap-3`. `gap-0.5`, `gap-4`, `gap-5`, or larger are violations. Gap Values.
- **[MAJOR]** Font sizes use the approved scale: `text-2xs`, `text-xs`, `text-sm`, `text-base`. `text-lg`, `text-xl`, and larger are NOT permitted in component code (headings inside projected content are the consumer's responsibility). Trigger font sizes follow the size→font map (`xs`→`text-xs`, `sm`/`md`→`text-sm`, `lg`/`xl`→`text-base`). Typography.
- **[MAJOR]** No arbitrary font-size values (`text-[11px]`, `text-[0.6875rem]`, `text-[12px]`, etc.). Use `text-2xs` for the 11px step. Typography ("Never use arbitrary font-size values").
- **[MAJOR]** Shadows are limited to `shadow-sm`, `shadow`, `shadow-md`. `shadow-lg`, `shadow-xl`, `shadow-2xl` are violations. Shadows.
- **[MAJOR]** Transitions specify their properties: `transition-colors`, `transition-shadow`, or `transition-[a,b]`. `transition-all` is a violation. Durations are `duration-150` (fast) or `duration-200` (standard) — other durations require justification. Transition declarations always include `motion-reduce:transition-none`. Transitions.
- **[MAJOR]** Icon sizing uses one of the four approved sub-scales — and a single icon does not mix sub-scales. **Glyph icons:** `size-4` / `size-5` / `size-10`. **Square interactive targets** (icon-only buttons, paginator chevrons, stepper indicators, sort-header arrows): `size-6` / `size-7` / `size-8` / `size-9` mapped to xs / sm / md / lg. **Dot indicators** (stepper dots, presence markers): `size-2` / `size-2.5` / `size-3`. **Half-step decorative** (`size-3.5`) is permitted only for xs-density chevrons and only when accompanied by an inline comment explaining why neither `size-3` nor `size-4` lines up. Icons inside flex containers carry `shrink-0`. Icons next to multi-line text carry `mt-0.5` to align with the first baseline. Icon Sizing.
- **[MAJOR]** Disabled state styling: containers use `opacity-50 pointer-events-none`; individual disabled controls in a group use `disabled:opacity-30 disabled:cursor-default`. Hardcoded opacities outside `opacity-50`, `opacity-70`, `opacity-30` are violations. Opacity & Disabled States.
- **[MAJOR]** Structural borders use `border-border`, `border-border-muted`, or `border-border-strong` at 1px width. Semantic borders for color variants use `border-{color}-300` at 1px. Active indicators (tab underlines, selection marks) use `border-{color}-500` at 2px (`border-b-2`, `border-r-2`). `border-2` or thicker on structural borders is a violation. Borders.
- **[MAJOR]** Hover patterns follow the table: elevated → `hover:shadow-md`; outlined → `hover:border-border-strong`; filled/ghost → `hover:bg-surface-muted` or `hover:bg-surface-sunken`; icon buttons → `hover:opacity-100` or `hover:bg-surface-muted`; text triggers → `hover:text-fg` or `hover:bg-surface-muted`. Hover States.
- **[MINOR]** Cursors: interactive elements set `cursor-pointer`; disabled controls use `disabled:cursor-not-allowed` (or `disabled:cursor-default` for in-group disabled). Non-interactive elements inherit the default cursor. Cursor States.
- **[MINOR]** Containers with rounded corners that clip children carry `overflow-hidden`. Scrollable areas use `overflow-x-auto` / `overflow-y-auto`. Flex children that may truncate carry `min-w-0`. Overflow & Scrolling.
- **[NIT]** Hidden scrollbars use a dedicated CSS class with `scrollbar-width: none` and `::-webkit-scrollbar { display: none }` rather than inline styles. Overflow & Scrolling.

## 6. Variants

- **[CRITICAL]** All variant-driven class strings flow through a single `tv()` config defined inline in the component file. Manual string concatenation of variant classes, `if`-ladders building class lists, or external variant config files are violations. Variants section.
- **[CRITICAL]** `tv()` is called with `{ twMerge: true }` as the second argument. Missing `twMerge` breaks consumer class overrides. Consumer Customization.
- **[CRITICAL]** The `tv()` config defines `defaultVariants` covering every variant key. Missing defaults mean the component fails when used with zero configuration. Variants section.
- **[CRITICAL]** Components that expose `color` or `size` inputs use the shared `TwColor` / `TwSize` types imported from `ngx-tw/core`. Locally re-declared `Color` or `Size` union types are violations. Component API Design ("Shared variant types").
- **[CRITICAL]** Multi-part components use `slots: { root, ... }` and route each slot's classes to the relevant element. Single-element components use a flat `base:` config. Mixing slot config with `class:` instead of `class: { root: ... }` in `compoundVariants` is a violation.
- **[MAJOR]** Variant inputs wire to the host class via `computed()` and the host metadata pattern `host: { '[class]': 'classes()' }` (single-element) or `host: { '[class]': 'rootClasses()' }` with per-slot computeds for sub-directives (`headerClasses`, `bodyClasses`, etc.). Direct `[class]` bindings inlining variant logic in templates are a violation when a `tv()` config exists.
- **[MAJOR]** `compoundVariants` is used when combinations of variants need special styling (e.g., `variant: 'outline'` + `color: 'primary'`). Building one mega-variant per combination instead of using `compoundVariants` is a violation.
- **[MAJOR]** The `tv()` config is NOT exported from the file (`buttonVariants` stays private). Variants section.
- **[MINOR]** Active-state class maps that must be statically present for Tailwind v4 scanning (e.g., the `UNDERLINE_ACTIVE_HORIZONTAL` records in `tabs.ts`) are declared as `const ... : Record<TwColor, string>` next to the `tv()` config — this is acceptable, but every dynamic class string must still appear literally somewhere in the file.

## 7. Consumer customization

- **[CRITICAL]** No `@NgModule` is declared. Components, directives, services, and tokens are exported directly. What NOT To Do.
- **[CRITICAL]** **Services** do NOT set `providedIn: 'root'`. Consumers control injection scope. What NOT To Do. Stateless **policy tokens** are exempt (see the `providedIn: 'root'` entry in §12 anti-patterns).
- **[MAJOR]** Content slots use `<ng-content>` (and `<ng-content select="...">` when discrimination is needed). Avoid wrapper `<div>` elements that exist only to receive projection. Consumer Customization.
- **[MAJOR]** Optional slots with a meaningful default provide fallback content inside `<ng-content>` (e.g., a default dismiss icon, a placeholder avatar). Structural slots (header/body/footer of a card) do NOT provide fallback — instead, the component uses `contentChild()` and `@if` to detect presence and omits the region entirely when absent. Content Projection Fallback.
- **[MAJOR]** Complex slot customization (e.g., a custom tab trigger template, a custom card header layout) uses template directives (`*twTabTrigger`, `*twCardHeader`) rather than overloading inputs with raw HTML. Consumer Customization.
- **[MAJOR]** Components must work with ANY consumer theme — no internal assumptions about palette mapping (e.g., "primary is blue"). Semantic tokens only.
- **[MINOR]** Wrapper services that only delegate to a CDK primitive or wrap one or two lines of logic are forbidden. What NOT To Do.

## 8. Form compatibility

- **[CRITICAL]** Any component that accepts user input or represents a value the user can change (input, select, checkbox, switch, radio, slider, datepicker, etc.) implements `ControlValueAccessor` from `@angular/forms` and registers itself via `NG_VALUE_ACCESSOR` in `providers`. Form Compatibility.
- **[CRITICAL]** `writeValue(value)` updates the rendered state (synchronizes the internal signal/state with the externally-supplied value).
- **[CRITICAL]** User interaction calls the registered `onChange(value)` callback with the new value AND the registered `onTouched()` callback at the appropriate moment (typically on blur or interaction).
- **[CRITICAL]** `setDisabledState(isDisabled)` applies the disabled appearance AND prevents user interaction (blocks click handlers and keyboard input — not just adds `opacity-50`).
- **[MAJOR]** The component is verified to work with all three Angular form strategies: template-driven (`[(ngModel)]`), reactive (`[formControl]` / `formControlName`), and signal-based forms. The spec demonstrates at least one of each in test hosts. Form Compatibility.
- **[MAJOR]** Reset behavior is wired via `onFormReset()` from `ngx-tw/core` (or an equivalent listener) — internal draft/UI state clears on `formGroup.reset()` / `control.reset()`. See `projects/ngx-tw/core/form-reset.ts`.
- **[MINOR]** The component uses `forwardRef(() => <ComponentClass>)` in the `NG_VALUE_ACCESSOR` provider — the canonical Angular pattern for self-referential providers.

## 9. API design

- **[CRITICAL]** Boolean inputs default to `false`. An input `disabled = input(true)` is a violation. Component API Design. **Codified exception:** an input MAY default to `true` when the resting "off" state would surprise consumers AND the rationale is documented in an inline JSDoc comment above the input declaration. Audit-approved list: `spinner.track`, `accordion.collapsible`, `calendar.bordered`, `calendar.allowSingleDayRange`, `calendar.persistPartialRange`, `calendar.showAdjacentMonths`. New `default true` inputs without justification remain CRITICAL violations.
- **[CRITICAL]** Two-way bindings use `model()`. Inputs that the parent will never re-set use `input()`. A `model()` declaration for a one-way input is a violation; using a plain `input()` where the parent needs `[(prop)]` syntax is a violation. Component API Design / Angular Conventions.
- **[CRITICAL]** Components that expose `color` use the shared `TwColor` type from `ngx-tw/core`. Components that expose `size` use `TwSize`. No local `'primary' | 'secondary' | ...` re-declarations.
- **[MAJOR]** Outputs follow Angular's `propertyChange` pattern (`valueChange`, `openedChange`) for state-mirroring events AND past tense (`closed`, `selected`, `dismissed`) for action events. Both conventions coexist — neither alone is required (the user memory explicitly confirms both patterns are correct). Imperative-mood names like `clickHandler` or `onClose` are violations.
- **[MAJOR]** Inputs are named with adjectives for state (`disabled`, `selected`, `dismissible`, `closable`) and nouns for data (`label`, `color`, `size`, `value`). `onDisabled` or `setColor` as input names are violations. Component API Design.
- **[MAJOR]** Total input count is **≤ 5–6 per component**. More signals over-configuration; the fix is content projection or splitting into multiple components. Component API Design. **Exceptions** (codified — note in the audit which exception applies and treat the overage as acceptable):
    - **Overlay-bearing components** (dialog, popover, tooltip, menu, command-palette, select, calendar/date-picker, time-picker) — CDK overlay primitives demand a wider configuration surface. See `feedback_input_count_overlay`.
    - **Form controls** (checkbox, radio, switch, slider, input, form-field) — ARIA + Forms baseline (`aria-label{ledby,by}`, `name`, `label`, `description`, `required`, `disabled`, `labelPosition`, plus `color`/`size`/`variant`) is ~12 inputs minimum. Canonical: `checkbox` (12+ inputs). See `feedback_input_count_form_control`.
    - **Structural-layout primitives** (split + sub-parts) — each input is an independent geometric or behavioural axis. Canonical: `SplitComponent` (10) + `SplitPaneComponent` (8). See `feedback_input_count_structural`.
    - **Data primitives** (table) — multiple orthogonal config axes (appearance, sticky, responsive, selection). **Time-bounded:** PR8 reshapes table into config objects; once PR8 lands the exception ends and the cap re-applies to the new top-level shape. Canonical (current): `TableComponent` (19), `ColumnComponent` (10). See `feedback_input_count_data`.
  Visual primitives (avatar, icon) and decorative primitives (progress-bar) are NOT exempt — reshape with config objects (PR7, PR9).
- **[MAJOR]** Prefer a single `variant` input for the primary visual axis (`solid | outline | ghost | soft | link`). Independent axes use separate inputs (`color`, `size`). A component exposing `solidPrimary | outlinePrimary | solidSecondary | outlineSecondary` as a single union instead of `variant` × `color` is a violation. Component API Design.
- **[MAJOR]** Rich content uses content projection, NOT a `label` / `text` / `content` input. A button's label comes from `<ng-content>`, not `<tw-button [label]="...">`. Component API Design.
- **[MINOR]** Inputs use `readonly` modifier (`readonly variant = input(...)`) so they cannot be reassigned inside the class.

## 10. Accessibility

- **[CRITICAL]** Every interactive component carries the appropriate ARIA role on its host (or applies it within the template for compound widgets): `role="button"`, `role="alert"`, `role="tablist"` / `role="tab"` / `role="tabpanel"`, `role="checkbox"`, `role="switch"`, `role="menu"` / `role="menuitem"`, `role="dialog"`, etc.
- **[CRITICAL]** State-reflecting ARIA attributes are wired to signals and update automatically: `aria-expanded`, `aria-selected`, `aria-checked`, `aria-disabled`, `aria-busy`, `aria-pressed`, `aria-controls`, `aria-labelledby`, `aria-describedby`. Static or missing values when the component has state are violations.
- **[CRITICAL]** Visible focus indicator on every focusable element using the focus-ring pattern (see Styling rule). No `outline-none` without a paired visible focus style.
- **[CRITICAL]** Disabled interactive elements EITHER set the native `disabled` attribute (on `<button>`, `<input>`, etc.) OR set `aria-disabled="true"` with `tabindex="-1"` and `pointer-events-none` (for non-native elements like `<a>` or `<div role="button">`). The button directive does both, conditionally. Mixing them or omitting one is a violation.
- **[CRITICAL]** Keyboard behavior is defined and tested for every interactive component:
  - Buttons / triggers: `Enter`, `Space` activate.
  - Tabs / segmented controls: `ArrowLeft` / `ArrowRight` (horizontal) or `ArrowUp` / `ArrowDown` (vertical) navigate, `Home` / `End` jump, disabled tabs are skipped.
  - Menus / select: `ArrowDown` / `ArrowUp`, `Home` / `End`, `Esc` closes, type-ahead where applicable.
  - Dialog / popover: `Esc` closes, focus trap on open, focus returns to trigger on close.
- **[CRITICAL]** Focus management for overlays uses CDK's `FocusTrap` / `ConfigurableFocusTrap`. Focus return uses `FocusMonitor` or explicit `previouslyFocusedElement.focus()`. Hand-rolled focus traps are violations. Accessibility section.
- **[CRITICAL]** Status / live regions use CDK's `LiveAnnouncer.announce()`. Hard-coded `aria-live` regions without announcements are insufficient when content changes dynamically. Accessibility section.
- **[MAJOR]** Visible focus styling uses `focus-visible:` (not `focus:`). Mouse users do not see the ring.
- **[MAJOR]** Long descriptions / tooltips that should be exposed to AT use `AriaDescriber` from CDK rather than ad-hoc `aria-describedby` wiring.
- **[MAJOR]** Component spec asserts ARIA attributes are present in the default state AND update on state change (`aria-expanded`, `aria-selected`, etc.). Testing — Accessibility.
- **[MAJOR]** Component passes AXE checks. Run the demo route through axe-core (or the standing e2e harness) and confirm zero violations of severity "serious" or "critical".
- **[MINOR]** Icons that are purely decorative carry `aria-hidden="true"`. Icons that convey meaning carry an accessible label (via `aria-label` on the parent, `aria-labelledby`, or visible text).

## 11. Testing

- **[CRITICAL]** A `<name>.spec.ts` exists in the component directory and is non-empty.
- **[CRITICAL]** Tests import from `'vitest'`: `import { describe, it, expect, vi, beforeEach } from 'vitest';`. Tests must NOT import from Jasmine or Jest. Testing — Vitest-specific rules.
- **[CRITICAL]** Tests do NOT use `fakeAsync` or `tick` — neither is supported by the Vitest runner. Asynchronous flows use `async/await` with `fixture.whenStable()`. Timer control uses `vi.useFakeTimers()` + `vi.runAllTimers()`. Testing — Vitest-specific rules, What NOT To Do.
- **[CRITICAL]** Spies use `vi.spyOn(...)`. Jasmine-style `spyOn(...)` and `createSpy(...)` are not available. Testing — Vitest-specific rules.
- **[CRITICAL]** Signal inputs are set via `fixture.componentRef.setInput('name', value)`, then `fixture.detectChanges()` is called before any DOM assertion. Direct assignment to `fixture.componentInstance.someInput = ...` does not work for signal inputs. Testing — What to test ("Inputs and outputs").
- **[CRITICAL]** The spec covers, at minimum:
  - **Rendering** — default render with zero inputs, each value of `variant`/`color`/`size` renders, conditional content appears/disappears with state. Testing — What to test (Rendering).
  - **Inputs/outputs** — every input changes the DOM observably; every output emits with the correct payload. Testing — What to test (Inputs and outputs).
  - **Interaction** — click, keyboard, focus events produce expected DOM changes and output emissions; disabled state suppresses output. Testing — What to test (Interaction).
  - **Accessibility** — correct ARIA roles/attributes present by default AND update when state changes. Testing — What to test (Accessibility).
  - **Content projection** — fallback content renders when nothing is projected; projected content replaces fallback when provided. Testing — What to test (Content projection).
  - **ControlValueAccessor** (form controls only) — `writeValue()` updates the rendered state; user interaction calls `onChange` with the right value; `setDisabledState(true)` blocks interaction. Testing — What to test (ControlValueAccessor).
- **[MAJOR]** Tests query the DOM (`fixture.nativeElement.querySelector(...)`, `getByTestId(...)`) and assert observable behavior — text content, classes that affect rendering, ARIA attributes. They do NOT assert internal signal values, computed property results, or method invocations. Testing — What NOT to test.
- **[MAJOR]** Tests do NOT assert specific class names as the primary observation (`expect(el.className).toContain('bg-blue-500')` for the sake of asserting that class). Assertions on classes are acceptable only when the class is the OBSERVABLE behavior (e.g., asserting `opacity-50` is present is the only way to observe "looks disabled"). Testing — What NOT to test.
- **[MAJOR]** Tests do NOT depend on CDK internals (`FocusTrap.trapFocus` was called with X, `Overlay._attachedPortal` is non-null). Mock CDK at the boundary or test the visible result. Testing — What NOT to test.
- **[MINOR]** Test host components are declared at the top of the spec, one per scenario shape, and given descriptive names (`BasicButtonHost`, `DisabledAnchorHost`, `IconButtonHost`). Inlining test markup into each `it()` is harder to scan.
- **[MINOR]** `beforeEach` configures `TestBed` once per `describe` block; per-test setup beyond signal-input changes lives inside the `it()` body.

## 12. Anti-patterns (explicit "should NOT find" list)

Auditor's red-flag list — finding any of these is an automatic violation. Severities follow the rule that originally banned the practice.

- **[CRITICAL]** `@NgModule` declaration. (What NOT To Do.)
- **[CRITICAL]** `import { ... } from '@angular/animations';` — anywhere. (Enter/Leave Animations / What NOT To Do.)
- **[CRITICAL]** Component CSS file (`.css`, `.scss`) or `styleUrls` / `styles` array. (Styling / What NOT To Do.)
- **[CRITICAL]** Raw Tailwind palette colors in component code: `bg-blue-*`, `text-red-*`, `border-indigo-*`, `bg-slate-*`, `bg-gray-*`, etc. (Semantic Color Tokens / What NOT To Do.)
- **[CRITICAL]** Raw `neutral-*` shades for structural styling (`bg-neutral-100`, `text-neutral-500`, `border-neutral-200`). (Surface/Fg/Border Tokens / What NOT To Do.)
- **[CRITICAL]** `signal.mutate(...)` call. (Angular Conventions.)
- **[CRITICAL]** Constructor parameter injection (`constructor(private foo: Foo)`). (Angular Conventions.)
- **[CRITICAL]** `@HostBinding` or `@HostListener` decorator. (Angular Conventions.)
- **[CRITICAL]** `@Input()` or `@Output()` decorator. (Angular Conventions.)
- **[CRITICAL]** `fakeAsync` or `tick` import from `@angular/core/testing` used inside a spec. (Testing — Vitest-specific rules / What NOT To Do.)
- **[CRITICAL]** `*ngIf`, `*ngFor`, `*ngSwitch` in a template. (Angular Conventions.)
- **[CRITICAL]** `[ngClass]` or `[ngStyle]` in a template. (Angular Conventions.)
- **[CRITICAL]** Arbitrary font-size value in classes (`text-[11px]`, `text-[0.6875rem]`). (Typography.)
- **[MAJOR]** Hardcoded hex / `rgb()` / `oklch()` color in a component class string. (Styling.)
- **[MAJOR]** `transition-all` utility. (Transitions.)
- **[MAJOR]** `shadow-lg`, `shadow-xl`, `shadow-2xl`. (Shadows.)
- **[MAJOR]** `rounded`, `rounded-sm`, `rounded-2xl`, `rounded-3xl`. (Border Radius.)
- **[MAJOR]** `gap-0.5`, `gap-4`, `gap-5`, or larger. (Gap Values.)
- **[MAJOR]** `text-lg`, `text-xl`, or larger anywhere in component code. (Typography.)
- **[MAJOR]** `border-2` (or thicker) on a structural border. (Borders.)
- **[MAJOR]** `providedIn: 'root'` on a library **service**. (What NOT To Do.) Stateless **policy tokens** are exempt — canonical: `TW_ERROR_STATE_MATCHER` in `ngx-tw/core`. The exemption requires: no per-consumer state, single canonical default, no behavior worth scoping. Audit notes on the canonical token should record "policy-token exception" rather than open a finding.
- **[MAJOR]** Wrapper service that only delegates to a CDK primitive. (What NOT To Do.)
- **[MAJOR]** Helper utility / single-use abstraction. (What NOT To Do.)
- **[MAJOR]** `standalone: true` set explicitly in `@Component` / `@Directive`. (Angular Conventions.)
- **[MAJOR]** `tv()` call missing `{ twMerge: true }` as second argument. (Consumer Customization.)
- **[MAJOR]** `tv()` call missing `defaultVariants`. (Variants.)
- **[MAJOR]** `<name>.component.ts` / `<name>.directive.ts` / `<name>.module.ts` file naming. (Library Structure.)
- **[MAJOR]** Locally-declared `Color = 'primary' | ...` instead of importing `TwColor` from `ngx-tw/core`. (Component API Design.)
- **[MINOR]** Arrow function in a template binding (`(click)="(() => ...)()"`). (Angular Conventions — "Do not write arrow functions in templates".)
- **[MINOR]** `// @ts-ignore` without explanation. (TypeScript — strict mode honour.)

---

## Component audit template

Copy this block per component into the auditor's working notes. Mark each cell `PASS` / `FAIL` / `N/A` and add a short note where helpful. The "Overall verdict" cell summarizes the highest-severity finding.

```markdown
### Component: `<name>` — audited <YYYY-MM-DD>

Location: `projects/ngx-tw/<name>/`
Files: `<name>.ts`, `<name>.html` (optional), `<name>.spec.ts`, `index.ts`, `ng-package.json`
Inputs declared: <count>  · Outputs declared: <count>  · Models declared: <count>
Form control? <yes/no>  · Overlay-bearing? <yes/no>  · CVA implemented? <yes/no>

#### Category results

| # | Category | Result | Highest severity | Notes |
|---|---|---|---|---|
| 1 | Structure & packaging | PASS / FAIL | — | |
| 2 | Angular v21 conventions | PASS / FAIL | — | |
| 3 | TypeScript | PASS / FAIL | — | |
| 4 | JSDoc | PASS / FAIL | — | |
| 5 | Styling | PASS / FAIL | — | |
| 6 | Variants | PASS / FAIL | — | |
| 7 | Consumer customization | PASS / FAIL | — | |
| 8 | Form compatibility | PASS / FAIL / N/A | — | N/A if not a form control |
| 9 | API design | PASS / FAIL | — | input count: <n> (overlay exception: <yes/no>) |
| 10 | Accessibility | PASS / FAIL | — | AXE run: <yes/no>, zero serious/critical: <yes/no> |
| 11 | Testing | PASS / FAIL | — | spec coverage: rendering / inputs / outputs / interaction / a11y / projection / CVA |
| 12 | Anti-patterns | PASS / FAIL | — | list any matches |

#### Findings (one row per failing rule)

| Severity | Category | Rule | Location (file:line) | Fix proposal |
|---|---|---|---|---|
| CRITICAL / MAJOR / MINOR / NIT | 1–12 | short rule restatement | `<name>.ts:42` | one-line proposed fix |

#### Overall verdict

- Status: **READY** / **NEEDS WORK** / **BLOCKED**
- Blocking issues (CRITICAL count): <n>
- Policy issues (MAJOR count): <n>
- Polish (MINOR/NIT count): <n>
- Recommended next action: <one sentence>
```
