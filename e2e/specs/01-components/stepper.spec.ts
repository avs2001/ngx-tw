import { expect, test } from '../../fixtures/base';
import { StepperPage } from '../../pages/stepper.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Stepper', () => {
  test('@interaction clicking a non-linear step header activates that step', async ({ page }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const headers = stepper.stepHeaders(stepper.variantsSection).first().locator('xpath=..');
    // Within the first stepper (default variant) — click the third header.
    const firstStepperHeaders = stepper.variantsSection
      .locator('tw-stepper')
      .first()
      .locator('button[role="tab"]');
    await firstStepperHeaders.nth(2).click();
    await expect(firstStepperHeaders.nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(firstStepperHeaders.nth(0)).toHaveAttribute('aria-selected', 'false');
    // Silence unused-var lint — `headers` documents the lookup pattern.
    void headers;
  });

  test('@a11y header strip exposes role="tablist" with horizontal aria-orientation by default', async ({
    page,
  }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const tablist = stepper.tablist(stepper.variantsSection);
    await expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('@a11y vertical orientation exposes disclosure buttons, not a tablist', async ({
    page,
  }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    // The vertical panel renders inline inside the header strip, and a
    // tablist may own nothing but tabs (axe: "Element has children which are
    // not allowed: [role=tabpanel]"). The vertical stepper therefore drops
    // the tab roles for disclosure semantics.
    await expect(stepper.tablist(stepper.verticalSection)).toHaveCount(0);

    const headers = stepper.verticalSection.locator('tw-stepper button[cdkStepHeader]');
    await expect(headers.first()).toHaveAttribute('aria-expanded', 'true');
    await expect(headers.nth(1)).toHaveAttribute('aria-expanded', 'false');

    await headers.nth(1).click();
    await expect(headers.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(headers.first()).toHaveAttribute('aria-expanded', 'false');
  });

  test('@interaction linear mode blocks Next until stepControl is valid', async ({ page }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const section = stepper.linearSection;
    const headers = section.locator('tw-stepper button[role="tab"]');
    await expect(headers.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Click Next while email control is invalid → stays on step 0.
    await section.getByRole('button', { name: 'Next', exact: true }).first().click();
    await expect(headers.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Fill a valid email, then advance.
    await section.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
    await section.getByRole('button', { name: 'Next', exact: true }).first().click();
    await expect(headers.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Password too short — Next no-ops.
    await section.getByLabel('Password', { exact: true }).fill('short');
    await section.getByRole('button', { name: 'Next', exact: true }).first().click();
    await expect(headers.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Password long enough — advances to confirm.
    await section.getByLabel('Password', { exact: true }).fill('longenoughpw');
    await section.getByRole('button', { name: 'Next', exact: true }).first().click();
    await expect(headers.nth(2)).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y error step renders aria-invalid="true" on its header', async ({ page }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const errorHeaders = stepper.errorSection.locator('button[role="tab"]');
    await expect(errorHeaders.nth(0)).toHaveAttribute('aria-invalid', 'true');
    // Healthy siblings carry no aria-invalid attribute (null bind suppresses it).
    await expect(errorHeaders.nth(1)).not.toHaveAttribute('aria-invalid', /.+/);
  });

  test('@interaction Previous navigates back through visited steps in linear mode', async ({
    page,
  }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const section = stepper.linearSection;
    const headers = section.locator('tw-stepper button[role="tab"]');

    await section.getByRole('textbox', { name: 'Email' }).fill('user@example.com');
    await section.getByRole('button', { name: 'Next', exact: true }).first().click();
    await expect(headers.nth(1)).toHaveAttribute('aria-selected', 'true');

    await section.getByRole('button', { name: 'Back', exact: true }).first().click();
    await expect(headers.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('@interaction non-linear stepper allows jumping forward by clicking any header', async ({
    page,
  }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    // The Variants section's first stepper is non-linear — jump directly to step 3.
    const headers = stepper.variantsSection
      .locator('tw-stepper')
      .first()
      .locator('button[role="tab"]');
    await headers.nth(2).click();
    await expect(headers.nth(2)).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y selected step header sets aria-current="step"', async ({ page }) => {
    const stepper = new StepperPage(page);
    await stepper.goto();

    const headers = stepper.variantsSection
      .locator('tw-stepper')
      .first()
      .locator('button[role="tab"]');
    await expect(headers.nth(0)).toHaveAttribute('aria-current', 'step');
    await headers.nth(1).click();
    await expect(headers.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(headers.nth(0)).not.toHaveAttribute('aria-current', 'step');
  });
});
