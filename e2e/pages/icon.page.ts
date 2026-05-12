import { expect, type Locator, type Page } from '@playwright/test';

export type IconSectionName =
  | 'Colors'
  | 'Sizes'
  | 'Stroke Width'
  | 'Absolute Stroke Width'
  | 'Inline with Text'
  | 'Color Inheritance'
  | 'Accessibility'
  | 'Playground';

/**
 * Thin POM for the icon examples route. Icon is a presentational primitive
 * — chapter 04 narrows E2E coverage to the `ariaLabel` ↔ `aria-hidden` /
 * `role="img"` toggle that smoke + axe sweeps don't observe directly.
 */
export class IconPage {
  readonly main: Locator;

  readonly accessibilitySection: Locator;
  readonly colorInheritanceSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.accessibilitySection = this.section('Accessibility');
    this.colorInheritanceSection = this.section('Color Inheritance');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/icon/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: IconSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
