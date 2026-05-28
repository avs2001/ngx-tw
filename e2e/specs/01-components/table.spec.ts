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

  test('@interaction row selection (checkbox column) tracks correctly with select-all', async ({
    page,
  }) => {
    const t = new TablePage(page);
    await t.goto();

    const section = t.selectionSection;
    const masterCheckbox = section.locator('thead tw-checkbox').first();
    const rowCheckboxes = section.locator('tbody tw-checkbox');

    // Initial state: nothing selected.
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'false');
    await expect(rowCheckboxes.first()).toHaveAttribute('aria-checked', 'false');

    // Toggle one row → master becomes mixed; the row reports aria-checked=true.
    await rowCheckboxes.first().click();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'mixed');
    await expect(rowCheckboxes.first()).toHaveAttribute('aria-checked', 'true');

    // Click master to select all.
    await masterCheckbox.click();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'true');
    const rowCount = await rowCheckboxes.count();
    for (let i = 0; i < rowCount; i++) {
      await expect(rowCheckboxes.nth(i)).toHaveAttribute('aria-checked', 'true');
    }

    // Click master again to clear.
    await masterCheckbox.click();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'false');
    for (let i = 0; i < rowCount; i++) {
      await expect(rowCheckboxes.nth(i)).toHaveAttribute('aria-checked', 'false');
    }
  });

  test('@a11y selected rows expose aria-selected on the data <tr>', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    const section = t.selectionSection;
    const rows = section.locator('tbody > tr');
    const rowCheckboxes = section.locator('tbody tw-checkbox');

    // Every data row reports aria-selected when selection is enabled.
    await expect(rows.first()).toHaveAttribute('aria-selected', 'false');

    await rowCheckboxes.nth(1).click();
    await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(rows.first()).toHaveAttribute('aria-selected', 'false');
  });

  test('@a11y aria-sort flows onto the active column header <th>', async ({ page }) => {
    const t = new TablePage(page);
    await t.goto();

    const idHeader = t.sortableSection
      .locator('thead th[data-column="customer"]')
      .first();

    // No sort active yet — no aria-sort on the header.
    await expect(idHeader).not.toHaveAttribute('aria-sort', /.+/);

    // Click the sort trigger inside the customer column to activate sort.
    await t.sortableSection.locator('[tw-sort-header][id="customer"]').click();
    await expect(idHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  test.fixme(
    '@a11y keyboard nav across cells follows the WAI-ARIA grid pattern',
    async () => {
      // BLOCKED — out of scope for v1 per `table.ts` header note (no
      // arrow-key grid pattern). Re-enable if/when source adopts the APG
      // grid pattern.
    },
  );
});
