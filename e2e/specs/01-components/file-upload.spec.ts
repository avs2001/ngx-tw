import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * File upload interaction suite. `file-upload` had no dedicated e2e spec, which
 * left its per-row remove button with no second line of defence (the unit spec
 * only ever called `remove(id)` on the component until this pass).
 *
 * What only a browser can do here:
 *   - **The native `<input type="file">` path.** Every unit test fakes file
 *     arrival with a synthetic `drop` carrying a hand-built `DataTransfer`. The
 *     real `change` event from a file picker is a different entry point.
 *   - **Real focus after removal.** `remove()` re-queries
 *     `[data-tw-file-upload-remove]` in a microtask and focuses the button that
 *     took the removed row's place. jsdom has no focus ring and no tab order;
 *     this asserts the actual `document.activeElement` in a live document.
 *
 * Fixture: the Reactive Forms example — `multiple`, no `accept` / `maxSize` /
 * `maxFiles` to trip over, and a `control.value = N files` readout, so removal
 * is asserted against the bound form value and not only against the DOM. The
 * uploaded files are repo files referenced by path, which keeps the spec free
 * of Node globals (`e2e/tsconfig.json` does not pull in `@types/node`).
 */
test.describe('File upload', () => {
  const EXAMPLES = '/components/file-upload/examples';
  const FILES = ['README.md', 'angular.json', 'package.json'];

  const section = (page: Page, heading: string): Locator =>
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: heading, level: 2 }) });

  const reactiveUpload = (page: Page): Locator =>
    section(page, 'Reactive Forms').locator('tw-file-upload');

  const removeButtons = (upload: Locator): Locator =>
    upload.locator('[data-tw-file-upload-remove]');

  async function queue(page: Page, files: string[]): Promise<Locator> {
    const upload = reactiveUpload(page);
    await upload.locator('input[type="file"]').setInputFiles(files);
    await expect(removeButtons(upload)).toHaveCount(files.length);
    return upload;
  }

  test('@interaction files chosen through the native input reach the bound control', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const upload = await queue(page, FILES);

    for (const name of FILES) {
      await expect(upload.getByText(name, { exact: true })).toBeVisible();
    }
    await expect(
      section(page, 'Reactive Forms').getByText('control.value = 3 files'),
    ).toBeVisible();
  });

  test('@interaction clicking the middle remove button removes that file, not another', async ({
    page,
  }) => {
    await page.goto(EXAMPLES);
    const upload = await queue(page, FILES);

    // The MIDDLE button: with one file every wrong id binding still removes the
    // only file there is, so a first-row click proves nothing.
    await upload.getByRole('button', { name: 'Remove angular.json' }).click();

    await expect(removeButtons(upload)).toHaveCount(2);
    await expect(upload.getByText('angular.json', { exact: true })).toHaveCount(0);
    await expect(upload.getByText('README.md', { exact: true })).toBeVisible();
    await expect(upload.getByText('package.json', { exact: true })).toBeVisible();
    await expect(
      section(page, 'Reactive Forms').getByText('control.value = 2 files'),
    ).toBeVisible();
  });

  // The two focus tests below are what discovered a real defect (fixed
  // 2026-09-02): `remove()` restored focus from a `queueMicrotask`, which in a
  // zoneless browser runs BEFORE Angular re-renders the list — so it focused the
  // button being destroyed and focus fell to `<body>`, and removing the last
  // file never reached the "focus the trigger" branch because the node count was
  // still stale. Now `afterNextRender`.
  //
  // They need a `dist/ngx-tw` built on or after that date: the demo resolves
  // `@cdevhub/ngx-tw/*` from `dist/`, so an older build still contains the
  // `queueMicrotask` version and these will fail against it. The unit-level
  // guards live in `file-upload.spec.ts` ("clicking a remove button retargets
  // focus…" / "removing the last file by click…") and run from source.
  test('@a11y removal retargets focus to the button that took its place', async ({ page }) => {
    await page.goto(EXAMPLES);
    const upload = await queue(page, FILES);

    await upload.getByRole('button', { name: 'Remove angular.json' }).click();

    // Index 1 of three removed → focus lands on whatever now sits at index 1,
    // i.e. the third file's button. Focus must never fall back to <body>.
    await expect(upload.getByRole('button', { name: 'Remove package.json' })).toBeFocused();
  });

  test('@a11y removing the last file returns focus to the trigger button', async ({ page }) => {
    await page.goto(EXAMPLES);
    const upload = await queue(page, ['README.md']);

    await upload.getByRole('button', { name: 'Remove README.md' }).click();

    await expect(removeButtons(upload)).toHaveCount(0);
    // The dropzone is not focusable; the trigger <button> is the keyboard control.
    await expect(upload.locator('button[twButton]').first()).toBeFocused();
  });
});
