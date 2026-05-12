import { expect, test } from '../../fixtures/base';
import { AccordionPage } from '../../pages/accordion.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Accordion interaction + a11y suite.
 *
 * Per `chapter 04 §Accordion`:
 *   - Single mode: opening B closes A.
 *   - Multiple mode: A and B stay open simultaneously.
 *   - Keyboard: ArrowDown / ArrowUp / Home / End across triggers.
 *   - `[collapsible]="false"` in single mode: clicking the open panel does NOT close it.
 *   - Disabled trigger is skipped by arrow-key navigation (States section).
 */
test.describe('Accordion', () => {
  test('@interaction single mode: opening Panel B closes Panel A', async ({ page }) => {
    const accordion = new AccordionPage(page);
    await accordion.goto();

    const single = accordion.accordionByTriggerLabel('Panel A');
    const panelA = single.getByRole('button', { name: 'Panel A' });
    const panelB = single.getByRole('button', { name: 'Panel B' });

    await panelA.click();
    await expect(panelA).toHaveAttribute('aria-expanded', 'true');

    await panelB.click();
    await expect(panelB).toHaveAttribute('aria-expanded', 'true');
    // Single mode → A closes when B opens.
    await expect(panelA).toHaveAttribute('aria-expanded', 'false');
  });

  test('@interaction multiple mode: Panel X and Panel Y can be open at the same time', async ({
    page,
  }) => {
    const accordion = new AccordionPage(page);
    await accordion.goto();

    const multi = accordion.accordionByTriggerLabel('Panel X');
    const x = multi.getByRole('button', { name: 'Panel X' });
    const y = multi.getByRole('button', { name: 'Panel Y' });

    await x.click();
    await y.click();
    await expect(x).toHaveAttribute('aria-expanded', 'true');
    await expect(y).toHaveAttribute('aria-expanded', 'true');
  });

  test('@interaction [collapsible]="false" prevents closing the only open panel', async ({
    page,
  }) => {
    const accordion = new AccordionPage(page);
    await accordion.goto();

    // The "Single with forced open" accordion seeds `forcedValue="overview"`.
    const forced = accordion.accordionByTriggerLabel('Overview');
    const overview = forced.getByRole('button', { name: 'Overview' });
    await expect(overview).toHaveAttribute('aria-expanded', 'true');

    // Re-click the open trigger — it must NOT close (collapsible=false).
    await overview.click();
    await expect(overview).toHaveAttribute('aria-expanded', 'true');

    // Opening a different panel closes the first, but the new one stays open.
    const details = forced.getByRole('button', { name: 'Details' });
    await details.click();
    await expect(details).toHaveAttribute('aria-expanded', 'true');
    await expect(overview).toHaveAttribute('aria-expanded', 'false');
    await details.click();
    await expect(details).toHaveAttribute('aria-expanded', 'true');
  });

  test('@a11y @keyboard ArrowDown / ArrowUp move focus across triggers and skip disabled', async ({
    page,
  }) => {
    const accordion = new AccordionPage(page);
    await accordion.goto();

    // States section: Free → (Pro is disabled) → Enterprise.
    const states = accordion.statesSection.locator('tw-accordion');
    const free = states.getByRole('button', { name: 'Free plan' });
    const enterprise = states.getByRole('button', { name: /Enterprise plan/ });

    await free.focus();
    await page.keyboard.press('ArrowDown');
    // The Pro plan is disabled — focus must jump straight to Enterprise.
    await expect(enterprise).toBeFocused();

    await page.keyboard.press('ArrowUp');
    await expect(free).toBeFocused();
  });
});
