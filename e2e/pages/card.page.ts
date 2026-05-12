import { expect, type Locator, type Page } from '@playwright/test';

export type CardSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Sections'
  | 'Media placement'
  | 'Body only'
  | 'Playground';

/**
 * Thin POM for the card examples route. Chapter 04 narrows E2E to the slot
 * directive contract: each `[twCardHeader|Body|Footer|Media]` decorates a
 * consumer-owned element; the card template is just `<ng-content />`.
 */
export class CardPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly sectionsSection: Locator;
  readonly bodyOnlySection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.sectionsSection = this.section('Sections');
    this.bodyOnlySection = this.section('Body only');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/card/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: CardSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
