import { expect, test } from '../../fixtures/base';
import { PaginatorPage } from '../../pages/paginator.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Paginator renders in two modes:
 *  - Button mode (no `linkFactory`) — nav controls are `<button>` elements
 *    with the native `disabled` attribute when at-boundary or globally
 *    disabled. Use `toBeDisabled()` to assert.
 *  - Link mode (`linkFactory` provided) — nav controls are `<a>` elements
 *    with `aria-disabled="true"` when at-boundary. Use the explicit
 *    attribute check.
 */
test.describe('Paginator', () => {
  test('@interaction prev/first are disabled on page 1; next/last are enabled when more pages exist', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.typesSection, 0);
    await expect(p.nav(paginator, 'first')).toBeDisabled();
    await expect(p.nav(paginator, 'prev')).toBeDisabled();
    await expect(p.nav(paginator, 'next')).toBeEnabled();
    await expect(p.nav(paginator, 'last')).toBeEnabled();
  });

  test('@interaction Last button jumps to the final page and disables next/last', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.typesSection, 0);
    await p.nav(paginator, 'last').click();
    await expect(p.activePage(paginator)).toHaveText('10');
    await expect(p.nav(paginator, 'next')).toBeDisabled();
    await expect(p.nav(paginator, 'last')).toBeDisabled();
    await expect(p.nav(paginator, 'prev')).toBeEnabled();
  });

  test('@a11y current page button carries aria-current="page"', async ({ page }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.typesSection, 0);
    const active = p.activePage(paginator);
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText('1');

    // With default `siblingCount=1` + `boundaryCount=1` and active=1, page 3
    // sits behind the right ellipsis. Step forward with Next twice and
    // assert the active page tracks.
    await p.nav(paginator, 'next').click();
    await expect(p.activePage(paginator)).toHaveText('2');
    await p.nav(paginator, 'next').click();
    await expect(p.activePage(paginator)).toHaveText('3');
  });

  test('@interaction page-size change re-anchors so the first visible item stays the same', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.pageSizeSection, 0);
    // 47 items / 5 per page → 10 pages; step Next three times to reach page 4
    // (page 4 sits inside the ellipsis range from the initial render).
    await p.nav(paginator, 'next').click();
    await p.nav(paginator, 'next').click();
    await p.nav(paginator, 'next').click();
    await expect(p.pageSizeSection).toContainText('items 16–20 of 47');

    await paginator.locator('select').first().selectOption('10');
    await expect(p.pageSizeSection).toContainText('source = pageSizeChange');
    // Item 16 stays visible — re-anchored to page 2 (11–20) under the new size.
    await expect(p.pageSizeSection).toContainText('items 11–20 of 47');
  });

  test('@interaction `paginated` event carries the documented source discriminator', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.pageSizeSection, 0);
    await p.nav(paginator, 'next').click();
    await expect(p.pageSizeSection).toContainText('source = click');
  });

  test('@interaction ellipsis range collapses interior pages with siblingCount=0', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const tight = p.paginator(p.rangeSection, 1);
    // 500 / 10 = 50 pages. With siblingCount=0 + boundaryCount=2 + an active
    // page in the middle, the source's `buildPaginationRange` emits an
    // `ellipsis-left` / `ellipsis-right` sentinel — rendered as a "…" span
    // with aria-hidden="true".
    const ellipsis = tight.locator('span[aria-hidden="true"]', { hasText: '…' });
    await expect(ellipsis.first()).toBeAttached();
  });

  test('@interaction linkFactory renders page buttons as anchors with href', async ({ page }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.linkSection, 0);
    const anchor = paginator.locator('a[data-tw-paginator-nav="page"]').first();
    await expect(anchor).toBeVisible();
    const href = await anchor.getAttribute('href');
    expect(href).toMatch(/\/products\?page=\d+/);
  });

  test('@a11y disabled paginator marks every button as native-disabled', async ({ page }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    // The States section's first paginator is `[disabled]="true"`.
    const disabled = p.statesSection.locator('tw-paginator').first();
    const buttons = disabled.locator('button[data-tw-paginator-nav]');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }
  });

  test('@interaction hideOnSinglePage suppresses rendering when totalPages <= 1', async ({
    page,
  }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    // The "Hide on single page" subsection renders two paginators sharing a
    // common `[hideOnSinglePage]="true"` flag — 5 items / 10 per page → 1
    // page → suppressed, 50 items / 10 per page → 5 pages → rendered. The
    // most reliable cross-version assertion is at the host level: one
    // `<tw-paginator>` ends up with NO nav child, the other has one.
    const allPaginators = p.statesSection.locator('tw-paginator');
    const totalCount = await allPaginators.count();
    const visibleNavs = await p.statesSection
      .locator('tw-paginator nav[role="navigation"]')
      .count();
    expect(totalCount).toBeGreaterThan(visibleNavs);
  });

  test('@a11y custom labels (i18n) override the button aria-labels', async ({ page }) => {
    const p = new PaginatorPage(page);
    await p.goto();

    const paginator = p.paginator(p.labelsSection, 0);
    // `previous` overridden to "Précédent" — match the aria-label on the
    // rendered button. Use locator filter rather than getByRole name to
    // avoid coupling to accessible-name computation differences.
    const prev = paginator.locator('[data-tw-paginator-nav="prev"][aria-label="Précédent"]');
    await expect(prev).toBeVisible();
    const next = paginator.locator('[data-tw-paginator-nav="next"][aria-label="Suivant"]');
    await expect(next).toBeVisible();
  });
});
