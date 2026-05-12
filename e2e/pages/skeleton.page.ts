import { expect, type Locator, type Page } from '@playwright/test';

export type SkeletonSectionName =
  | 'Shapes'
  | 'Animations'
  | 'Multi-line text'
  | 'Custom dimensions'
  | 'Stand-alone announcement'
  | 'Card placeholder'
  | 'List placeholder with reload'
  | 'Playground';

/**
 * Thin POM for the skeleton examples route. Chapter 04 narrows E2E to the
 * `announce` aria flip (hidden ↔ `role="status"`) and multi-line text mode;
 * the variant/shape matrix is left to smoke + axe sweeps.
 */
export class SkeletonPage {
  readonly main: Locator;

  readonly shapesSection: Locator;
  readonly multiLineSection: Locator;
  readonly announceSection: Locator;
  readonly listSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.shapesSection = this.section('Shapes');
    this.multiLineSection = this.section('Multi-line text');
    this.announceSection = this.section('Stand-alone announcement');
    this.listSection = this.section('List placeholder with reload');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/skeleton/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: SkeletonSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
