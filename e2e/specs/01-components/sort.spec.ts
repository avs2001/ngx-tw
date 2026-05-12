import { expect, test } from '../../fixtures/base';
import { SortPage } from '../../pages/sort.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Sort', () => {
  test('@interaction clicking a header cycles asc → desc → none', async ({ page }) => {
    const s = new SortPage(page);
    await s.goto();

    // The Composing-with-a-Table section starts unsorted (active=null).
    const customer = s.header(s.tableSection, 'customer');
    await expect(customer).toHaveAttribute('aria-sort', 'none');

    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'ascending');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'descending');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'none');
  });

  test('@interaction clicking a second header resets the first', async ({ page }) => {
    const s = new SortPage(page);
    await s.goto();

    const customer = s.header(s.tableSection, 'customer');
    const amount = s.header(s.tableSection, 'amount');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'ascending');

    await amount.click();
    // Amount starts as `desc` per its per-header override.
    await expect(amount).toHaveAttribute('aria-sort', 'descending');
    await expect(customer).toHaveAttribute('aria-sort', 'none');
  });

  test('@interaction per-header twSortStart overrides the directive default', async ({ page }) => {
    const s = new SortPage(page);
    await s.goto();

    const name = s.header(s.startSection, 'name');
    const amount = s.header(s.startSection, 'amount');

    await name.click();
    await expect(name).toHaveAttribute('aria-sort', 'ascending');

    await amount.click();
    await expect(amount).toHaveAttribute('aria-sort', 'descending');
  });

  test('@interaction disableClear toggles asc ⇄ desc and never returns to none', async ({
    page,
  }) => {
    const s = new SortPage(page);
    await s.goto();

    const customer = s.header(s.disableClearSection, 'customer');
    // Initial: aria-sort="ascending" per the section's twSortDirection="asc".
    await expect(customer).toHaveAttribute('aria-sort', 'ascending');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'descending');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'ascending');
    await customer.click();
    await expect(customer).toHaveAttribute('aria-sort', 'descending');
  });

  test('@a11y disabled directive removes role="button" and tabindex', async ({ page }) => {
    const s = new SortPage(page);
    await s.goto();

    // The States section's first `<div twSort>` carries `[twSortDisabled]="true"`.
    const directive = s.statesSection.locator('[twSort]').first();
    const header = directive.locator('[tw-sort-header]').first();
    await expect(header).not.toHaveAttribute('role', 'button');
    await expect(header).not.toHaveAttribute('tabindex', /\d/);
  });

  test('@a11y single disabled header sets aria-disabled and ignores activation', async ({
    page,
  }) => {
    const s = new SortPage(page);
    await s.goto();

    // The States section renders TWO twSort directives — one with
    // `[twSortDisabled]="true"` (both headers disabled), and a second where
    // only header `id="b"` is `[disabled]="true"`. Scope to the second to
    // hit the "single disabled header" path.
    const singleDirective = s.statesSection.locator('[twSort]').nth(1);
    const locked = singleDirective.locator('[tw-sort-header][id="b"]');
    await expect(locked).toHaveAttribute('aria-disabled', 'true');

    // Force-click through the disabled styling — host handler returns early
    // and aria-sort stays "none".
    await locked.click({ force: true });
    await expect(locked).toHaveAttribute('aria-sort', 'none');
  });

  test('@interaction twSortChange event includes a previous-state snapshot on user click', async ({
    page,
  }) => {
    const s = new SortPage(page);
    await s.goto();

    const name = s.header(s.eventSection, 'name');
    await name.click();
    await expect(s.eventLog).toContainText('"active": "name"');
    await expect(s.eventLog).toContainText('"direction": "asc"');

    await name.click();
    await expect(s.eventLog).toContainText('"direction": "desc"');
    await expect(s.eventLog).toContainText('"previous"');
    await expect(s.eventLog).toContainText('"direction": "asc"');
  });

  test('@interaction keyboard Enter and Space activate a focused header', async ({ page }) => {
    const s = new SortPage(page);
    await s.goto();

    // Use the List section (button-based headers) so focus/keyboard semantics
    // are unambiguous — `<th>` focusability is browser-dependent, but
    // `<button tw-sort-header>` is always focusable.
    const customer = s.listSection.locator('button[tw-sort-header][id="customer"]');
    await customer.focus();
    await expect(customer).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(customer).toHaveAttribute('aria-sort', 'ascending');
    await page.keyboard.press('Space');
    await expect(customer).toHaveAttribute('aria-sort', 'descending');
  });
});
