import { expect, type Locator, type Page } from '@playwright/test';

export type FlipCardSectionName =
  | 'Variants'
  | 'Direction'
  | 'Triggers'
  | 'Manual control'
  | 'Playground';

/**
 * Thin POM for the flip-card examples route. Chapter 04 narrows E2E to the
 * trigger matrix, manual two-way binding, and `role` switch
 * (`button` when interactive, `region` when manual).
 */
export class FlipCardPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly triggersSection: Locator;
  readonly manualSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.triggersSection = this.section('Triggers');
    this.manualSection = this.section('Manual control');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/flip-card/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Locate the flip-card whose front face contains the given trigger label. */
  triggerCard(label: 'click' | 'hover' | 'both' | 'manual'): Locator {
    return this.triggersSection.locator('tw-flip-card').filter({ hasText: label });
  }

  private section(name: FlipCardSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
