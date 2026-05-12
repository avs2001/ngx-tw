import { expect, type Locator, type Page } from '@playwright/test';

export type TableSectionName =
  | 'Variants'
  | 'Density'
  | 'States'
  | 'Sticky Header & Columns'
  | 'Row Expansion'
  | 'Footer Row Totals'
  | 'Custom No-Data Row'
  | 'Custom Header Template'
  | 'Sortable Columns'
  | 'Responsive — Stack Below Breakpoint'
  | 'Admin Pattern — Toolbar, Sort & Pagination'
  | 'Playground';

/**
 * POM for the table component's examples route. Tables render real
 * `<table>`/`<thead>`/`<tbody>` with semantic markup; data rows are
 * `tbody > tr` and header cells are `thead > tr > th`.
 */
export class TablePage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly densitySection: Locator;
  readonly statesSection: Locator;
  readonly stickySection: Locator;
  readonly expansionSection: Locator;
  readonly footerSection: Locator;
  readonly noDataSection: Locator;
  readonly customHeaderSection: Locator;
  readonly sortableSection: Locator;
  readonly responsiveSection: Locator;
  readonly adminSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.densitySection = this.section('Density');
    this.statesSection = this.section('States');
    this.stickySection = this.section('Sticky Header & Columns');
    this.expansionSection = this.section('Row Expansion');
    this.footerSection = this.section('Footer Row Totals');
    this.noDataSection = this.section('Custom No-Data Row');
    this.customHeaderSection = this.section('Custom Header Template');
    this.sortableSection = this.section('Sortable Columns');
    this.responsiveSection = this.section('Responsive — Stack Below Breakpoint');
    this.adminSection = this.section('Admin Pattern — Toolbar, Sort & Pagination');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/table/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** First `<table>` inside a section. */
  table(section: Locator): Locator {
    return section.locator('table').first();
  }

  /** All data rows (tbody > tr) inside the section's table. */
  rows(section: Locator): Locator {
    return this.table(section).locator('tbody > tr');
  }

  private section(name: TableSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
