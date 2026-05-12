import { expect, test } from '../../fixtures/base';
import { InputPage } from '../../pages/input.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Input reference E2E suite. Covers `InputDirective` behaviours that are
 * specific to the directive itself; the contract that the same directive
 * works across template-driven / reactive / signal forms is asserted in
 * the cross-cutting suite under `forms-three-strategies/input.spec.ts`
 * so that the same three-strategy template can be reused for every other
 * form control without re-listing per-control scenarios here.
 *
 * Per `chapter 04 §Input`:
 *   - Standalone renders; visual chrome is inherited from `<tw-form-field>`.
 *   - Disabled / readonly enforced via DOM (not just CSS).
 *   - `errorStateMatcher` switches `aria-invalid` and form-field red paint.
 *   - Prefix/suffix slots render in correct DOM positions.
 *   - Textarea variant — `selector` includes `textarea[twInput]`.
 *   - Form-field integration is the primary use case.
 */
test.describe('Input', () => {
  test('@interaction @forms standalone input mounts and accepts text input', async ({ page }) => {
    const input = new InputPage(page);
    await input.goto();

    const standalone = input.standaloneTextInput();
    await expect(standalone).toBeVisible();
    await expect(standalone).toBeEditable();

    await standalone.fill('hello');
    await expect(standalone).toHaveValue('hello');
  });

  test('@interaction @forms standalone textarea variant attaches via `selector: textarea[twInput]`', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const textarea = input.standaloneTextarea();
    await expect(textarea).toBeVisible();
    // textarea attribute selector implies the directive is active — the
    // observable signal is the same chrome class set as a standalone input.
    await expect(textarea).toHaveClass(/rounded-md/);

    await textarea.fill('first line\nsecond line');
    await expect(textarea).toHaveValue('first line\nsecond line');
  });

  test('@interaction @forms standalone vs form-field: directive strips its own chrome inside `<tw-form-field>`', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    // Standalone path paints its own border / rounded-md.
    const standalone = input.standaloneTextInput();
    await expect(standalone).toHaveClass(/rounded-md/);
    await expect(standalone).toHaveClass(/border-border/);

    // Inside form-field, the directive applies the `inFormField: true` branch
    // of its `tv()` — no rounded-md / no border, because the wrapper owns
    // the chrome. The form-field's "Email" example is the canonical test.
    const inField = input.standaloneSection.getByLabel('Email');
    await expect(inField).toBeVisible();
    await expect(inField).not.toHaveClass(/rounded-md/);
    await expect(inField).not.toHaveClass(/border-border\b/);
  });

  test('@interaction @forms disabled flows through CVA and the native attribute', async ({ page }) => {
    const input = new InputPage(page);
    await input.goto();

    const disabled = input.disabledInputByLabel('Legacy slug');
    // The directive's host binding `[disabled]="disabled()"` writes the
    // native attribute when the bound input is true. CDK's FocusMonitor
    // skips disabled elements; we don't reassert that here — the
    // observable contract a consumer cares about is the native attribute.
    await expect(disabled).toBeDisabled();
    await expect(disabled).toHaveValue('acme-corp-2019');
  });

  test('@interaction @forms readonly syncs to the native attribute and keeps the field focusable', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const readonly = input.disabledInputByLabel('Account ID');
    // The directive runs an `effect` that mirrors the `readonly` input to
    // the native attribute (`input.ts:303`). Asserting against the native
    // attribute is the observable contract — and unlike `disabled`,
    // `readonly` keeps the element focusable and selectable so a copy
    // gesture still works.
    await expect(readonly).toHaveAttribute('readonly', /.*/);
    await expect(readonly).toHaveValue('acct_1Kj8dFZ9oX2p');
    await expect(readonly).toBeEnabled();

    await readonly.focus();
    await expect(readonly).toBeFocused();
  });

  test('@a11y @forms required input advertises `aria-required="true"`', async ({ page }) => {
    const input = new InputPage(page);
    await input.goto();

    // The Template-Driven section's display-name input has `required` set
    // statically; the directive surfaces `aria-required` derived from the
    // input + bound `NgControl`'s validators.
    const required = input.inputIn('td');
    await expect(required).toHaveAttribute('aria-required', 'true');
  });

  test('@a11y @forms errorStateMatcher gates `aria-invalid` until the submit branch fires', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const email = input.matcherEmailInput;
    await expect(email).toBeVisible();
    // Default matcher would mark this `aria-invalid="true"` after touch+blur,
    // but the section provides a submit-only matcher: typing then blurring
    // must NOT flip aria-invalid until the form is actually submitted.
    await email.fill('not-an-email');
    await email.blur();
    // The directive renders `[attr.aria-invalid]="errorState() || null"` —
    // when errorState is false the attribute is removed entirely. Assert
    // absence via the negated web-first matcher.
    await expect(email).not.toHaveAttribute('aria-invalid', /./);

    // Submit triggers `ngSubmit` → `_formSubmitRev` bumps → matcher returns
    // true because `submitOnlyCtrl.invalid && form.submitted` are both set.
    await input.matcherSubmitButton.click();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
  });

  test('@a11y @forms inside form-field: `aria-describedby` links to the hint id', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    // Template-driven section: hint reads "Bound model below." — the form-field
    // pushes its id into the control's aria-describedby through
    // `setDescribedByIds`. The hint id is generated; resolve via the
    // describedby pointer rather than hard-coding it.
    const inputEl = input.inputIn('td');
    await expect(inputEl).toHaveAttribute('aria-describedby', /\S+/);

    const describedBy = (await inputEl.getAttribute('aria-describedby')) ?? '';
    const ids = describedBy.split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const ref = page.locator(`#${id}`);
      await expect(ref).toBeVisible();
    }
  });

  test('@a11y @forms inside form-field: error message id is appended to aria-describedby on submit-touched', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    // Reactive section: type one character, which is below the 3-char
    // minLength validator, to make the control dirty AND keep it invalid
    // (`required` already fails on empty; one char fails `minLength(3)`).
    //
    // We drive the error path through `valueChanges` rather than via
    // `markAsTouched()` / focus+blur because the InputDirective's
    // `errorState` signal only recomputes when its internal `_ngControlRev`
    // bumps, and the directive subscribes to `valueChanges` /
    // `statusChanges` — not to `touched`. A programmatic `markAsTouched()`
    // does NOT emit either stream, so it would not trigger a recompute.
    // (Default ErrorStateMatcher returns `invalid && (touched || dirty)`
    // so dirty=true is sufficient.)
    const reactive = input.inputIn('reactive');
    await reactive.fill('a');

    // Anchor on `role="alert"` to isolate the rendered error span from the
    // identical literal inside the section's `<tw-code-block>` snippet.
    const errorAlert = input.reactiveSection.getByRole('alert').filter({ hasText: 'Too short.' });
    await expect(errorAlert).toBeVisible();

    await expect(reactive).toHaveAttribute('aria-describedby', /\S+/);

    const describedBy = (await reactive.getAttribute('aria-describedby')) ?? '';
    const ids = describedBy.split(/\s+/).filter(Boolean);

    // Verify that one of the described-by targets contains the error text.
    const texts = await Promise.all(
      ids.map(async (id) => ((await page.locator(`#${id}`).textContent()) ?? '')),
    );
    const foundError = texts.some((t) => /too short/i.test(t));
    expect(foundError, 'an aria-describedby target should contain the error text').toBe(true);
  });

  test('@a11y @forms prefix/suffix project into the form-field slots without disturbing the input', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const amount = input.prefixSuffixSection.getByLabel('Amount');
    await expect(amount).toBeVisible();
    await expect(amount).toHaveAttribute('type', 'number');

    // Form-field renders <ng-content select="[slot=prefix]"> before the
    // infix and <ng-content select="[slot=suffix]"> after it; the projected
    // siblings live alongside the wrapping infix div, not inside the
    // <input>. Anchor by the literal symbol text inside the same section.
    await expect(input.prefixSuffixSection.getByText('$', { exact: true })).toBeVisible();
    await expect(input.prefixSuffixSection.getByText('USD', { exact: true })).toBeVisible();

    // Typing into the input still works — the slots don't intercept focus.
    await amount.fill('42');
    await expect(amount).toHaveValue('42');
  });

  test('@interaction @forms TW_INPUT_VALUE_ACCESSOR replaces value storage (uppercase example)', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const product = input.accessorInput;
    await product.fill('abc-123');
    // The directive's host binding `[value]="value()"` reflects the
    // uppercased signal back to the DOM input — the visible value is
    // ALWAYS uppercase, regardless of the keystrokes that produced it.
    await expect(product).toHaveValue('ABC-123');
  });

  test('@interaction @forms Input Types: type attribute forwards to the underlying element', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    // The directive forwards the `type` input as the native `type` attribute
    // through its host binding. Verify the four canonical types the demo
    // exposes — non-text types are the ones most likely to regress through
    // a future host-binding refactor.
    await expect(input.typesSection.getByLabel('Email')).toHaveAttribute('type', 'email');
    await expect(input.typesSection.getByLabel('Password')).toHaveAttribute('type', 'password');
    await expect(input.typesSection.getByLabel('Age')).toHaveAttribute('type', 'number');
    await expect(input.typesSection.getByLabel('Date of birth')).toHaveAttribute('type', 'date');
  });

  test('@interaction @forms Playground: error styling tracks the reactive control state', async ({
    page,
  }) => {
    const input = new InputPage(page);
    await input.goto();

    const playground = input.playgroundSection;

    // Default playground config: inside form-field, type=text. Toggle
    // required + error to drive the error branch.
    await playground.getByRole('button', { name: 'required', exact: true }).click();
    await playground.getByRole('button', { name: 'error (touch + invalid)', exact: true }).click();

    // Touch the input → its `ngControl.touched` flips, errorStateMatcher
    // returns true, aria-invalid appears.
    const playInput = playground.getByLabel('Playground field');
    await playInput.focus();
    await playInput.blur();
    await expect(playInput).toHaveAttribute('aria-invalid', 'true');
  });
});
