import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures/base';

test.describe.configure({ mode: 'parallel' });

/**
 * Row alignment gate — the companion to `vertical-rhythm.spec.ts`.
 *
 * That spec measures each control in its own slot and holds the `form-row`
 * cohort to one height. This one measures controls that SHARE A ROW, which is
 * a different question: every control can be individually correct and still
 * refuse to line up, because a flex row aligns one edge and the components
 * disagree about which box that edge belongs to.
 *
 * The instrument is `<app-rhythm-row>` on `/foundations/rhythm`. Each row
 * publishes five spreads as `data-rg-row-*` attributes, measured over two
 * boxes per item:
 *
 *   - **outer** — the element the consumer writes.
 *   - **control** — the visible shell. These differ for wrappers: a
 *     `tw-form-field` is much taller than its own shell because it reserves a
 *     label row above and a subscript row below.
 *
 * Which spread is load-bearing is decided by the row's `align-items`, not by
 * the components — so a non-zero top spread under `items-center` is correct
 * behaviour, not a defect, and is deliberately NOT asserted. The invariant
 * that holds in every mode is the control spread: controls that pin a height
 * must resolve to the same shell height wherever they are placed.
 *
 * Why this cannot be a screenshot: the failures here are 1–2px and land well
 * under any sane visual-diff threshold, while being exactly the drift that
 * makes a toolbar look unfinished.
 */

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/**
 * Rows whose members all pin a height, so every edge must agree.
 *
 * `edgeTolerance` is the allowance on the EDGE spreads only — the shell-height
 * spread is held to zero everywhere, without exception.
 *
 * The baseline row carries the one non-zero allowance in this file, and it is
 * a measured concession rather than a round number. Under `items-baseline` at
 * xs, sm and md, four of the five controls place their first text baseline
 * identically while the native `<input>` sits exactly 0.5px higher:
 *
 *     Button 0.5 · Input 0 · Select 0.5 · Combobox 0.5 · Segmented 0.5
 *
 * The cause is not the library's box model — every shell measures the same
 * 36px, and under `items-center` the same five controls agree on every edge to
 * the pixel. It is that a native text input derives its baseline from its own
 * internal text layout, while every other control is a flex container deriving
 * its baseline from a child. The two round differently at the fractional
 * ascents that 12px and 14px text produce; at 16px (lg/xl) they agree exactly
 * and this row measures a clean zero.
 *
 * Tolerating 0.5px is therefore not hiding a defect — forcing them to agree
 * would mean overriding the baseline of a native input, which trades an
 * invisible half-pixel for a real risk to the height agreement this suite
 * exists to protect. The allowance is set just above the measured value so a
 * genuine 1px regression still fails.
 */
const FULL_AGREEMENT_ROWS = [
  { label: 'Filter bar · centred', edgeTolerance: 0.5 },
  { label: 'Filter bar · baseline', edgeTolerance: 0.75 },
  // A floored control must still START on the scale. `tags-input` did not: its
  // resting height was computed against the bare input line box, but the
  // tallest resting content is a chip, so the floor went inert the moment a
  // single tag existed — 26/32/38/50/54 against a 24/32/36/44/48 scale. Empty
  // it measured correctly at every size, which is why an isolated slot reading
  // never caught it. This row is the regression gate for that.
  { label: 'Pinned next to floored', edgeTolerance: 0.5 },
  // The two ways to line a labelled field up with bare controls, both
  // measured. `items-start` works because the field's label floats INSIDE its
  // shell, so the shell is at the top of the wrapper and the reserved
  // subscript row hangs below; `subscriptSizing="dynamic"` collapses that row
  // so the wrapper becomes its shell and any align mode agrees. Gated so the
  // guidance in docs/vertical-rhythm.md §7.2 cannot drift from the components.
  { label: 'Labelled field next to a bare control · start', edgeTolerance: 0.5 },
  { label: 'Labelled field · subscriptSizing=dynamic · centred', edgeTolerance: 0.5 },
  { label: 'Inherited font · text-xs parent', edgeTolerance: 0.5 },
  { label: 'Inherited font · text-base parent', edgeTolerance: 0.5 },
] as const;

interface RowReading {
  readonly label: string;
  readonly align: string;
  readonly outer: number;
  readonly control: number;
  readonly top: number;
  readonly bottom: number;
  readonly centre: number;
  readonly items: readonly {
    readonly label: string;
    readonly control: number;
    readonly top: number;
    readonly bottom: number;
  }[];
}

async function readRows(page: Page): Promise<RowReading[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('app-rhythm-row')].map(el => ({
      label: el.getAttribute('data-rg-row') ?? '',
      align: el.getAttribute('data-rg-row-align') ?? '',
      outer: Number(el.getAttribute('data-rg-row-outer-spread')),
      control: Number(el.getAttribute('data-rg-row-control-spread')),
      top: Number(el.getAttribute('data-rg-row-top-spread')),
      bottom: Number(el.getAttribute('data-rg-row-bottom-spread')),
      centre: Number(el.getAttribute('data-rg-row-centre-spread')),
      items: [...el.querySelectorAll('[data-rg-item-row]')].map(t => ({
        label: t.getAttribute('data-rg-item-row') ?? '',
        control: Number(t.getAttribute('data-rg-item-control')),
        top: Number(t.getAttribute('data-rg-item-top')),
        bottom: Number(t.getAttribute('data-rg-item-bottom')),
      })),
    })),
  );
}

/** Applies a size to the whole page and waits for the observers to settle. */
async function applySize(page: Page, size: string): Promise<void> {
  await page.goto('/foundations/rhythm');
  await expect(page.locator('app-rhythm-row').first()).toBeVisible();
  await page
    .getByRole('group', { name: 'Component size' })
    .getByRole('button', { name: size, exact: true })
    .click();

  // The readings are ResizeObserver-driven, so they land a frame or two after
  // the click. Poll on the measurement itself rather than on a fixed wait.
  await expect
    .poll(async () => (await readRows(page)).filter(r => r.items.length > 0).length, {
      timeout: 10_000,
    })
    .toBeGreaterThanOrEqual(FULL_AGREEMENT_ROWS.length);
}

/**
 * Resolves a row by label or fails loudly.
 *
 * The lookup lives here rather than in the test body so the guard is not a
 * conditional inside a test — a missing row means the rhythm page changed and
 * the gate is measuring nothing, which must fail rather than silently skip.
 */
function requireRow(rows: readonly RowReading[], label: string): RowReading {
  const row = rows.find(r => r.label === label);
  if (!row) {
    throw new Error(
      `row "${label}" is missing from /foundations/rhythm — the gate cannot measure it`,
    );
  }
  return row;
}

interface VariantHeights {
  readonly label: string;
  readonly byName: ReadonlyMap<string, number>;
}

/**
 * Looks up a control's height in the reference row, or fails loudly.
 *
 * Every control in a font-parent row must have a counterpart in the reference
 * row. Skipping a missing one would let the strut comparison quietly measure
 * nothing — the exact failure mode this gate exists to prevent — so an absent
 * counterpart throws instead of being passed over.
 */
function counterpartOf(reference: VariantHeights, name: string): number {
  const expected = reference.byName.get(name);
  if (expected === undefined) {
    throw new Error(
      `"${name}" appears in a font-parent row but not in "${reference.label}" — ` +
        `the strut comparison would silently skip it`,
    );
  }
  return expected;
}

function detail(row: RowReading): string {
  const items = row.items
    .map(i => `      ${i.label}: h=${i.control} top=${i.top} bottom=${i.bottom}`)
    .join('\n');
  return (
    `    "${row.label}" [${row.align}]\n` +
    `      outer=${row.outer} control=${row.control} top=${row.top} ` +
    `bottom=${row.bottom} centre=${row.centre}\n${items}`
  );
}

test.describe('@rhythm @rowalign row alignment', () => {
  for (const size of SIZES) {
    test(`@rhythm @rowalign pinned controls agree on every edge when sharing a row at ${size}`, async ({
      page,
    }) => {
      await applySize(page, size);
      const rows = await readRows(page);

      for (const { label, edgeTolerance } of FULL_AGREEMENT_ROWS) {
        const row = requireRow(rows, label);

        // The shell height is the invariant that must hold in every mode, and
        // it takes no tolerance at any size.
        expect(
          row.control,
          `shell heights disagree at "${size}" in a shared row:\n${detail(row)}`,
        ).toBeLessThan(0.5);

        // These members all pin a height, so once the shells agree every edge
        // must agree too — regardless of which one align-items is honouring.
        for (const [edge, value] of [
          ['top', row.top],
          ['bottom', row.bottom],
          ['centre', row.centre],
        ] as const) {
          expect(
            value,
            `${edge} edges disagree by more than ${edgeTolerance}px at "${size}" in a ` +
              `shared row:\n${detail(row)}`,
          ).toBeLessThan(edgeTolerance);
        }
      }
    });

    test(`@rhythm @rowalign the consumer's inherited font cannot move a pinned control at ${size}`, async ({
      page,
    }) => {
      await applySize(page, size);
      const rows = await readRows(page);

      // The same four controls under three different inherited font sizes. A
      // pinned height is the component's own; if the parent's font can move it,
      // the control is still generating a line box somewhere in its shell.
      // This is the `select` 27px-at-xs bug class, which only a shared row with
      // a varied font strut can see.
      const variants = [
        'Filter bar · centred',
        'Inherited font · text-xs parent',
        'Inherited font · text-base parent',
      ];

      const heightsPerVariant = variants.map(label => {
        const row = requireRow(rows, label);
        const byName = new Map<string, number>();
        for (const item of row.items) {
          byName.set(item.label.replace(/ (xs|base)-parent$/, ''), item.control);
        }
        return { label, byName };
      });

      const [reference, ...others] = heightsPerVariant;

      for (const variant of others) {
        for (const [name, height] of variant.byName) {
          const expected = counterpartOf(reference, name);
          expect(
            Math.abs(height - expected),
            `"${name}" is ${height}px under ${variant.label} but ${expected}px under ` +
              `${reference.label} at size "${size}" — the consumer's font is moving a ` +
              `control whose height is supposed to be pinned`,
          ).toBeLessThan(0.5);
        }
      }
    });
  }

  test('@rhythm @rowalign a wrapper reports a different box than the control it wraps', async ({
    page,
  }) => {
    await applySize(page, 'md');
    const rows = await readRows(page);
    const row = requireRow(rows, 'Labelled field next to a bare control · centred');

    // Not a defect — a documented consequence. tw-form-field reserves a label
    // row and a subscript row, so its outer box is taller than its shell by
    // construction. This asserts the instrument still distinguishes the two
    // boxes: if outer and control ever collapse to the same number, the probe
    // has silently stopped resolving the shell and every reading above becomes
    // a measurement of the wrong element.
    expect(
      row.outer,
      `a form field wrapping a control should measure taller than the bare ` +
        `controls beside it:\n${detail(row)}`,
    ).toBeGreaterThan(0.5);

    // ...while the shells themselves still agree.
    expect(
      row.control,
      `the form field's shell should match the bare controls beside it:\n${detail(row)}`,
    ).toBeLessThan(0.5);
  });
});
