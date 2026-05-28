import { expect, test } from '../../fixtures/base';
import { TabsPage } from '../../pages/tabs.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Tabs', () => {
  test('@interaction clicking a tab activates the matching panel', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    const security = t.tab(t.variantsSection, /^Security$/).first();
    await security.click();
    await expect(security).toHaveAttribute('aria-selected', 'true');

    await expect(security).toHaveAttribute('aria-controls', /\S/);
    const panelId = await security.getAttribute('aria-controls');
    const panel = page.locator(`#${panelId}`);
    await expect(panel).toHaveAttribute('aria-labelledby', (await security.getAttribute('id')) ?? '');
    await expect(panel).toBeVisible();
  });

  test('@a11y selected tab has tabindex=0; siblings have tabindex=-1', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    const tabs = t.tablist(t.variantsSection).getByRole('tab');
    const selected = tabs.filter({ has: page.locator('[aria-selected="true"]') }).or(
      tabs.and(page.locator('[aria-selected="true"]')),
    );
    const allTabs = await tabs.all();
    let foundActive = false;
    for (const tb of allTabs) {
      const selectedAttr = await tb.getAttribute('aria-selected');
      const tabindex = await tb.getAttribute('tabindex');
      if (selectedAttr === 'true') {
        expect(tabindex === '0' || tabindex === null).toBe(true);
        foundActive = true;
      } else {
        expect(tabindex).toBe('-1');
      }
    }
    expect(foundActive).toBe(true);
    void selected;
  });

  test('@a11y ArrowRight auto-activates the next tab; ArrowLeft cycles back', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    // Use the Disabled Tab section — it has a known initial state ("Draft").
    const draft = t.tab(t.disabledSection, /^Draft$/);
    await draft.click();
    await expect(draft).toHaveAttribute('aria-selected', 'true');

    // ArrowRight → "Scheduled" is disabled, so the source skips it and lands on "Published".
    await page.keyboard.press('ArrowRight');
    const published = t.tab(t.disabledSection, /^Published$/);
    await expect(published).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('ArrowLeft');
    await expect(draft).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y Home / End jump to first / last enabled tab', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    const draft = t.tab(t.disabledSection, /^Draft$/);
    await draft.click();
    await page.keyboard.press('End');
    await expect(t.tab(t.disabledSection, /^Published$/)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Home');
    await expect(draft).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y disabled tab carries aria-disabled="true" and cannot be activated by click', async ({
    page,
  }) => {
    const t = new TabsPage(page);
    await t.goto();

    const scheduled = t.tab(t.disabledSection, /^Scheduled$/);
    await expect(scheduled).toHaveAttribute('aria-disabled', 'true');

    // Source applies `pointer-events-none` to disabled triggers; force the click
    // through so we exercise the host (click) handler — the activation must
    // still be a no-op.
    await scheduled.click({ force: true });
    await expect(scheduled).not.toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y vertical orientation switches arrow keys to up/down', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    const tablist = t.verticalSection.locator('tw-tabs').first().getByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-orientation', 'vertical');

    const tabs = tablist.getByRole('tab');
    await tabs.first().click();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('@interaction closing the active closable tab activates a sibling', async ({ page }) => {
    const t = new TabsPage(page);
    await t.goto();

    // Tab trigger is `<button role="tab">` — the source template nests a
    // close `<button>` inside but the browser hoists nested buttons during
    // HTML parsing, so the close button becomes a DOM sibling of the
    // trigger. Locate each by its own selector rather than parent-child.
    const review = t.closableSection.locator('button[role="tab"][id$="tab-review"]');
    await review.click();
    await expect(review).toHaveAttribute('aria-selected', 'true');

    const closeBtn = t.closableSection.locator('button[aria-label="Close Review"]');
    await closeBtn.click();

    // The source's `findNearestEnabledTab` searches forward first, then
    // backward. Closing 'review' (the active tab) re-selects 'published'
    // (next enabled sibling) — overriding the demo's own reset-to-home that
    // runs first synchronously via the `(closed)` callback. End state:
    // 'published' is active and 'review' is gone.
    const published = t.closableSection.locator('button[role="tab"][id$="tab-published"]');
    await expect(published).toHaveAttribute('aria-selected', 'true');
    await expect(review).toHaveCount(0);
  });

  test('@interaction lazy panel content is not mounted until the tab is first activated', async ({
    page,
  }) => {
    const t = new TabsPage(page);
    await t.goto();

    const overview = t.tab(t.lazySection, /^Overview$/);
    await overview.click();

    // `shouldRenderPanel` returns false for lazy tabs that have never been
    // activated — the panel `<div>` is absent from the DOM entirely.
    const analytics = t.tab(t.lazySection, /^Analytics$/);
    await expect(analytics).toHaveAttribute('aria-controls', /\S/);
    const analyticsPanelId = await analytics.getAttribute('aria-controls');
    const analyticsPanel = page.locator(`#${analyticsPanelId}`);

    await expect(analyticsPanel).toHaveCount(0);

    // Activate; the panel materialises and the lazy content is mounted.
    await analytics.click();
    await expect(analyticsPanel).toBeAttached();
    await expect(analyticsPanel).toContainText(/Pretend this pulled down a chart library/);

    // Switching away keeps the panel alive — switch back, same text.
    await overview.click();
    await analytics.click();
    await expect(analyticsPanel).toContainText(/Pretend this pulled down a chart library/);
  });
});
