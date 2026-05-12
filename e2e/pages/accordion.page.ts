import { expect, type Locator, type Page } from '@playwright/test';

export type AccordionSectionName =
  | 'Variants'
  | 'Modes'
  | 'States'
  | 'Initial value'
  | 'Playground';

/**
 * Thin POM for the accordion examples route. Chapter 04 narrows E2E to the
 * single/multi-expand toggle behaviour, keyboard navigation, and the
 * `[collapsible]="false"` invariant.
 */
export class AccordionPage {
  readonly main: Locator;

  readonly modesSection: Locator;
  readonly statesSection: Locator;
  readonly initialValueSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.modesSection = this.section('Modes');
    this.statesSection = this.section('States');
    this.initialValueSection = this.section('Initial value');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/accordion/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Get the `tw-accordion` containing a trigger with the given label. */
  accordionByTriggerLabel(label: string): Locator {
    return this.main.locator('tw-accordion').filter({
      has: this.page.getByRole('button', { name: label, exact: true }),
    });
  }

  private section(name: AccordionSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
