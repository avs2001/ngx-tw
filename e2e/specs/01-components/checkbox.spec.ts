import { expect, test } from '../../fixtures/base';
import { CheckboxPage } from '../../pages/checkbox.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Checkbox interaction + a11y suite.
 *
 * Per `chapter 04 §Checkbox / Radio / Switch`:
 *   - Renders, toggles on click, toggles on `Space`.
 *   - Indeterminate → click moves to `checked`; `aria-checked="mixed"` while indeterminate.
 *   - Disabled blocks click + keyboard.
 *   - `variant="solid" | "outline"` matrix.
 *   - Required indicator drives `aria-required="true"`.
 *
 * Three-strategy reset coverage lives in
 * `e2e/specs/02-cross-cutting/forms-three-strategies/checkbox.spec.ts`.
 */
test.describe('Checkbox', () => {
  test('@interaction default render exposes role=checkbox with aria-checked', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const first = checkbox.variantsSection.getByRole('checkbox').first();
    await expect(first).toBeVisible();
    // Demo variantValues default to `true` — aria-checked starts truthy.
    await expect(first).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction click toggles checked state and aria-checked', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    // The newsletter checkbox in "With description" is the cleanest target —
    // it defaults to unchecked (`newsletterValue = signal(false)`).
    const newsletter = checkbox.descriptionSection.getByRole('checkbox', {
      name: /subscribe to the product newsletter/i,
    });
    await expect(newsletter).toHaveAttribute('aria-checked', 'false');

    await newsletter.click();
    await expect(newsletter).toHaveAttribute('aria-checked', 'true');

    await newsletter.click();
    await expect(newsletter).toHaveAttribute('aria-checked', 'false');
  });

  test('@interaction @keyboard Space toggles via keyboard, Enter does not', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const newsletter = checkbox.descriptionSection.getByRole('checkbox', {
      name: /subscribe to the product newsletter/i,
    });
    await newsletter.focus();
    await expect(newsletter).toBeFocused();
    await expect(newsletter).toHaveAttribute('aria-checked', 'false');

    await page.keyboard.press('Space');
    await expect(newsletter).toHaveAttribute('aria-checked', 'true');

    // Enter is NOT bound (matches native checkbox semantics — checkbox.ts:370).
    await page.keyboard.press('Enter');
    await expect(newsletter).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('Space');
    await expect(newsletter).toHaveAttribute('aria-checked', 'false');
  });

  test('@interaction @a11y indeterminate parent: aria-checked="mixed", click moves to checked', async ({
    page,
  }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const parent = checkbox.selectAllCheckbox;
    // Initial demo state: read=true, write=false, admin=false → "some".
    await expect(parent).toHaveAttribute('aria-checked', 'mixed');
    await expect(checkbox.indeterminateSummary).toContainText('some = true');

    // Click the parent — `toggle()` sets checked to true and clears indeterminate.
    await parent.click();
    await expect(parent).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.indeterminateSummary).toContainText('all = true');
    await expect(checkbox.indeterminateSummary).toContainText('some = false');

    // Children cascade to checked.
    await expect(checkbox.permissionCheckbox('Read repository')).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.permissionCheckbox('Write to repository')).toHaveAttribute('aria-checked', 'true');
    await expect(checkbox.permissionCheckbox('Administer repository')).toHaveAttribute('aria-checked', 'true');
  });

  test('@interaction disabled checkbox blocks click and Space', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    // "Disabled, unchecked" in the States section.
    const disabled = checkbox.statesSection
      .getByRole('checkbox', { name: 'Disabled, unchecked' });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('aria-checked', 'false');

    // `pointer-events: none` on the root makes a normal click a no-op without
    // throwing — force the click so Playwright dispatches it regardless of
    // hit-testing, and assert the state did NOT flip.
    await disabled.click({ force: true });
    await expect(disabled).toHaveAttribute('aria-checked', 'false');

    // tabindex is -1 when disabled, so a keyboard focus + Space round-trip
    // shouldn't toggle either. We can't focus a tabindex=-1 element via Tab,
    // but DOM `.focus()` works; the keydown handler still returns early.
    await disabled.focus();
    await page.keyboard.press('Space');
    await expect(disabled).toHaveAttribute('aria-checked', 'false');
  });

  test('@a11y required input advertises aria-required="true"', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const required = checkbox.statesSection.getByRole('checkbox', {
      name: /accept the terms and privacy policy/i,
    });
    await expect(required).toHaveAttribute('aria-required', 'true');
  });

  test('@a11y aria-describedby links to the description id when description is set', async ({
    page,
  }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    const newsletter = checkbox.descriptionSection.getByRole('checkbox', {
      name: /subscribe to the product newsletter/i,
    });
    await expect(
      newsletter,
      'aria-describedby should be set when description input is provided',
    ).toHaveAttribute('aria-describedby', /\S/);
    const describedBy = await newsletter.getAttribute('aria-describedby');
    const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const ref = page.locator(`#${id}`);
      await expect(ref).toContainText(/we'll send a short monthly digest/i);
    }
  });

  test('@interaction custom check icon slot replaces the default tick', async ({ page }) => {
    const checkbox = new CheckboxPage(page);
    await checkbox.goto();

    // The "Draft project brief" task starts checked — its icon SVG is the
    // consumer-projected one (single path with `d="M9.937 …"`), not the
    // default tick (`d="M5 12 l5 5 l9 -11"`).
    const draft = checkbox.customIconSection.getByRole('checkbox', { name: /draft project brief/i });
    await expect(draft).toHaveAttribute('aria-checked', 'true');
    const projectedPath = draft.locator('svg path').first();
    const d = await projectedPath.getAttribute('d');
    expect(d, 'projected check icon should be the consumer-supplied path').toContain('M9.937');
  });

  // Cross-route axe sweep lives in e2e/specs/03-accessibility/examples.spec.ts
  // — no per-component duplication here.
});
