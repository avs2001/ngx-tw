import { expect, test } from '../../fixtures/base';
import { TablePage } from '../../pages/table.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Table', () => {
  test('@interaction renders all rows from the demo data set', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    // The Variants section's first table renders 4 rows (`slice(0, 4)`).
    await expect(t.rows(t.variantsSection).first()).toBeVisible();
    await expect(t.rows(t.variantsSection)).toHaveCount(4);
  });

  test('@interaction sortable column click cycles asc → desc → cleared via sort header', async ({
    page,
  }) => {
    const t = new TablePage(page);
    await t.goto();

    const header = t.sortableSection.locator('[tw-sort-header][id="customer"]');
    await expect(header).toHaveAttribute('aria-sort', 'none');

    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');
    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'none');
  });

  test('@interaction sticky header stays at the top while the body scrolls', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    const wrapper = t.stickySection.locator('tw-table').first();
    const headerCell = wrapper.locator('thead > tr > th').first();
    const initialBox = await headerCell.boundingBox();
    expect(initialBox).not.toBeNull();

    // Scroll the table's internal scroll region (the table wraps its body in a
    // scrollable container via scrollHeight="280px").
    await wrapper.evaluate((el) => {
      const scrollable = el.querySelector(
        '[class*="overflow"], .cdk-scrollable, div',
      ) as HTMLElement | null;
      if (scrollable) scrollable.scrollTop = 200;
    });

    const movedBox = await headerCell.boundingBox();
    expect(movedBox).not.toBeNull();
    // Sticky header: its viewport-relative top should not have shifted.
    if (initialBox && movedBox) {
      expect(Math.abs(movedBox.y - initialBox.y)).toBeLessThan(8);
    }
  });

  test('@interaction empty data with *twNoDataRow renders the projected fallback', async ({
    page,
  }) => {
    const t = new TablePage(page);
    await t.goto();

    await expect(t.noDataSection).toContainText('All caught up — no orders to review.');
    // The custom no-data row should be inside a tbody tr — no data rows otherwise.
    const dataRows = t.rows(t.noDataSection).filter({ hasNotText: 'All caught up' });
    await expect(dataRows).toHaveCount(0);
  });

  test('@interaction loading state renders a visible overlay', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    await t.statesSection.getByRole('button', { name: 'loading', exact: true }).click();
    // The library renders a fallback overlay (spinner + "Loading…" message)
    // when `[loading]="true"` and no `slot="loading"` is projected.
    await expect(t.statesSection).toContainText(/Loading/i);
  });

  test('@interaction row expansion toggles via the consumer-rendered button', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    const firstToggle = t.expansionSection
      .locator('tbody button[aria-label="Expand row"], tbody button[aria-label="Collapse row"]')
      .first();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    await firstToggle.click();
    await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(t.expansionSection).toContainText('Notes:');
  });

  test('@interaction footer row renders totals via *twFooterCellDef', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    const footer = t.footerSection.locator('table tfoot');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Totals');
    await expect(footer).toContainText('5 orders');
  });

  test('@a11y table exposes an accessible name via aria-label', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    // The States section binds `aria-label="State demo"` statically (which
    // flows through `input(..., { alias: 'aria-label' })` to the inner
    // `<table>`). The Variants section uses `[attr.aria-label]` instead,
    // which sets the attribute on the host element and bypasses the input —
    // documenting that difference here as a sanity check on the test target.
    const stateTable = t.statesSection.locator('table').first();
    await expect(stateTable).toHaveAttribute('aria-label', 'State demo');
  });

  test.fixme(
    '@interaction row selection (checkbox column) tracks correctly with select-all',
    async () => {
      // BLOCKED for v1. See docs/e2e/REVIEW.md §table — selection API is
      // declared (`setSelected()`/`isSelected()`) but the default cell
      // template ships no checkbox column. Renders in v2. Re-enable once
      // the v2 selection-rendering work lands.
    },
  );

  test.fixme(
    '@a11y keyboard nav across cells follows the WAI-ARIA grid pattern',
    async () => {
      // BLOCKED — out of scope for v1 per `table.ts` header note (no
      // arrow-key grid pattern). Re-enable if/when source adopts the APG
      // grid pattern.
    },
  );
});
