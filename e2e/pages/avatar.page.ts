import { expect, type Locator, type Page } from '@playwright/test';

export type AvatarSectionName =
  | 'Colors'
  | 'Sizes'
  | 'Rounded Shapes'
  | 'Status Indicators'
  | 'Fallback Cascade'
  | 'Custom Projected Content'
  | 'Avatar Group'
  | 'Playground';

/**
 * Thin POM for the avatar examples route. Chapter 04 narrows E2E to the
 * fallback cascade (image → initials → projected silhouette) and the
 * `tw-avatar-group [max]` overflow contract: hidden HTML attr + aria-hidden
 * on overflowed children (not display:none).
 */
export class AvatarPage {
  readonly main: Locator;

  readonly fallbackSection: Locator;
  readonly groupSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.fallbackSection = this.section('Fallback Cascade');
    this.groupSection = this.section('Avatar Group');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/avatar/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: AvatarSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
