import { expect, test } from '../../fixtures/base';
import { FormFieldPage } from '../../pages/form-field.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Form field interaction + a11y suite.
 *
 * Per `chapter 04 §Form Field`:
 *   - Label, hint, and error slots render in the documented DOM positions.
 *   - Required input advertises `aria-required="true"`.
 *   - `aria-describedby` on the control resolves to the hint id while valid,
 *     and to the error id (or both) once the control is in its error state.
 */
test.describe('Form Field', () => {
  test('@a11y label / hint are wired to the input via aria-describedby', async ({ page }) => {
    const field = new FormFieldPage(page);
    await field.goto();

    const outline = field.appearanceSection.locator('tw-form-field').first();
    const input = outline.getByRole('textbox');
    const describedBy = await input.getAttribute('aria-describedby');
    expect(describedBy, 'aria-describedby should resolve to the hint id').toBeTruthy();
    const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);
    // The text inside the hint span is the Appearance section's "Full legal
    // company name." copy — confirm describedby resolves to it.
    let foundHint = false;
    for (const id of ids) {
      const text = await page.locator(`#${id}`).innerText();
      if (/full legal company name/i.test(text)) foundHint = true;
    }
    expect(foundHint, 'one of the described-by ids must resolve to the hint').toBe(true);
  });

  test('@a11y required input advertises aria-required="true"', async ({ page }) => {
    const field = new FormFieldPage(page);
    await field.goto();

    // The Required-marker block in States.
    const username = field.statesSection.locator('tw-form-field').filter({
      has: page.locator('input[required]'),
    }).first();
    const usernameInput = username.getByRole('textbox');
    await expect(usernameInput).toHaveAttribute('aria-required', 'true');
  });

  test('@interaction reactive form: pressing Validate shows projected twError messages', async ({
    page,
  }) => {
    const field = new FormFieldPage(page);
    await field.goto();

    // Scope assertions to the live form — the section also contains a
    // tw-code-block whose rendered source mentions those error literals.
    const form = field.reactiveSection.locator('form');
    await expect(form).not.toContainText('Enter your full name.');

    // Focus the Full name input and tab away — the default ErrorStateMatcher
    // surfaces errors once the control is touched + invalid.
    const name = form.locator('input[formcontrolname="name"]');
    await name.focus();
    await name.blur();
    await expect(form).toContainText('Enter your full name.');
  });
});
