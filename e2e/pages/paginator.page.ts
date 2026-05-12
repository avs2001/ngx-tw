import { expect, type Locator, type Page } from '@playwright/test';

export type PaginatorSectionName =
  | 'Types'
  | 'Layouts'
  | 'Sizes'
  | 'Colors'
  | 'Ellipsis Range'
  | 'First & Last Buttons'
  | 'Page Size Selector'
  | 'Link Mode'
  | 'Responsive Collapse'
  | 'States'
  | 'Custom Labels (i18n)'
  | 'Custom Page-Info Template'
  | 'Custom Page-Size Selector'
  | 'Playground';

/**
 * POM for the paginator. Each `<tw-paginator>` renders a `<nav
 * role="navigation" aria-label="Pagination">` wrapping buttons tagged with
 * `data-tw-paginator-nav="first|prev|page|next|last"`. The aria-label
 * defaults to "Pagination" but the i18n example overrides it — selectors
 * accept that variation.
 */
export class PaginatorPage {
  readonly main: Locator;

  readonly typesSection: Locator;
  readonly layoutsSection: Locator;
  readonly sizesSection: Locator;
  readonly colorsSection: Locator;
  readonly rangeSection: Locator;
  readonly firstLastSection: Locator;
  readonly pageSizeSection: Locator;
  readonly linkSection: Locator;
  readonly responsiveSection: Locator;
  readonly statesSection: Locator;
  readonly labelsSection: Locator;
  readonly customInfoSection: Locator;
  readonly customSelectorSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.typesSection = this.section('Types');
    this.layoutsSection = this.section('Layouts');
    this.sizesSection = this.section('Sizes');
    this.colorsSection = this.section('Colors');
    this.rangeSection = this.section('Ellipsis Range');
    this.firstLastSection = this.section('First & Last Buttons');
    this.pageSizeSection = this.section('Page Size Selector');
    this.linkSection = this.section('Link Mode');
    this.responsiveSection = this.section('Responsive Collapse');
    this.statesSection = this.section('States');
    this.labelsSection = this.section('Custom Labels (i18n)');
    this.customInfoSection = this.section('Custom Page-Info Template');
    this.customSelectorSection = this.section('Custom Page-Size Selector');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/paginator/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** First `<tw-paginator>` inside a section. */
  paginator(section: Locator, index = 0): Locator {
    return section.locator('tw-paginator').nth(index);
  }

  /** Buttons or anchors marked with the paginator nav data-attribute. */
  nav(paginator: Locator, kind: 'first' | 'prev' | 'next' | 'last' | 'page'): Locator {
    return paginator.locator(`[data-tw-paginator-nav="${kind}"]`);
  }

  /** All page-number buttons/anchors in a paginator. */
  pageButtons(paginator: Locator): Locator {
    return paginator.locator('[data-tw-paginator-nav="page"]');
  }

  /** The currently-active page (aria-current="page"). */
  activePage(paginator: Locator): Locator {
    return paginator.locator('[data-tw-paginator-nav="page"][aria-current="page"]');
  }

  /** Ellipsis sentinels emitted between sibling/boundary page groups. */
  ellipses(paginator: Locator): Locator {
    return paginator.locator('[data-tw-paginator-ellipsis], li[aria-hidden="true"] >> nth=-1');
  }

  private section(name: PaginatorSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
