import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside `radio-examples.component.ts`.
 */
export type RadioSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Orientation'
  | 'With Description'
  | 'Label Position'
  | 'Per-Radio Overrides'
  | 'Custom Dot Glyph'
  | 'States'
  | 'Standalone Radio'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_HEADINGS: Record<FormStrategy, RadioSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * POM for `radio-examples.component.ts`. Sections anchored by H2; the
 * page does not carry the Phase 0b `data-section` markers yet, so the
 * three form-strategy sections use heading anchoring too.
 */
export class RadioPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly orientationSection: Locator;
  readonly descriptionSection: Locator;
  readonly labelPositionSection: Locator;
  readonly overridesSection: Locator;
  readonly customDotSection: Locator;
  readonly statesSection: Locator;
  readonly standaloneSection: Locator;
  readonly templateDrivenSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.orientationSection = this.section('Orientation');
    this.descriptionSection = this.section('With Description');
    this.labelPositionSection = this.section('Label Position');
    this.overridesSection = this.section('Per-Radio Overrides');
    this.customDotSection = this.section('Custom Dot Glyph');
    this.statesSection = this.section('States');
    this.standaloneSection = this.section('Standalone Radio');
    this.templateDrivenSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/radio/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  strategySection(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_HEADINGS[strategy]);
  }

  /** The (single) `tw-radio-group` inside a given form-strategy section. */
  groupIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByRole('radiogroup');
  }

  /** A radio option by its accessible name inside a form-strategy section. */
  radioIn(strategy: FormStrategy, name: string | RegExp): Locator {
    return this.strategySection(strategy).getByRole('radio', { name });
  }

  /** `value = …` mono-font readout inside a strategy section. */
  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('p.font-mono').first();
  }

  /** Button inside a strategy section, located by exact label. */
  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  private section(name: RadioSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
