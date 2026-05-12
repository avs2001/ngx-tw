import { expect, type Locator, type Page } from '@playwright/test';

export type SeparatorSectionName =
  | 'Variants'
  | 'Colors'
  | 'Weights'
  | 'Orientation'
  | 'With Labels'
  | 'Decorative'
  | 'Playground';

/**
 * Thin POM for the separator examples route. Separator is a purely
 * presentational primitive; the chapter 04 scenarios focus on orientation
 * + decorative ARIA semantics and the label projection rule, not on the
 * full variant/weight/color matrix (smoke + axe already cover that).
 */
export class SeparatorPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly orientationSection: Locator;
  readonly labelsSection: Locator;
  readonly decorativeSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.orientationSection = this.section('Orientation');
    this.labelsSection = this.section('With Labels');
    this.decorativeSection = this.section('Decorative');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/separator/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Playground toggle button (matched by exact label). */
  playgroundButton(label: string): Locator {
    return this.playgroundSection.getByRole('button', { name: label, exact: true });
  }

  /** The single `tw-separator` rendered in the playground preview. */
  get playgroundSeparator(): Locator {
    return this.playgroundSection.locator('tw-separator');
  }

  private section(name: SeparatorSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
