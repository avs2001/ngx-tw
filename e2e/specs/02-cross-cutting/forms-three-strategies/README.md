# Three-Strategy Form Reference Pattern

Every interactive control in `ngx-tw` MUST work with all three Angular form
strategies — template-driven (`ngModel`), reactive (`FormControl`), and signal
forms (`form()` + `[formField]`). This directory's specs verify that contract
on a per-control basis.

`input.spec.ts` is the **canonical implementation**. Treat it as the template
when adding a new form control (checkbox, radio, switch, select, slider,
segmented-control, date-picker, date-range-picker, time-picker). Same shape,
same tag set, same selectors — every diff between control specs should be
*just* the control's own contract, never structural noise.

## Why this pattern matters

The library's three-strategy promise is the single largest cross-cutting
contract in the codebase. Per-component unit tests can verify one strategy at
a time, but only an end-to-end suite that drives the real demo can catch:

- A `ControlValueAccessor` that writes for reactive forms but not for
  `ngModel` (or vice versa).
- A `[formField]` directive that subscribes to a control event the Signal
  Forms control doesn't expose (the documented `calendar.ts` gap).
- A reset path that flips the DOM but forgets to `valueChange.emit()` (or
  emits when it shouldn't — see the overlay-deferred contract below).

## Source-side prerequisite — Phase 0b stable selectors

Every form-control example page MUST mark its three strategy sections with a
`data-section` attribute on the `<section class="mb-10">` wrapper:

```html
<section class="mb-10" data-section="td">       <h2>Template-Driven Forms</h2> …
<section class="mb-10" data-section="reactive"> <h2>Reactive Forms</h2>       …
<section class="mb-10" data-section="signal">   <h2>Signal Forms</h2>         …
```

It must also expose a visible value/state readout per section, anchored by
`data-testid="value-readout"`:

```html
<p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
  value = "{{ bound.value }}" · …
</p>
```

The Phase 0b chapter (chapter 05 §5.1) explicitly mandates these markers so
specs anchor on structure rather than on copy. Heading-text anchoring (`<h2>`)
is the right default for component-spec sections that have no cross-cutting
equivalent, but the three-strategy suite must remain stable across copy
edits / localisation, so it relies exclusively on `data-section`.

## Scenarios per strategy

Lifted verbatim from chapter 05 §5.1. Authoring a new spec means writing one
test per cell — no more, no fewer.

| Strategy | Assertions |
|---|---|
| `ngModel` (template-driven) | Set initial → DOM matches; user input → bound variable matches (readout); `[disabled]` writes through. |
| `FormControl` (reactive) | `setValue` → DOM matches; `disable()` → DOM disabled; `markAsTouched()` → error region appears; `reset()` → contract below. |
| signal-form (`form()`, `FormField`) | Initial signal → DOM matches; user input → signal updates (readout); `reset()` → contract below. |

Plus one cross-strategy parity test: typing in one section MUST NOT leak into
the others. This catches accidental shared-state bugs in the directive's
value storage.

## `reset()` — split by control family

Reset is the contract most likely to regress, and it splits in two:

- **Synchronous controls** (this file is the reference): `input`, `checkbox`,
  `radio`, `switch`, `select`, `slider`, `segmented-control`.

  `reset()` → DOM matches default; the bound value (visible via the readout)
  flips to the default.

  For controls that DO expose a `(valueChange)` output, also assert one
  `valueChange` emission with the default value. **Input has no
  `(valueChange)` output** (chapter 04 §Input) — the readout, mirroring the
  bound value, is the closest observable substitute. Other controls in this
  family should listen on their actual output.

- **Overlay-deferred controls** (separate spec, do NOT add here): `date-picker`,
  `date-range-picker`, `time-picker`.

  `reset()` → DOM matches default; `dateChange` / `valueChange` does **NOT**
  fire. This is the explicit negative-assertion contract enforced by
  `core/form-reset.ts` and wired only into those three controls. The split
  exists because the overlay machinery would otherwise re-render and re-emit
  on every external reset, producing a spurious "the user picked null" event.

When you write a new spec, decide which family the control belongs to BEFORE
implementing reset coverage.

### Signal Forms reset is **not** symmetric with reactive

`FormControl.reset(value?)` (reactive) clears both validation state AND the
value, defaulting the value to `null`. `FieldState.reset(value?)` (Signal
Forms) is different: per `@angular/forms/types/_structure-chunk.d.ts`,
**`reset()` without an argument resets only touched/dirty — the model is
unchanged.** Demo Reset buttons in signal-form sections must therefore call
`reset('')` (or the control's appropriate empty value) to match what users
expect a "reset" button to do.

This was a real test finding when authoring `input.spec.ts`: the demo's
initial `signalForm.fullName().reset()` left the DOM input populated.
Updating the button to `reset('')` matched reactive semantics and made the
test pass.

## `markAsTouched()` on reactive — known InputDirective gap

Chapter 05 §5.1 specifies `markAsTouched()` → error region appears. **The
current `InputDirective` does not honour this synchronously**: the
directive's `errorState` signal recomputes when its internal `_ngControlRev`
bumps, but the directive only bumps it from `statusChanges` /
`valueChanges` (and the focus-monitor blur path). Angular's
`markAsTouched()` emits neither, so the form-field's subscript stays on
`hint`. Real user blur still works (focus monitor bumps the revision).

The reactive spec in this folder carries a `test.fixme` for this exact
case with the bug description inline. When the directive grows a
`TouchedChangeEvent` subscription (Angular ≥ 18.1 supports it) or mirrors
the touched signal in `ngDoCheck`, remove the fixme.

Authoring tip: when copying this template for another form control, check
whether the same gap exists in the new directive before lifting the
`test.fixme` over.

## Known gap — Signal Forms reset on calendar

`calendar.ts` subscribes to `ngControl.control.events` to reset, guarded by
`if (ctrl?.events)`. Signal Forms' control does not expose an `events`
stream, so calendar's reset path **does not fire under Signal Forms today.**
The calendar spec MUST document this with a `test.fixme` and a link to the
tracking issue; do NOT silently assert against the broken path.

Input, checkbox, radio, switch, select, slider, segmented-control are
unaffected — they go through Angular's native value-accessor plumbing.

## Tag conventions

Every test carries the cross-cutting tag plus its strategy:

| Tag | Meaning |
|---|---|
| `@forms` | Belongs to the three-strategy suite. ALL specs in this folder. |
| `@td` | Template-driven path. |
| `@reactive` | Reactive forms path. |
| `@signal` | Signal Forms path. |

The cross-strategy parity test carries `@forms` only — it spans all three.

## File naming

`<control-slug>.spec.ts` — one file per control, matching the route slug.
The `<control-slug>` should match `support/routes.ts`'s `COMPONENTS` entry
(`input`, `checkbox`, `radio`, `switch`, `select`, `slider`,
`segmented-control`, `date-picker`, `date-range-picker`, `time-picker`).

## Authoring checklist

When adding a new control's three-strategy spec:

1. Copy `input.spec.ts` and `e2e/pages/input.page.ts`.
2. Confirm the demo's examples page has the three `<section data-section>`
   markers AND a `<p data-testid="value-readout">` per section. If not, add
   them per the demo-doc-page convention before writing the spec.
3. Adjust the readout assertions to the new control's bound value shape
   (e.g. `checked = true/false` for checkbox/switch, `value = N` for slider).
4. Pick the right reset family (synchronous vs overlay-deferred) and use the
   matching reset contract above.
5. Run `npm run e2e -- --project=chromium-light forms-three-strategies` and
   triage every failure as real bug | test bug | flake — no skips without
   inline links.
