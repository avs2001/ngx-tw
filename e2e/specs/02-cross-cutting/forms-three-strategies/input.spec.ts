import { expect, test } from '../../../fixtures/base';
import { InputPage } from '../../../pages/input.page';
import { EXPECTED_FAILURE_TIMEOUT_MS } from '../../../support/fixme-registry';

test.describe.configure({ mode: 'parallel' });

/**
 * Reference three-strategy contract — `Input`.
 *
 * Per `.claude/CLAUDE.md`: every interactive control "MUST work with all
 * three Angular form strategies: template-driven, reactive, signal-based".
 * Chapter 05 §5.1 spells out the spec per strategy; this file is the
 * canonical implementation against `<input twInput>` and the template
 * other form-control suites should copy.
 *
 * **`input` is a `ControlValueAccessor` with NO `(valueChange)` output**
 * (chapter 04 §Input). Tests therefore observe state via:
 *   - The native `<input>`'s rendered `value` attribute (the DOM contract).
 *   - A per-section `[data-testid="value-readout"]` that mirrors the bound
 *     value / state into a visible `<p>` — the closest equivalent of
 *     "valueChange fired" without an output to listen on.
 *
 * **Reset contract — synchronous family** (chapter 05 §5.1): for input,
 * `reset()` clears the DOM, and the readout (mirroring the FormControl's
 * value) flips to the empty string. There is no negative `valueChange`
 * branch on the input — the negative-assertion path belongs to the
 * overlay-deferred controls (date-picker / date-range-picker / time-picker).
 *
 * See `e2e/specs/02-cross-cutting/forms-three-strategies/README.md` for the
 * template every other form control should follow.
 */
test.describe('Forms · Three strategies · Input', () => {
  // ──────────────────────────────────────────────────────────────────
  // Template-Driven (ngModel)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @td template-driven: programmatic set propagates to the DOM input', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('td');
    await expect(el).toHaveValue('');

    await input.buttonIn('td', 'Set value').click();
    await expect(el).toHaveValue('Ada Lovelace');
    await expect(input.readoutIn('td')).toContainText('value = "Ada Lovelace"');
  });

  test('@forms @td template-driven: user typing flows into the bound signal (visible readout)', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('td');
    await el.fill('Grace Hopper');

    // The TD readout mirrors the [(ngModel)]-bound signal back into the
    // page; if the directive failed to write through `ControlValueAccessor`,
    // the readout would still say `""`.
    await expect(input.readoutIn('td')).toContainText('value = "Grace Hopper"');
  });

  test('@forms @td template-driven: `[disabled]` flips the DOM disabled state', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('td');
    await expect(el).toBeEnabled();
    await expect(input.readoutIn('td')).toContainText('disabled = false');

    await input.buttonIn('td', 'Toggle disabled').click();
    await expect(el).toBeDisabled();
    await expect(input.readoutIn('td')).toContainText('disabled = true');
  });

  // ──────────────────────────────────────────────────────────────────
  // Reactive (FormControl)
  // ──────────────────────────────────────────────────────────────────

  test('@forms @reactive reactive: `setValue` propagates to the DOM input', async ({ page }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('reactive');
    await expect(el).toHaveValue('');

    await input.buttonIn('reactive', 'Set value').click();
    await expect(el).toHaveValue('Ada Lovelace');
    await expect(input.readoutIn('reactive')).toContainText('value = "Ada Lovelace"');
  });

  test('@forms @reactive reactive: user typing updates `FormControl.value` (visible readout)', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('reactive');
    await el.fill('reactive-user');

    await expect(input.readoutIn('reactive')).toContainText('value = "reactive-user"');
    await expect(input.readoutIn('reactive')).toContainText('valid = true');
  });

  test('@forms @reactive reactive: `disable()` writes through to the DOM', async ({ page }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('reactive');
    await expect(el).toBeEnabled();

    await input.buttonIn('reactive', 'Disable').click();
    await expect(el).toBeDisabled();
    await expect(input.readoutIn('reactive')).toContainText('disabled = true');

    await input.buttonIn('reactive', 'Enable').click();
    await expect(el).toBeEnabled();
    await expect(input.readoutIn('reactive')).toContainText('disabled = false');
  });

  // `test.fail()`, not `test.fixme`: this body fails on a real assertion, so
  // Playwright runs it and turns the suite RED the day it starts passing —
  // the self-expiry a `test.fixme` can never have. See `support/fixme-registry.ts`.
  test.fail(
    '@forms @reactive reactive: `markAsTouched()` surfaces the error region (chapter 05 §5.1)',
    async ({ page }) => {
      test.setTimeout(EXPECTED_FAILURE_TIMEOUT_MS);
      // BUG (ngx-tw/input#mark-as-touched-not-recomputed): the
      // `InputDirective.errorState` signal recomputes when `_ngControlRev`
      // bumps, but the directive only bumps it from `statusChanges` /
      // `valueChanges` subscriptions and the focus-monitor blur path —
      // not from a programmatic `markAsTouched()`. Angular's
      // `markAsTouched()` does NOT emit `statusChanges` / `valueChanges`
      // (no validity / value change), so the form-field's subscript stays
      // on `hint` even though the underlying `FormControl` is now
      // touched+invalid. Real user blur still works (focus monitor bumps
      // the revision). Suggested fix: subscribe to a control-events
      // stream that includes `TouchedChangeEvent` (Angular ≥18.1) or
      // mirror the touched signal on `ngDoCheck`.
      const input = new InputPage(page);
      await input.goto();

      await expect(input.reactiveSection.getByRole('alert')).toHaveCount(0);
      await input.buttonIn('reactive', 'Mark touched').click();

      await expect(input.reactiveSection.getByRole('alert')).toBeVisible();
      await expect(input.inputIn('reactive')).toHaveAttribute('aria-invalid', 'true');
      await expect(input.readoutIn('reactive')).toContainText('touched = true');
    },
  );

  test('@forms @reactive reactive: user blur drives the error region via the focus monitor', async ({
    page,
  }) => {
    // Regression guard for the working code path. While the BUG above keeps
    // `markAsTouched()` from triggering the error subscript synchronously,
    // a real user blur (CDK FocusMonitor → `_ngControlRev.update(...)` →
    // `errorState` recomputes) does drive it. Filling with one char keeps
    // the control invalid via `minLength(3)` and ensures we observe the
    // `(touched || dirty) && invalid` matcher branch.
    const input = new InputPage(page);
    await input.goto();

    const reactive = input.inputIn('reactive');
    await reactive.fill('a');

    await expect(input.reactiveSection.getByRole('alert').filter({ hasText: 'Too short.' })).toBeVisible();
    await expect(reactive).toHaveAttribute('aria-invalid', 'true');
  });

  test('@forms @reactive reactive: `reset()` clears the DOM and the visible readout', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('reactive');
    await el.fill('to-be-cleared');
    await expect(input.readoutIn('reactive')).toContainText('value = "to-be-cleared"');

    await input.buttonIn('reactive', 'Reset').click();

    // Synchronous-control reset contract (chapter 05 §5.1):
    //   1. DOM matches default.
    //   2. The bound FormControl's `.value` is the default — visible via
    //      the readout, which is the input's closest equivalent of
    //      "valueChange fired". Inputs have no `(valueChange)` output.
    await expect(el).toHaveValue('');
    await expect(input.readoutIn('reactive')).toContainText('value = ""');
    // `reset('')` does NOT mark the control as untouched if it had been
    // touched — but the demo always resets to default ('') without touching,
    // so we assert touched is back to false on the initial-state contract.
    await expect(input.readoutIn('reactive')).toContainText('touched = false');
  });

  // ──────────────────────────────────────────────────────────────────
  // Signal Forms
  // ──────────────────────────────────────────────────────────────────

  test('@forms @signal signal-forms: programmatic set propagates to the DOM input', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('signal');
    await expect(el).toHaveValue('');

    await input.buttonIn('signal', 'Set value').click();
    await expect(el).toHaveValue('Ada Lovelace');
    await expect(input.readoutIn('signal')).toContainText('value = "Ada Lovelace"');
  });

  test('@forms @signal signal-forms: user typing updates the bound signal field (visible readout)', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('signal');
    await el.fill('signal-user');

    // signalForm.<field>().value() is the page's source of truth for
    // signal-forms; the readout prints exactly that, so a regression in
    // `[formField]`'s write path would surface here.
    await expect(input.readoutIn('signal')).toContainText('value = "signal-user"');
    await expect(input.readoutIn('signal')).toContainText('valid = true');
  });

  test('@forms @signal signal-forms: `reset(initialValue)` clears the DOM and the visible readout', async ({
    page,
  }) => {
    // Signal Forms' `FieldState.reset(value?)` resets touched/dirty AND,
    // when a value is passed, sets the model to that value (per the
    // @angular/forms type comment). The demo's Reset button calls
    // `reset('')` to mirror reactive `formControl.reset('')` semantics —
    // resetting validation state AND clearing the value.
    //
    // **Calendar / Signal Forms gap (chapter 05 §5.1):** `calendar.ts`
    // subscribes to `ngControl.control.events`, which Signal Forms'
    // control does not expose, so calendar's reset path does not fire
    // under Signal Forms today. Input has no such gap — its CVA goes
    // through Angular's native plumbing.
    const input = new InputPage(page);
    await input.goto();

    const el = input.inputIn('signal');
    await el.fill('to-be-cleared');
    await expect(input.readoutIn('signal')).toContainText('value = "to-be-cleared"');

    await input.buttonIn('signal', 'Reset').click();

    await expect(el).toHaveValue('');
    await expect(input.readoutIn('signal')).toContainText('value = ""');
  });

  // ──────────────────────────────────────────────────────────────────
  // Cross-strategy parity — the same `InputDirective` handles all three
  // ──────────────────────────────────────────────────────────────────

  test('@forms cross-strategy: typing into one strategy does not leak into the others', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    await input.inputIn('td').fill('only-td');
    await expect(input.readoutIn('td')).toContainText('value = "only-td"');
    await expect(input.readoutIn('reactive')).toContainText('value = ""');
    await expect(input.readoutIn('signal')).toContainText('value = ""');

    await input.inputIn('reactive').fill('only-reactive');
    await expect(input.readoutIn('td')).toContainText('value = "only-td"');
    await expect(input.readoutIn('reactive')).toContainText('value = "only-reactive"');
    await expect(input.readoutIn('signal')).toContainText('value = ""');

    await input.inputIn('signal').fill('only-signal');
    await expect(input.readoutIn('td')).toContainText('value = "only-td"');
    await expect(input.readoutIn('reactive')).toContainText('value = "only-reactive"');
    await expect(input.readoutIn('signal')).toContainText('value = "only-signal"');
  });
});
