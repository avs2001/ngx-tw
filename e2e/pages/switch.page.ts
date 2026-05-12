import { expect, type Locator, type Page } from '@playwright/test';

/** Section labels rendered as `<h2>` headings inside `switch-examples.component.ts`. */
export type SwitchSectionName =
  | 'Colors'
  | 'Sizes'
  | 'With Icons'
  | 'With Description'
  | 'Label Position'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_HEADINGS: Record<FormStrategy, SwitchSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * POM for `switch-examples.component.ts`. Sections anchored by H2.
 */
export class SwitchPage {
  readonly main: Locator;

  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly iconsSection: Locator;
  readonly descriptionSection: Locator;
  readonly labelPositionSection: Locator;
  readonly statesSection: Locator;
  readonly templateDrivenSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.iconsSection = this.section('With Icons');
    this.descriptionSection = this.section('With Description');
    this.labelPositionSection = this.section('Label Position');
    this.statesSection = this.section('States');
    this.templateDrivenSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/switch/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  strategySection(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_HEADINGS[strategy]);
  }

  /** The single `tw-switch` (role=switch) inside a form-strategy section. */
  switchIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByRole('switch');
  }

  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('p.font-mono').first();
  }

  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  private section(name: SwitchSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
