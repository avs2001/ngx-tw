import { expect, test } from '../../fixtures/base';
import { CodeBlockPage } from '../../pages/code-block.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Code block interaction + a11y suite.
 *
 * Per `chapter 04 §Code Block`:
 *   - Pre region has `role="region"` + an aria-label naming the language.
 *   - Copy button: click → button label toggles to "Copied" for ≈2 s and
 *     `(copied)` emits. We assert the visible outcome (label + counter).
 *   - `[wrap]="true"` flips the inner `<pre>` from `whitespace-pre` to
 *     `whitespace-pre-wrap`.
 */
test.describe('Code Block', () => {
  test('@a11y pre carries a language-named aria-label', async ({ page }) => {
    const cb = new CodeBlockPage(page);
    await cb.goto();

    // Post-S* the `<pre>` is no longer a `role="region"` (mount many code
    // blocks on a docs page and the duplicate region names trip axe's
    // `landmark-unique`). It still owns an accessible name via `aria-label`
    // so SR users can identify the language; that's what we assert here.
    const typescriptBlock = cb.main
      .locator('tw-code-block')
      .filter({ has: page.locator('pre[aria-label*="TypeScript" i]') })
      .first();
    const pre = typescriptBlock.locator('pre');
    await expect(pre.first()).toHaveAttribute('aria-label', /typescript/i);
  });

  test('@interaction copy button toggles label to "Copied" and emits (copied)', async ({
    page,
    context,
    browserName,
  }) => {
    // `clipboard-read` / `clipboard-write` are chromium permission ids;
    // calling `grantPermissions` with them under firefox / webkit throws
    // ("unknown permission"). Skip the copy round-trip on non-chromium —
    // the unit spec covers the CDK clipboard wiring under jsdom.
    test.skip(
      browserName !== 'chromium',
      `${browserName} does not expose chromium-style clipboard permissions`,
    );
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const cb = new CodeBlockPage(page);
    await cb.goto();

    // Counter paragraph is the one that contains the literal "Copied N time"
    // template — distinct from the static instructional paragraph above.
    const counter = cb.copySection.locator('p', { hasText: /Copied \d+ time/ });
    await expect(counter).toContainText('0 times');

    const copy = cb.copySection.getByRole('button', { name: 'Copy code' });
    await copy.click();

    // The accessible name flips to "Copied" while the timer is alive.
    await expect(cb.copySection.getByRole('button', { name: 'Copied' })).toBeVisible();
    await expect(counter).toContainText('1 time');
  });

  test('@interaction [wrap]="true" applies whitespace-pre-wrap to the <pre>', async ({ page }) => {
    const cb = new CodeBlockPage(page);
    await cb.goto();

    const wrapped = cb.wrapSection.locator('pre').first();
    const cls = await wrapped.getAttribute('class');
    expect(cls, 'pre should carry whitespace-pre-wrap when wrap=true').toMatch(/whitespace-pre-wrap/);
  });
});
