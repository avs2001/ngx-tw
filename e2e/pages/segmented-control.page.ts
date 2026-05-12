import { expect, type Locator, type Page } from '@playwright/test';

/** Section labels rendered as `<h2>` headings inside `segmented-control-examples.component.ts`. */
export type SegmentedControlSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Rounded'
  | 'Orientation'
  | 'With Icons'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_HEADINGS: Record<FormStrategy, SegmentedControlSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * POM for `segmented-control-examples.component.ts`.
 *
 * The component renders `role="radiogroup"` on the host with
 * `role="radio"` on each `<tw-segmented-option>`. Tests therefore
 * use radio-pattern locators.
 */
export class SegmentedControlPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly roundedSection: Locator;
  readonly orientationSection: Locator;
  readonly iconsSection: Locator;
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
    this.roundedSection = this.section('Rounded');
    this.orientationSection = this.section('Orientation');
    this.iconsSection = this.section('With Icons');
    this.statesSection = this.section('States');
    this.templateDrivenSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/segmented-control/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  strategySection(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_HEADINGS[strategy]);
  }

  groupIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByRole('radiogroup');
  }

  optionIn(strategy: FormStrategy, name: string | RegExp): Locator {
    return this.strategySection(strategy).getByRole('radio', { name });
  }

  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('p.font-mono').first();
  }

  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  private section(name: SegmentedControlSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
