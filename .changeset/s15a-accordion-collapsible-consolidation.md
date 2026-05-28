---
"ngx-tw": minor
---

S15a — Accordion + collapsible-group consolidation (design decision D1). `AccordionComponent` now extends `CollapsibleGroupComponent`, dropping ~80 lines of duplicate keyboard / toggle / sync wiring. Two breaking surface changes — both pre-1.0 — plus accordion a11y fixes per APG.

**Breaking — `value` default and type widened (both `<tw-accordion>` and `<tw-collapsible-group>`).**

The `value` model previously typed `string | string[]` with a `''` default. The empty-string sentinel was awkward in accordion mode (it conflated "no panel open" with "panel with `value=''` is open") and impossible to round-trip in `'multiple'` mode (where an empty array is the natural "none" state). The model is now typed `string | string[] | null` and defaults to `null`. The single-mode close branch in `CollapsibleGroupComponent.toggleItem()` now writes `null` instead of `''`.

The change is breaking for both components because they share the same parent declaration after the inheritance refactor — `AccordionComponent` no longer redeclares `value` (signal `model()` overrides cannot narrow the type per Angular's `ModelSignal` invariance), so widening the default on `CollapsibleGroupComponent` is the only viable single-source-of-truth.

Migration:
- Replace `value === ''` checks with `value === null` (or use a nullish-coalescing fallback like `value ?? 'none'`).
- Consumer signals previously typed `signal<string | string[]>('')` should widen to `signal<string | string[] | null>(null)`.
- Templates that read `{{ value }}` continue to work — both `null` and `''` render as empty.

**a11y fix (accordion) — drop wrapper `role="group"`.**

Per APG's accordion pattern, the accordion wrapper does not need a role; the per-panel header/region structure plus `aria-multiselectable` on the wrapper is sufficient. The previous `host: { 'role': 'group' }` literal is removed. `CollapsibleGroupComponent` retains `role="group"` as its default — the group component is the generic primitive (no APG pattern in play) and the role helps screen-reader navigation. The accordion overrides via the new `hostRole` computed (`override readonly hostRole = computed(() => null)`).

**a11y fix (accordion) — `aria-multiselectable` is now explicit in both modes.**

Previously the host binding was `"type() === 'multiple' || null"`, which emitted `'true'` in multiple mode and dropped the attribute entirely in single mode. Per APG (https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), accordions with `type="single"` should expose `aria-multiselectable="false"` explicitly so assistive tech can confirm the semantic. The binding is now `"type() === 'multiple' ? 'true' : 'false'"` — emits both values, never absent.

**Refactor — `AccordionComponent extends CollapsibleGroupComponent`.**

`AccordionComponent` lost its private `keyManager`, two `effect()` blocks (value-watcher + key-manager-builder), `syncChildrenFromValue()`, `toggleItem()`, and `onTriggerKeydown()` — all inherited from the parent. `CollapsibleGroupComponent` gained two protected virtual hooks the subclass overrides:

- `isAccordionMode()` — defaults to `this.accordion()`; `AccordionComponent` overrides to `this.type() === 'single'`. All internal logic (value-sync effect, dev-mode warn, `syncChildrenFromValue`, `toggleItem`) reads the mode through this hook so the subclass's `type` input is honoured without the subclass having to redeclare any signal inputs.
- `canCollapseSingleMode()` — defaults to `true`; `AccordionComponent` overrides to `this.collapsible()`. Honours the accordion's collapsible opt-out.

The parent's `[class]` and `[attr.role]` host bindings now read overridable `hostClasses` and `hostRole` computeds (rather than the previous literal `'role': 'group'` and inline string). `AccordionComponent` overrides both — `hostClasses` becomes the variant-driven container string (`accordionVariants({ variant: this.variant() }).root()`), `hostRole` becomes `null`.

The `providers: [{ provide: CollapsibleGroupComponent, useExisting: forwardRef(() => AccordionComponent) }]` block stays — Angular DI uses class identity, not the prototype chain, so descendant collapsibles' `inject(CollapsibleGroupComponent)` still needs the explicit `useExisting` even though the inheritance relationship exists.

The `AccordionComponent` class is now 121 lines (was 213) — 43% reduction.

**Internal — `CollapsibleTriggerDirective` `ViewEncapsulation.None` justification.**

The directive is template-bearing (renders the default chevron SVG when no `[twCollapsibleIcon]` is projected). Its host is the consumer's `<button>` — emulated-encapsulation would scope the styles to the directive's own shadow tree but the host lives outside that tree, so the classes never reach it. A one-line comment above `encapsulation: ViewEncapsulation.None` now records this rationale so the declaration doesn't read as a stray escape hatch.

**Dev-mode warn messages — wording tightened.**

The dev-mode value-shape warnings inside `CollapsibleGroupComponent` previously referenced `\`accordion\` is true` / `\`accordion\` is false`. Since the mode is now read via `isAccordionMode()` (which the accordion subclass drives from `type`), the messages reference "accordion mode" / "independent mode" rather than the literal `accordion` input. The existing spec assertions match on `expect.stringContaining('accordion')` / `expect.stringContaining('independent')`, both still satisfied.

**Spec coverage.**

`accordion.spec.ts` updates:
- The `should set role="group" on the host` test flips to `should NOT set role="group" on the host (per APG)`.
- The `should NOT set aria-multiselectable in single mode` test flips to `should set aria-multiselectable="false" explicitly in single mode (per APG)`.
- The `should close the open panel when re-clicked` test now asserts `active()` is `null` (was `''`).
- A new `Value default` describe asserts `value` defaults to `null` on mount.
- A new `Parity with tw-collapsible-group accordion` describe with 3 tests renders both `<tw-accordion type="single">` and `<tw-collapsible-group accordion>` side-by-side in a single fixture and asserts identical click-toggle DOM/value behaviour, identical `aria-expanded` propagation, and identical `ArrowDown` keyboard navigation — the guardrail against silent divergence between the two surfaces.

`collapsible.spec.ts`: only host signal types widened (`signal<string | string[]>(...)` → `signal<string | string[] | null>(...)`). The dev-mode warn assertions still match the new wording via `stringContaining`.

Spec count: 2583 passing / 4 pre-existing skipped (was 2579 at S14). 4 net new tests.

**Demo updates.**

`accordion-examples.component.ts` and `collapsible-examples.component.ts` widen their `value` signal types from `signal<string | string[]>(...)` to `signal<string | string[] | null>(...)` to match the new model surface. The accordion examples' `formatValue` helper now renders `null` as `"'none'"` (instead of stringifying to `"'null'"`); the collapsible examples already used `val || 'none'` and handle `null` correctly without changes.

**Unresolved risk for reviewers.**

- **Inherited `accordion` input on `AccordionComponent`.** Because Angular signal-`input()` overrides cannot narrow types and the parent's input surface is inherited intact, `<tw-accordion [accordion]="true">` is technically bindable on the subclass. The subclass ignores the input (its `isAccordionMode()` reads `type`, not `accordion`), so a stray binding is silently inert rather than incorrect — but it is undocumented surface noise. JSDoc on the parent's `accordion` input now flags the inertness when used through the subclass; future consumers reading the Compodoc API table will see both inputs documented. A follow-up could rename the parent's input or split into separate parent/child classes if this proves confusing.
- **Host metadata is inherited across `extends`** (verified empirically — the initial naive refactor failed three tests because the parent's literal `role: 'group'` and `[class]` binding leaked through). The current fix routes both bindings through overridable computeds (`hostRole`, `hostClasses`). Reviewers introducing new host bindings on either component must remember the inheritance behaviour: literal host attributes are inherited and CANNOT be unset by a subclass (only overridden via a binding); binding expressions evaluate against the actual instance and DO respect subclass property overrides.
- **`ViewEncapsulation` for the trigger.** The justification comment is accurate, but `CollapsibleTriggerDirective` could alternatively be modelled as a plain `@Directive` (no template) by moving the default-chevron SVG into a sibling `<ng-content>` slot or a separate component. The current Component-as-directive design is the simpler shape and the comment now explains the encapsulation choice; a structural refactor is out of scope for S15a.
