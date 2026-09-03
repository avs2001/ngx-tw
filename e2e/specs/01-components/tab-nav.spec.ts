import { expect, test } from '../../fixtures/base';
import { TabNavPage } from '../../pages/tab-nav.page';

test.describe.configure({ mode: 'parallel' });

test.describe('Tab Nav', () => {
  test('@a11y landmark pattern: active link carries aria-current="page"', async ({ page }) => {
    const nav = new TabNavPage(page);
    await nav.goto();

    const links = nav.variantsSection
      .locator('nav[twTabNav]')
      .first()
      .locator('a[twTabLink]');
    // Demo initial state: "Dashboard" is active.
    await expect(links.first()).toHaveAttribute('aria-current', 'page');
    await expect(links.nth(1)).not.toHaveAttribute('aria-current', /.+/);

    await links.nth(2).click();
    await expect(links.nth(2)).toHaveAttribute('aria-current', 'page');
    await expect(links.first()).not.toHaveAttribute('aria-current', /.+/);
  });

  test('@a11y tabs pattern: nav becomes role="tablist" with role="tab" links and aria-selected', async ({
    page,
  }) => {
    const nav = new TabNavPage(page);
    await nav.goto();

    const tablist = nav.panelSection.locator('nav[twTabNav]');
    await expect(tablist).toHaveAttribute('role', 'tablist');

    const tabs = tablist.getByRole('tab');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    // Tabs pattern uses aria-selected, NOT aria-current.
    await expect(tabs.first()).not.toHaveAttribute('aria-current', /.+/);

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
  });

  test('@a11y tabs pattern: panel aria-labelledby tracks the active link', async ({ page }) => {
    const nav = new TabNavPage(page);
    await nav.goto();

    const tablist = nav.panelSection.locator('nav[twTabNav]');
    const panel = nav.panel;
    await expect(panel).toHaveAttribute('role', 'tabpanel');

    const accountId = await tablist.getByRole('tab', { name: 'Account' }).getAttribute('id');
    await expect(panel).toHaveAttribute('aria-labelledby', accountId ?? '');

    await tablist.getByRole('tab', { name: 'Billing' }).click();
    const billingId = await tablist.getByRole('tab', { name: 'Billing' }).getAttribute('id');
    await expect(panel).toHaveAttribute('aria-labelledby', billingId ?? '');
  });

  test('@a11y tabs pattern uses manual activation — Arrow moves focus, not selection', async ({
    page,
  }) => {
    const nav = new TabNavPage(page);
    await nav.goto();

    const tablist = nav.panelSection.locator('nav[twTabNav]');
    const account = tablist.getByRole('tab', { name: 'Account' });
    const billing = tablist.getByRole('tab', { name: 'Billing' });

    await account.focus();
    await page.keyboard.press('ArrowRight');

    // Focus moves to Billing, but selection stays on Account (manual activation).
    await expect(billing).toBeFocused();
    await expect(account).toHaveAttribute('aria-selected', 'true');

    // Enter activates the focused tab.
    await page.keyboard.press('Enter');
    await expect(billing).toHaveAttribute('aria-selected', 'true');
  });

  test('@a11y disabled link blocks click and exposes aria-disabled', async ({ page }) => {
    const nav = new TabNavPage(page);
    await nav.goto();

    const disabled = nav.disabledSection.getByRole('link', { name: 'Coming Soon', exact: true });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');

    const enabled = nav.disabledSection.getByRole('link', { name: 'Enabled', exact: true });
    await enabled.click();
    await expect(enabled).toHaveAttribute('aria-current', 'page');

    // Force a click through pointer-events-none to exercise the host handler — it
    // must call preventDefault and leave aria-current unchanged.
    await disabled.click({ force: true });
    await expect(disabled).not.toHaveAttribute('aria-current', /.+/);
    await expect(enabled).toHaveAttribute('aria-current', 'page');
  });

  test.fixme(
    '[fixme:tab-nav/routerlink-url] @interaction routerLink-driven tab updates the URL on click',
    async () => {
      // BLOCKED — demo does not wire `routerLink` on any twTabLink. See
      // docs/e2e/REVIEW.md §tab-nav. Re-enable after a routed demo section
      // lands (NEEDS-DEMO-CHANGE).
    },
  );

  test.fixme(
    '[fixme:tab-nav/routerlink-restore] @interaction refreshing the page restores the active routed tab',
    async () => {
      // BLOCKED — same root cause as above (NEEDS-DEMO-CHANGE for routerLink).
    },
  );
});
