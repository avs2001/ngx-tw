import { expect, test, type Page } from '../../fixtures/base';
import { COMPONENTS, SERVICES, SUBROUTES } from '../../support/routes';

test.describe.configure({ mode: 'parallel' });

interface PageEntry {
  readonly url: string;
  readonly subroute: (typeof SUBROUTES)[number];
}

const PAGES: readonly PageEntry[] = [
  ...COMPONENTS.flatMap((c) =>
    SUBROUTES.map((s) => ({ url: `/components/${c}/${s}`, subroute: s })),
  ),
  ...SERVICES.flatMap((s) =>
    SUBROUTES.map((sub) => ({ url: `/services/${s}/${sub}`, subroute: sub })),
  ),
];

/**
 * First-hit lazy-chunk compilation can take well over the default 5 s expect
 * timeout under parallel load (the demo's largest example files are 600+
 * lines). Bump the per-assertion timeout for outlet-readiness checks so we
 * fail only on truly broken pages, not slow ones.
 */
const OUTLET_READY_TIMEOUT_MS = 20_000;

/**
 * Console-error patterns that are expected and unrelated to library health.
 * Each entry must include a comment justifying why it's noise. Keep this
 * list short — every entry suppresses real signal.
 */
const ALLOWED_CONSOLE_ERRORS: readonly RegExp[] = [
  // Avatar examples intentionally render broken image URLs to demonstrate
  // the component's fallback behaviour, producing 404s on the image loads.
  /Failed to load resource:.*404 \(Not Found\)/,
];

async function assertOutletReady(
  page: Page,
  subroute: (typeof SUBROUTES)[number],
  errors: readonly string[],
): Promise<void> {
  const locator =
    subroute === 'api'
      ? page.locator('main table').first()
      : page.locator('main').getByRole('heading', { level: 2 }).first();
  try {
    await expect(locator).toBeVisible({ timeout: OUTLET_READY_TIMEOUT_MS });
  } catch (err) {
    // If the outlet never settled, the most useful diagnostic is whether
    // something crashed during init. Bake captured console errors into the
    // failure message so the report points at the root cause rather than at
    // a generic "element not found".
    const consoleSummary = errors.length
      ? `\n\nConsole errors captured before timeout:\n  - ${errors.join('\n  - ')}`
      : '\n\nNo console errors were captured — chunk likely hung or stayed unrendered without throwing.';
    throw new Error(
      `${(err as Error).message}${consoleSummary}`,
    );
  }
}

/**
 * Page-rendered text with `<pre>` / `<code>` content stripped — those
 * elements often contain literal Angular template syntax shown for
 * documentation purposes (the `tw-code-block` source views, for instance).
 * Without stripping, every code sample produces a false-positive
 * "unresolved interpolation" hit.
 */
async function getDocumentationText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const clone = document.body.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('pre, code').forEach((el) => el.remove());
    return (clone as HTMLElement).innerText;
  });
}

for (const { url, subroute } of PAGES) {
  test(`@smoke ${url} loads cleanly`, async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (ALLOWED_CONSOLE_ERRORS.some((pattern) => pattern.test(text))) return;
      errors.push(`console.error: ${text}`);
    });

    await page.goto(url);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: OUTLET_READY_TIMEOUT_MS,
    });
    await assertOutletReady(page, subroute, errors);

    const proseText = await getDocumentationText(page);
    expect(proseText, 'unresolved Angular interpolation in DOM').not.toMatch(
      /\{\{[^}]+\}\}/,
    );
    expect(proseText, '[object Object] leak suggests a missing pipe').not.toContain(
      '[object Object]',
    );

    expect(errors, 'unexpected console.error / pageerror during route load').toEqual([]);
  });
}
