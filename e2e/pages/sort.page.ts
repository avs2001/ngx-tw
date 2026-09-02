import { expect, type Locator, type Page } from '@playwright/test';

export type SortSectionName =
  | 'Colors'
  | 'Sizes'
  | 'Arrow Position'
  | 'Starting Direction'
  | 'Disable Clear (asc ⇄ desc)'
  | 'States'
  | 'Custom Arrow Icon'
  | 'Composing with a Table'
  | 'Composing with a List'
  | 'Sort Change Event'
  | 'Playground';

/**
 * POM for the sort directive's examples route. Sort headers render as
 * `<th tw-sort-header>` / `<span tw-sort-header>` / `<button tw-sort-header>`.
 *
 * `aria-sort` is emitted ONLY when the host is genuinely a header cell (a
 * `<th>`, or an element with `role="columnheader"`/`"rowheader"`). On a
 * `<span>` or `<button>` host the attribute is invalid ARIA and axe flags it,
 * so assert sort state from the owning `<th>` — or, on those hosts, from
 * `aria-describedby` and the rendered arrow rather than from `aria-sort`.
 *
 * The directive no longer imposes `role="button"` on a host that is already a
 * control; a `<button tw-sort-header>` keeps its own role and carries the
 * focus ring itself.
 */
export class SortPage {
  readonly main: Locator;

  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly arrowPositionSection: Locator;
  readonly startSection: Locator;
  readonly disableClearSection: Locator;
  readonly statesSection: Locator;
  readonly customIconSection: Locator;
  readonly tableSection: Locator;
  readonly listSection: Locator;
  readonly eventSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.arrowPositionSection = this.section('Arrow Position');
    this.startSection = this.section('Starting Direction');
    this.disableClearSection = this.section('Disable Clear (asc ⇄ desc)');
    this.statesSection = this.section('States');
    this.customIconSection = this.section('Custom Arrow Icon');
    this.tableSection = this.section('Composing with a Table');
    this.listSection = this.section('Composing with a List');
    this.eventSection = this.section('Sort Change Event');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/sort/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Sort header element matched by its `id` attribute inside a section. */
  header(section: Locator, id: string): Locator {
    return section.locator(`[tw-sort-header][id="${id}"]`);
  }

  /** All sort headers inside a section. */
  headers(section: Locator): Locator {
    return section.locator('[tw-sort-header]');
  }

  /**
   * The `<pre>` block inside the Sort Change Event section that mirrors the
   * last `TwSortEvent` as formatted JSON.
   */
  get eventLog(): Locator {
    return this.eventSection.locator('pre').first();
  }

  private section(name: SortSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
