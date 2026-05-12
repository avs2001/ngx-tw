import { expect, type Locator, type Page } from '@playwright/test';

export type AlertSectionName =
  | 'Variants'
  | 'Colors'
  | 'With Icon & Title'
  | 'With Actions'
  | 'Dismissible'
  | 'Politeness'
  | 'Playground';

/**
 * Thin POM for the alert examples route. Chapter 04 narrows E2E to the
 * dismissible flow + composition slots; the variants/colors matrix is
 * covered by smoke + axe sweeps.
 */
export class AlertPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly actionsSection: Locator;
  readonly dismissibleSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.actionsSection = this.section('With Actions');
    this.dismissibleSection = this.section('Dismissible');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/alert/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: AlertSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
