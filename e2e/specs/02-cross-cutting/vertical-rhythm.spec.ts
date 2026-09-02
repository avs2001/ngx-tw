import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * Vertical rhythm gate — enforces `docs/vertical-rhythm.md`.
 *
 * The rhythm grid at `/foundations/rhythm` renders every component on one ruled
 * ground and self-measures each slot's border-box height. This spec reads those
 * measurements back and holds the library to the two rules that matter:
 *
 *   1. The `form-row` cohort — controls with a bordered or filled shell that a
 *      consumer places side by side in a filter bar — must collapse to ONE
 *      height at every size. Any spread is the defect this system exists to
 *      prevent; the pre-migration baseline was 30px.
 *   2. Every one of those controls must land on the 4px baseline grid.
 *
 * The `selection` cohort (switch / checkbox / radio / slider) is deliberately
 * NOT held to rule 1 — those are glyph-scale by design, and box-matching them
 * would mean inflating a checkbox to the height of a text input.
 *
 * Content-driven components (card, alert, table, timeline) are in neither
 * cohort. Their heights are meaningful but not comparable to a control height,
 * so asserting a grid on them would encode noise as a requirement.
 *
 * Why read the DOM rather than screenshot: a height regression of 2px is
 * invisible to a visual diff at default thresholds but is exactly the class of
 * bug that produced the original misalignment.
 */

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const BASELINE_UNIT = 4;

interface Slot {
  readonly label: string;
  readonly height: number;
  readonly group: string;
}

test.describe('@rhythm vertical rhythm', () => {
  for (const size of SIZES) {
    test(`@rhythm form-row controls share one on-grid height at ${size}`, async ({ page }) => {
      await page.goto('/foundations/rhythm');
      await expect(page.locator('[data-rg-cell]').first()).toBeVisible();

      // Switch the whole page to this size, then let ResizeObserver settle.
      await page.getByRole('button', { name: size, exact: true }).click();
      await page.evaluate(
        () => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
      );

      const readSlots = async (): Promise<Slot[]> =>
        page.evaluate(() =>
          [...document.querySelectorAll('[data-rg-cell]')]
            .map(el => ({
              label: el.getAttribute('data-rg-cell') ?? '',
              height: Number(el.getAttribute('data-rg-height')),
              group: el.getAttribute('data-rg-group') ?? '',
            }))
            .filter(s => s.group === 'form-row' && s.height > 0),
        );

      // The measurement is observer-driven, so poll rather than assert once.
      await expect
        .poll(async () => (await readSlots()).length, { timeout: 10_000 })
        .toBeGreaterThan(5);

      const slots = await readSlots();

      // Rule 1 — one height for the whole cohort.
      const byHeight = new Map<number, string[]>();
      for (const s of slots) {
        byHeight.set(s.height, [...(byHeight.get(s.height) ?? []), s.label]);
      }
      const detail = [...byHeight.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([h, labels]) => `    ${h}px — ${labels.join(', ')}`)
        .join('\n');

      expect(
        byHeight.size,
        `form-row controls disagree on height at "${size}":\n${detail}`,
      ).toBe(1);

      // Rule 2 — that height is on the baseline grid.
      const height = slots[0].height;
      expect(
        Math.abs(height - Math.round(height / BASELINE_UNIT) * BASELINE_UNIT),
        `form-row height ${height}px at "${size}" is off the ${BASELINE_UNIT}px baseline`,
      ).toBeLessThan(0.5);
    });
  }

  test('@rhythm every component is accounted for — measured or explicitly n/a', async ({
    page,
  }) => {
    await page.goto('/foundations/rhythm');
    await expect(page.locator('[data-rg-cell]').first()).toBeVisible();
    await expect
      .poll(async () => page.locator('[data-rg-cell]').count(), { timeout: 10_000 })
      .toBeGreaterThan(50);

    // A slot with neither a measurement nor a stated n/a reason is a silent
    // hole in the audit: it looks like coverage and asserts nothing.
    const orphans = await page.evaluate(() =>
      [...document.querySelectorAll('[data-rg-cell]')]
        .filter(el => {
          const measured = Number(el.getAttribute('data-rg-height')) > 0;
          const skipped = el.querySelector('[title]')?.textContent?.trim() === 'n/a';
          return !measured && !skipped;
        })
        .map(el => el.getAttribute('data-rg-cell')),
    );

    expect(orphans, `slots that neither measured nor declared themselves n/a`).toEqual([]);
  });
});
