import { expect, type Locator, type Page } from '@playwright/test';

export type FormFieldSectionName =
  | 'Variants'
  | 'Size'
  | 'Colors'
  | 'Floating Label'
  | 'Subscript Sizing'
  | 'States'
  | 'Prefix & Suffix'
  | 'Icon Adornments'
  | 'Hints'
  | 'Textarea'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

/**
 * Thin POM for the form-field examples route. Chapter 04 narrows E2E to
 * label/hint/error slot routing, the required indicator, and the
 * `aria-describedby` wiring that connects the input to hint + error ids.
 */
export class FormFieldPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly statesSection: Locator;
  readonly reactiveSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.statesSection = this.section('States');
    this.reactiveSection = this.section('Reactive Forms');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/form-field/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  private section(name: FormFieldSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
