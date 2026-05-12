import { expect, type Locator, type Page } from '@playwright/test';

export type ProgressBarSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'States'
  | 'Custom value formatter'
  | 'In context'
  | 'Playground';

/**
 * Thin POM for the progress-bar examples route. Chapter 04 narrows E2E to
 * the determinate ↔ indeterminate ARIA contract, segmented variant cell
 * fill progression, and `valueFormatter` mirroring into `aria-valuetext`.
 */
export class ProgressBarPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly statesSection: Locator;
  readonly formatterSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.statesSection = this.section('States');
    this.formatterSection = this.section('Custom value formatter');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/progress-bar/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: ProgressBarSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
