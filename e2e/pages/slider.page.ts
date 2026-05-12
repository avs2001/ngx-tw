import { expect, type Locator, type Page } from '@playwright/test';

/** Section labels rendered as `<h2>` headings inside `slider-examples.component.ts`. */
export type SliderSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Range'
  | 'Step & Marks'
  | 'Value Formatters'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_HEADINGS: Record<FormStrategy, SliderSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * POM for `slider-examples.component.ts`.
 *
 * `tw-slider` renders the thumb itself as the focusable / role-bearing
 * element (`role="slider"` on a `<button>` inside the host). Helpers
 * therefore target the thumb directly via `getByRole('slider', …)`.
 */
export class SliderPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly rangeSection: Locator;
  readonly stepMarksSection: Locator;
  readonly formattersSection: Locator;
  readonly statesSection: Locator;
  readonly templateDrivenSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.rangeSection = this.section('Range');
    this.stepMarksSection = this.section('Step & Marks');
    this.formattersSection = this.section('Value Formatters');
    this.statesSection = this.section('States');
    this.templateDrivenSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/slider/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  strategySection(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_HEADINGS[strategy]);
  }

  /** The single thumb (`role="slider"`) inside a form-strategy section. */
  thumbIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByRole('slider');
  }

  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('p.font-mono').first();
  }

  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  private section(name: SliderSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
