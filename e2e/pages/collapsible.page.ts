import { expect, type Locator, type Page } from '@playwright/test';

export type CollapsibleSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'States'
  | 'Custom Icon'
  | 'Accordion Mode'
  | 'Independent Group'
  | 'keepAlive Mode'
  | 'Playground';

/**
 * Thin POM for the collapsible examples route. Chapter 04 narrows E2E to
 * the toggle behaviour, the absent-from-DOM contract when closed (default
 * `@if (open())`), and the `keepAlive` mode that preserves panel state.
 */
export class CollapsiblePage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly customIconSection: Locator;
  readonly keepAliveSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.customIconSection = this.section('Custom Icon');
    this.keepAliveSection = this.section('keepAlive Mode');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/collapsible/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: CollapsibleSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
