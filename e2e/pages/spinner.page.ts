import { expect, type Locator, type Page } from '@playwright/test';

export type SpinnerSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Track ring'
  | 'Inside buttons'
  | 'Inside form fields (async validation)'
  | 'Inline with text'
  | 'Centered loading region'
  | 'Overlay over existing content'
  | 'Playground';

/**
 * Thin POM for the spinner examples route. Chapter 04 keeps the spinner's
 * coverage narrow: `role="status"` live region + composition inside buttons
 * (`color="current"` inheritance). The variant matrix is left to smoke + axe.
 */
export class SpinnerPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly buttonsSection: Locator;
  readonly overlaySection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.buttonsSection = this.section('Inside buttons');
    this.overlaySection = this.section('Overlay over existing content');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/spinner/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: SpinnerSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
