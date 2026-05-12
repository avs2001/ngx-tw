import { expect, test } from '../../fixtures/base';
import { ToastPage } from '../../pages/toast.page';

test.describe.configure({ mode: 'parallel' });

/**
 * Toast interaction + a11y suite. Follows the overlay POM recipe
 * (see `e2e/pages/README.md` + `dialog.spec.ts`).
 *
 * Per `chapter 04 §Toast`:
 *   - Service.show() opens a toast in the CDK overlay container.
 *   - Severity drives politeness — `error` → `role="alert"` + `aria-live="assertive"`,
 *     everything else → `role="status"` + `aria-live="polite"`.
 *   - Action button fires the consumer callback (assert via the visible
 *     output panel in the demo).
 */
test.describe('Toast', () => {
  test('@interaction @overlay show() mounts a toast in the overlay container', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();

    await toast.severityTrigger('info').click();
    await expect(toast.topToast).toBeVisible();
    await expect(toast.topToast).toContainText('Build #4812 started');
  });

  test('@a11y @overlay error severity flips to role="alert" + aria-live="assertive"', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();

    await toast.severityTrigger('error').click();
    await expect(toast.topToast).toHaveAttribute('role', 'alert');
    await expect(toast.topToast).toHaveAttribute('aria-live', 'assertive');
  });

  test('@a11y @overlay info severity uses role="status" + aria-live="polite"', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();

    await toast.severityTrigger('success').click();
    await expect(toast.topToast).toHaveAttribute('role', 'status');
    await expect(toast.topToast).toHaveAttribute('aria-live', 'polite');
  });

  test('@interaction @overlay action button fires the consumer callback and updates the readout', async ({
    page,
  }) => {
    const toast = new ToastPage(page);
    await toast.goto();

    await toast.actionSection.getByRole('button', { name: 'Archive item' }).click();
    // The toast opens with an "Undo" action.
    const undo = toast.topToast.getByRole('button', { name: 'Undo' });
    await expect(undo).toBeVisible();
    await undo.click();

    // Demo writes the action label into the visible readout next to the
    // trigger (`Last action: <code>undo clicked — item restored</code>`).
    // The section also contains code-block snippets, so anchor on the
    // readout `<span>Last action: <code/></span>` specifically.
    const readout = toast.actionSection.locator('span', { hasText: 'Last action:' });
    await expect(readout).toBeVisible();
    await expect(readout.locator('code')).toContainText(/undo/i);
  });
});
