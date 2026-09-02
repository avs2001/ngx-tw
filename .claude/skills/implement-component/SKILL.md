---
name: implement-component
description: >
  Implements a production-grade ngx-tw Angular component from a prompt document.
  Use this skill whenever the user says "implement", "build", "create", or "code"
  a component, directive, pipe, or service for the ngx-tw library — especially when
  a prompt doc already exists in docs/prompts/. Also trigger when the user says
  "run the prompt" or "implement from the spec". Do NOT skip this skill and implement
  freehand — it enforces the full quality checklist that makes components production-grade.
tools: Read, Write, Glob, Grep, Bash
---

# implement-component

Implements a complete, production-grade ngx-tw component from a generated prompt document.
Produces: component file, spec file, `index.ts`, `ng-package.json`, and `public-api.ts` update.

---

## Operating mode: self-skeptical

This skill operates in **self-skeptical mode**: treat your own output as suspicious until verified. Mantra: *verified progress beats fast guesses*. Skepticism is adaptive — heavy on a new component, animation work, or CVA wiring; light on prose tweaks, token swaps, or single-test additions.

### The loop

1. **Understand** — restate the task, constraints, assumptions.
2. **Plan** — propose the implementation path explicitly.
3. **Act** — write the code.
4. **Challenge** — ask "what could be wrong with this?" and name concrete failure modes.
5. **Verify** — run the Phase 3 checklist; re-read what you wrote.
6. **Revise** — fix every contradiction. Disclose what you cannot resolve.

### Assumption ledger (inline)

Maintain a short ledger of guesses **in your response text**, not in a file. 3–6 bullets, one line each:

- **Assume:** `<thing>` — **Why:** `<source>` — **If wrong:** `<consequence>` — **Verified by:** `<grep | read | test | none-yet>`

Cover at minimum: entry-point name, selector form (element vs attribute), public type names, whether `ControlValueAccessor` is needed, animation class names referenced.

### Advisor checkpoints

The advisor sees your full transcript automatically — don't paraphrase the work, just state what they need to see *in your response*, then call. Two required calls:

- **REQUIRED — end of Phase 1**: state your plan paragraph and the ledger, then call `advisor`. They flag what you missed before you commit code.
- **REQUIRED — end of Phase 3, before Phase 4**: state the red-team framing ("review this patch as if doing PR review") and your self-verification result, then call `advisor`. Heavier scrutiny applies to form-controls, overlay-bearing components, animation introductions, and any `public-api.ts` change.
- **Advisory — inside Phase 2**: when stuck on a prompt-vs-CLAUDE.md contradiction, a CDK primitive choice, or a tv() shape that feels off. Not on every uncertainty.

If advisor disagrees with evidence you already gathered, do **not** silently switch. Surface the conflict in your response and call `advisor` once more naming the constraint that should break the tie.

### Evidence-first, no silent success

Phase 4 names what was *verified*, not just what was *done*. Every checklist item is either green or surfaced under **Unresolved risks**. Never declare "done" with hidden uncertainty.

---

## Phase 1 — Load context (always do this first)

### 1.1 Find and read the prompt document

Look for the prompt doc in this order:
1. A path explicitly provided by the user
2. `docs/prompts/<name>.md` matching the component name mentioned
3. The most recently modified file in `docs/prompts/`

If no prompt doc is found, STOP and tell the user: "I need a prompt document to proceed.
Run the prompt-architect agent first, or point me to an existing file in docs/prompts/."

Read the full prompt document. Extract:
- Component name (e.g., `tw-button` → `button`)
- Selector type (element or attribute)
- All inputs with types, defaults, and JSDoc
- All outputs with payload types
- Content projection slots
- Styling approach (tv() config summary)
- Accessibility requirements
- Whether ControlValueAccessor is needed
- File structure listed in the prompt

### 1.2 Read CLAUDE.md

Read `CLAUDE.md` (or `.claude/CLAUDE.md`). This is the source of truth for every convention.
Do not proceed without it. Internalize:
- Angular v21 conventions (signals, host bindings, inject(), no constructors)
- Tailwind v4 approach (no CSS files, semantic tokens, surface/fg/border tokens)
- tv() variant pattern (slots, defaultVariants, twMerge)
- animate.enter / animate.leave (no @angular/animations)
- Testing rules (Vitest, no fakeAsync, vi.spyOn, fixture.componentRef.setInput)
- JSDoc requirements
- File naming conventions (bare names, no type suffixes)

### 1.3 Read reference components

Find 1–2 existing components in `projects/ngx-tw/src/lib/` that are structurally
similar to what you are building. Read their full source.

If the library is empty, note this — you are establishing the first patterns.

### 1.4 Output a context confirmation + ledger

Before writing any code, output:

1. A single short paragraph:

   > "Building `tw-[name]`. Read prompt at `docs/prompts/[name].md`,
   > CLAUDE.md conventions loaded, reference patterns from: [list or 'none — first component'].
   > ControlValueAccessor: [yes/no]."

2. Your **assumption ledger** (3–6 bullets) using the format from the Operating mode section. Mark each item as verified (where you already grepped/read) or `none-yet` (where you'll verify during Phase 2 or 3).

### 1.5 Plan & advisor checkpoint (REQUIRED)

State the implementation plan in 3–6 bullets — what files you'll create, what the variant axis is, how `tv()` will be sliced, what CDK primitives you'll compose, what tests will cover. Then call `advisor`.

Wait for the advisor's response. Apply concrete corrections; surface unresolved conflicts in your next response and call `advisor` once more. Only proceed to Phase 2 once the plan stands up to the red-team pass.

---

## Phase 2 — Implement

Work through these files in order. Complete each file fully before moving to the next.

### 2.1 Component file — `[name].ts`

Location: `projects/ngx-tw/src/lib/[name]/[name].ts`

Follow this structure exactly:

**Imports block**
- Angular core imports first (`Component`, `input`, `output`, `computed`, `inject`, etc.)
- CDK imports second (grouped by CDK module)
- Library imports third (`ngx-tw/core` types)
- tailwind-variants last

**tv() config**
- Defined as a `const` above the class, not exported
- Slots for multi-part components, no slots for single-element
- `defaultVariants` always present
- `twMerge: true` always present
- Uses semantic color tokens exclusively (`bg-primary-500`, `text-error-800`)
- Uses surface/fg/border tokens for structural styling (`bg-surface-muted`, `text-fg`, `border-border`)
- No raw palette colors (`blue-*`, `red-*`, `neutral-*`)

**Class**
- `@Component` or `@Directive` decorator
- `changeDetection: ChangeDetectionStrategy.OnPush`
- `host` object for all host bindings (no `@HostBinding`/`@HostListener`)
- `inject()` for all DI (no constructor injection)
- Signal inputs: `input<T>()`, `input.required<T>()`
- `model()` only where the prompt explicitly specifies two-way binding
- `computed()` for read-only derived state
- `linkedSignal()` for writable derived state that syncs with an input (tab active index, etc.)
- Every `input()`, `output()`, `model()` has a JSDoc comment from the prompt spec
- No `mutate()` on signals — use `update()` or `set()`
- No arrow functions in templates
- Native control flow: `@if`, `@for`, `@switch`
- No `ngClass`, `ngStyle`

**Animations**
- Use `animate.enter="class-name"` and `animate.leave="class-name"` in templates or host
- No `@angular/animations` imports whatsoever
- CSS class names referenced here must be defined in `projects/ngx-tw/theme/_base.css`
  (note this in the closing summary as a manual step for the developer)

**ControlValueAccessor** (only if prompt specifies it)
- Implement `ControlValueAccessor` interface
- Provide `NG_VALUE_ACCESSOR` in the component's `providers`
- Implement `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`

**Template**
- Inline if under ~50 lines; external `.html` file if longer
- No wrapper `<div>` unless structurally necessary
- Focus rings on every interactive element: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`
- Disabled: `opacity-50 pointer-events-none` on container, or `disabled:opacity-30` on individual controls
- Icons: `shrink-0` always, `mt-0.5` next to multi-line text

### 2.2 Spec file — `[name].spec.ts`

Location: `projects/ngx-tw/src/lib/[name]/[name].spec.ts`

**Setup block**
```
describe('[ComponentName]', () => {
  let component: [ComponentName]
  let fixture: ComponentFixture<[ComponentName]>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [[ComponentName]]
    }).compileComponents()
    fixture = TestBed.createComponent([ComponentName])
    component = fixture.componentInstance
    fixture.detectChanges()
  })
```

**Required test groups — implement all that apply:**

`Rendering`
- Default render: creates without errors, no inputs set
- Each variant value renders without errors (set via `fixture.componentRef.setInput`)
- Conditional DOM elements appear/disappear based on inputs

`Inputs`
- Each input updates the rendered DOM (query DOM, not class properties)
- Use `fixture.componentRef.setInput('name', value)` then `fixture.detectChanges()`

`Outputs`
- Each output emits with the correct payload
- Trigger via `nativeElement.querySelector('...').click()` or `dispatchEvent`

`Interactions`
- Click interactions produce correct DOM changes and/or output emissions
- Keyboard interactions (if the component has keyboard behavior): simulate with `dispatchEvent(new KeyboardEvent(...))`
- Disabled state: interactions produce no output emissions

`Accessibility`
- Correct ARIA role on the host or key elements
- ARIA attributes update on state change (`aria-expanded`, `aria-selected`, etc.)
- Verify with `expect(el.getAttribute('aria-...')).toBe('...')`

`Content projection` (if component uses ng-content)
- Fallback content renders when nothing is projected
- Projected content renders and replaces fallback

`ControlValueAccessor` (if applicable)
- `writeValue()` updates DOM
- User interaction triggers `onChange` with correct value
- `setDisabledState(true)` blocks interaction

**Vitest rules (enforce strictly):**
- Never use `fakeAsync` or `tick` — use `async/await` with `await fixture.whenStable()`
- Use `vi.spyOn()` not Jasmine spies
- Import explicitly: `import { describe, it, expect, vi, beforeEach } from 'vitest'`
- Always call `fixture.detectChanges()` after state changes before DOM queries

### 2.3 Entry point files

**`index.ts`** at `projects/ngx-tw/src/lib/[name]/index.ts`
- Export the component/directive class
- Export any public types specific to this component
- Do NOT export the tv() config

**`ng-package.json`** at `projects/ngx-tw/src/lib/[name]/ng-package.json`
```json
{
  "lib": {
    "entryFile": "index.ts"
  }
}
```

### 2.4 Update `public-api.ts`

Add a re-export line to `projects/ngx-tw/src/public-api.ts`:
```typescript
export * from 'ngx-tw/[name]';
```

---

## Phase 3 — Self-verification & red-team pass

Before outputting the closing summary, run through this checklist silently.
For each item that fails, fix it before proceeding.

**Red-team framing.** As you walk the checklist, re-read each file as if reviewing a teammate's PR — be the reviewer who would push back. Focus on the high-failure-rate items in this codebase: raw palette colors, `@angular/animations` imports, missing JSDoc, `fakeAsync` in specs, forgotten `defaultVariants`, `dark:` overrides on surface tokens, constructor injection sneaking back in, missing `OnPush`.

**Angular conventions**
- [ ] No `standalone: true` in decorator (it's the default in v21)
- [ ] No `@HostBinding` or `@HostListener`
- [ ] No constructor injection — only `inject()`
- [ ] No `mutate()` on signals
- [ ] No arrow functions in templates
- [ ] No `ngClass` or `ngStyle`
- [ ] `ChangeDetectionStrategy.OnPush` present

**Styling**
- [ ] No raw palette colors (`blue-*`, `red-*`, `neutral-*`) anywhere
- [ ] Structural styling uses surface/fg/border tokens (`bg-surface-muted`, `text-fg`, `border-border`)
- [ ] No component CSS file created
- [ ] `tv()` config has `defaultVariants` and `twMerge: true`
- [ ] All visual tokens (radius, spacing, shadows) match CLAUDE.md Visual Design System

**API**
- [ ] Every `input()`, `output()`, `model()` has a JSDoc comment
- [ ] `model()` only used where prompt specifies two-way binding
- [ ] Shared types from `ngx-tw/core` used for `color` and `size` inputs

**Animations**
- [ ] No `@angular/animations` import anywhere
- [ ] `animate.enter`/`animate.leave` used for DOM entry/exit (if applicable)

**Accessibility**
- [ ] ARIA role present on host or key element
- [ ] Focus ring pattern applied to every interactive element
- [ ] Disabled state handled with `opacity-50 pointer-events-none` or `disabled:` variants

**Tests**
- [ ] No `fakeAsync` or `tick` in spec file
- [ ] All required test groups present (rendering, inputs, outputs, interactions, a11y)
- [ ] `fixture.componentRef.setInput()` used for signal inputs
- [ ] `fixture.detectChanges()` called after every state change

**File structure**
- [ ] `[name].ts` created at correct path
- [ ] `[name].spec.ts` created at correct path
- [ ] `index.ts` created and exports are correct
- [ ] `ng-package.json` created with correct entryFile
- [ ] `public-api.ts` updated

### Advisor call before declaring done (REQUIRED)

State, in your response:

- Every checklist item that passed.
- Every item that failed and was fixed (briefly — what was wrong, what changed).
- Every item that remains red, and why.
- Any assumption from § 1.4's ledger that is still `none-yet`.

Then call `advisor`. The advisor's job here is a red-team review of the patch as a whole. Apply concrete corrections; surface unresolved conflicts. Only proceed to the closing summary once the red-team pass clears.

---

## Phase 4 — Closing summary

Output a structured summary:

```
## Implementation: tw-[name]

**Files created:**
- projects/ngx-tw/src/lib/[name]/[name].ts
- projects/ngx-tw/src/lib/[name]/[name].spec.ts
- projects/ngx-tw/src/lib/[name]/index.ts
- projects/ngx-tw/src/lib/[name]/ng-package.json
- projects/ngx-tw/src/public-api.ts (updated)

**Verified:**
[Bullet list of checks that actually passed — e.g., "Phase 3 checklist: all 22 items green",
"No raw palette colors (grepped for `-50|`-100|...|`-900` patterns)",
"No `@angular/animations` import (grep returned 0)",
"Spec covers rendering, inputs, outputs, interactions, a11y, CVA — verified by reading the file",
"Two advisor passes cleared (plan + red-team)". Name the specific check, not a vague claim.]

**Decisions made:**
[List any assumptions from the prompt's [CONFIRM] items that you resolved, and how.
Cite the ledger entry if relevant.]

**Unresolved risks:**
[Every red item from Phase 3, every assumption still `none-yet`, every advisor
disagreement you could not reconcile. If empty, write "None — every checklist item
passed and the assumption ledger is fully verified." Never leave this section out.]

**Manual steps required:**
[List any steps Claude cannot do — e.g., "Add animation keyframes for
'fade-in' and 'slide-in' classes to projects/ngx-tw/theme/_base.css"]

**Run tests:**
ng test projects/ngx-tw

---
**Next: Visual & Accessibility review**
Open docs/review/visual-accessibility.md and work through it with the component
running in the demo app.
```

---

## What you must never do

- Never skip Phase 1 — implementing without context produces inconsistent results
- Never use `@angular/animations`
- Never use raw palette colors — semantic and surface/fg/border tokens only
- Never omit JSDoc from public API members
- Never use `fakeAsync` in tests
- Never create a CSS file for the component
- Never use `@HostBinding`, `@HostListener`, or constructor injection
- Never leave `[CONFIRM]` items unresolved without flagging them in the closing summary
- Never skip either required `advisor` checkpoint (end of Phase 1, end of Phase 3)
- Never declare "done" with hidden uncertainty — every red checklist item and every unverified ledger entry MUST appear under **Unresolved risks** in Phase 4
