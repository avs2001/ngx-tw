import type { Request } from '@playwright/test';
import { expect, test } from '../../fixtures/base';
import { ShellPage } from '../../pages/shell.page';
import { OUTLET_READY_TIMEOUT_MS } from '../../support/timing';

test.describe.configure({ mode: 'parallel' });

/**
 * Every component route in `app.routes.ts` uses `loadChildren` with a dynamic
 * `import()` — visiting one for the first time should download at least one
 * brand-new JS chunk. The route table is nested (parent uses `loadChildren`,
 * each sub-route uses `loadComponent`), so a single nav typically fetches
 * 2–3 chunks: the routes config, the page-wrapper component, and the
 * leaf overview / examples / api component. Asserting `≥ 1` still catches
 * the regression we care about (somebody flipping a route to eager loading
 * fetches zero new chunks), without false-positives from the nested split.
 *
 * Picked three components from different declaration positions so we exercise
 * the import graph without ballooning the smoke-suite runtime.
 */
const NAV_SEQUENCE = [
  { group: 'Button', component: 'button' as const, child: 'Examples' as const },
  { group: 'Alert', component: 'alert' as const, child: 'Examples' as const },
  { group: 'Dialog', component: 'dialog' as const, child: 'Examples' as const },
] as const;

test('@smoke component-route navigation triggers lazy chunk loading', async ({
  page,
}) => {
  const shell = new ShellPage(page);

  const seen = new Set<string>();
  const onRequest = (request: Request) => {
    const url = request.url();
    if (!url.endsWith('.js') && !url.includes('.js?')) return;
    seen.add(url);
  };

  // Land somewhere neutral first, then start counting. The starting page
  // brings in its own chunks which we don't want attributed to the next nav.
  await page.goto('/components/button/overview');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: OUTLET_READY_TIMEOUT_MS });

  page.on('request', onRequest);

  for (const step of NAV_SEQUENCE) {
    seen.clear();
    await shell.expandGroup(step.group);

    const link = shell.navChildLink(step.component, step.child);
    const targetUrl = `**/components/${step.component}/${step.child.toLowerCase()}`;
    await Promise.all([page.waitForURL(targetUrl), link.click()]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: OUTLET_READY_TIMEOUT_MS });

    // Filter out hot-reload sentinels and framework chunks that may be
    // re-fetched. What remains is the route-specific lazy work.
    const newChunks = [...seen].filter(
      (u) =>
        !u.includes('@angular') &&
        !u.includes('@vite') &&
        !u.includes('hot-update') &&
        !u.includes('chrome-extension://'),
    );

    expect(
      newChunks.length,
      `expected at least one new JS chunk for ${step.component}, got: ${JSON.stringify(newChunks)}`,
    ).toBeGreaterThanOrEqual(1);
  }

  page.off('request', onRequest);
});
