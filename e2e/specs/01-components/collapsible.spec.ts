import { expect, test } from '../../fixtures/base';
import { CollapsiblePage } from '../../pages/collapsible.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Collapsible interaction + a11y suite.
 *
 * Per `chapter 04 §Collapsible`:
 *   - Toggle button shows/hides content; default `@if (open())` removes the
 *     panel from the DOM entirely when closed.
 *   - `aria-expanded` mirrors the open state; `aria-controls` resolves to
 *     the panel id (which then carries `role="region"` + `aria-labelledby`).
 *   - `keepAlive="true"` preserves the panel content across toggles.
 *   - Custom `twCollapsibleIcon` slot replaces the default chevron.
 */
test.describe('Collapsible', () => {
  test('@interaction toggle shows / hides the panel and removes it from the DOM when closed', async ({
    page,
  }) => {
    const c = new CollapsiblePage(page);
    await c.goto();

    const collapsible = c.variantsSection.locator('tw-collapsible').first();
    const trigger = collapsible.getByRole('button');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Panel region is absent before first open.
    await expect(collapsible.locator('[role="region"]')).toHaveCount(0);

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const panel = collapsible.locator('[role="region"]');
    await expect(panel).toHaveCount(1);

    // aria-controls on trigger → id on panel — the contract that screen
    // readers use to pair them.
    await expect(
      trigger,
      'aria-controls must be set when the panel is open',
    ).toHaveAttribute('aria-controls', /\S/);
    const controls = await trigger.getAttribute('aria-controls');
    await expect(panel).toHaveAttribute('id', controls ?? '');

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(collapsible.locator('[role="region"]')).toHaveCount(0);
  });

  test('@interaction keepAlive=true preserves panel state across close/open', async ({ page }) => {
    const c = new CollapsiblePage(page);
    await c.goto();

    const kept = c.keepAliveSection.locator('tw-collapsible').first();
    const trigger = kept.getByRole('button', { name: /keepAlive = true/ });
    await trigger.click();

    // Increment counter to 3.
    const increment = kept.getByRole('button', { name: 'Increment' });
    await increment.click();
    await increment.click();
    await increment.click();
    await expect(kept).toContainText('Counter: 3');

    // Close — content stays mounted (display:none); reopen and counter is
    // still 3 (vs the sibling destroy panel that would reset to 0).
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(kept).toContainText('Counter: 3');
  });

  test('@interaction custom twCollapsibleIcon replaces the default chevron', async ({ page }) => {
    const c = new CollapsiblePage(page);
    await c.goto();

    // The custom icon trigger has a projected <svg> whose `d` attribute is
    // the plus-icon path (`M10.75 4.75…`) before any click. The default
    // chevron path starts with `M5.23` — assert the projected one wins.
    const trigger = c.customIconSection.getByRole('button', { name: /Custom icon collapsible/ });
    const projectedPath = trigger.locator('svg path').first();
    const d = await projectedPath.getAttribute('d');
    expect(d, 'projected icon path should not be the default chevron').toMatch(/^M10\.75/);
  });
});
