import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `time-picker-examples.component.ts`. Used to anchor section locators by
 * accessible name — matches the convention documented in chapter 02
 * §"Required source-side affordances".
 */
export type TimePickerSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Format & seconds'
  | 'Stepping intervals'
  | 'Min / max time'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

/** Form-strategy identifier used by the cross-cutting three-strategies suite. */
export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_TO_SECTION: Record<FormStrategy, TimePickerSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * Page Object Model for the time-picker examples route.
 *
 * The picker renders three (or four with seconds) `role="spinbutton"`
 * `<input>` fields wrapped in a `role="group"`. There is no overlay — every
 * interaction targets the inputs directly.
 */
export class TimePickerPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly formatSection: Locator;
  readonly stepsSection: Locator;
  readonly minMaxSection: Locator;
  readonly statesSection: Locator;
  readonly tdSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.formatSection = this.section('Format & seconds');
    this.stepsSection = this.section('Stepping intervals');
    this.minMaxSection = this.section('Min / max time');
    this.statesSection = this.section('States');
    this.tdSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/time-picker/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** The `<tw-time-picker>` element inside a given form-strategy section. */
  pickerIn(strategy: FormStrategy): Locator {
    return this.sectionFor(strategy).locator('tw-time-picker').first();
  }

  /** The `Hours` spinbutton inside a `<tw-time-picker>` reachable from `root`. */
  hoursField(root: Locator): Locator {
    return root.getByRole('spinbutton', { name: 'Hours' });
  }

  /** The `Minutes` spinbutton inside a `<tw-time-picker>` reachable from `root`. */
  minutesField(root: Locator): Locator {
    return root.getByRole('spinbutton', { name: 'Minutes' });
  }

  /** The `Seconds` spinbutton inside a `<tw-time-picker>` reachable from `root`. */
  secondsField(root: Locator): Locator {
    return root.getByRole('spinbutton', { name: 'Seconds' });
  }

  /** The meridiem (AM/PM) radio group — only rendered in 12h mode. */
  meridiemGroup(root: Locator): Locator {
    return root.getByRole('radiogroup', { name: 'AM or PM' });
  }

  /** Button labelled `AM` or `PM`. Only present in 12h mode. */
  meridiemButton(root: Locator, label: 'AM' | 'PM'): Locator {
    return this.meridiemGroup(root).getByRole('button', { name: label, exact: true });
  }

  /**
   * The visible value/state readout (`data-testid="output-{section}"`) shown
   * below the picker in each form-strategy section.
   */
  readoutIn(strategy: FormStrategy): Locator {
    return this.sectionFor(strategy).getByTestId(`output-${strategy}-forms`);
  }

  /** Button inside a strategy section, by exact label. */
  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.sectionFor(strategy).getByRole('button', { name: label, exact: true });
  }

  private sectionFor(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_TO_SECTION[strategy]);
  }

  private section(name: TimePickerSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
