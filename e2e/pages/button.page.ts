import { expect, type Locator, type Page } from '@playwright/test';

export type ButtonSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'With Icons'
  | 'Anchor Elements'
  | 'States'
  | 'Playground';

/**
 * Thin POM for the button examples route. Chapter 04 narrows E2E to the
 * cross-cutting behaviours: anchor mode, loading state (aria-busy +
 * disabled equivalence), and the disabled enforcement difference between
 * `<button disabled>` and `<a aria-disabled="true">`.
 */
export class ButtonPage {
  readonly main: Locator;

  readonly anchorSection: Locator;
  readonly statesSection: Locator;
  readonly iconsSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.anchorSection = this.section('Anchor Elements');
    this.statesSection = this.section('States');
    this.iconsSection = this.section('With Icons');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/button/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: ButtonSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
