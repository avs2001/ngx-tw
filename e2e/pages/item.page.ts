import { expect, type Locator, type Page } from '@playwright/test';

export type ItemSectionName =
  | 'Sizes'
  | 'Alignment'
  | 'Interactive'
  | 'Table cell composition'
  | 'Rich content in slots'
  | 'Playground';

/**
 * Thin POM for the item examples route. Chapter 04 narrows E2E to the
 * interactive ↔ non-interactive contract, disabled emit suppression, and
 * slot directive composition.
 */
export class ItemPage {
  readonly main: Locator;

  readonly interactiveSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.interactiveSection = this.section('Interactive');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/item/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Last-selected `<code>` readout inside the Interactive section. */
  get lastSelectedReadout(): Locator {
    return this.interactiveSection.locator('p.font-mono').first();
  }

  private section(name: ItemSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
