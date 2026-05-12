import { expect, type Locator, type Page } from '@playwright/test';

export type BadgeSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'With Icons'
  | 'With Avatars'
  | 'Pill Shape'
  | 'Dot Indicator'
  | 'Dismissible'
  | 'Playground';

/**
 * Thin POM for the badge examples route. The variant/color/size matrix is
 * covered by smoke + axe sweeps. Chapter 04 narrows E2E to the Dismissible
 * flow (output emission + DOM update via parent state) and the leading slot
 * detection that reserves space for projected icons/avatars.
 */
export class BadgePage {
  readonly main: Locator;

  readonly dismissibleSection: Locator;
  readonly iconsSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.dismissibleSection = this.section('Dismissible');
    this.iconsSection = this.section('With Icons');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/badge/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: BadgeSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
