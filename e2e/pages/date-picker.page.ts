import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `date-picker-examples.component.ts`. Anchored by accessible name per the
 * chapter 02 §"Required source-side affordances" convention.
 */
export type DatePickerSectionName =
  | 'Sizes'
  | 'Colors'
  | 'States'
  | 'Min, max & filter'
  | 'With time'
  | 'Action bar'
  | 'Template-driven forms'
  | 'Reactive forms'
  | 'Signal forms'
  | 'Inside form-field (auto-naked)'
  | 'Playground';

/** Form-strategy identifier used by the cross-cutting three-strategies suite. */
export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_TO_SECTION: Record<FormStrategy, DatePickerSectionName> = {
  td: 'Template-driven forms',
  reactive: 'Reactive forms',
  signal: 'Signal forms',
};

/**
 * Page Object Model for the date-picker examples route.
 *
 * The picker renders a `<input role="combobox" aria-haspopup="dialog">` plus
 * a calendar-icon `<button>` trigger. Clicking the trigger opens a CDK
 * overlay containing a `<tw-date-picker-overlay role="dialog">` with a
 * `<tw-calendar>` inside. Calendar day cells render as `<button
 * role="gridcell">` (well — as `<button>` children of `role="gridcell"`
 * cells) inside `role="grid"`.
 */
export class DatePickerPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly overlayDialog: Locator;
  readonly overlayCalendar: Locator;

  readonly sizesSection: Locator;
  readonly colorsSection: Locator;
  readonly statesSection: Locator;
  readonly constraintsSection: Locator;
  readonly withTimeSection: Locator;
  readonly actionBarSection: Locator;
  readonly tdSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly formFieldSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.overlayDialog = this.overlayContainer.locator('tw-date-picker-overlay');
    this.overlayCalendar = this.overlayDialog.locator('tw-calendar');

    this.sizesSection = this.section('Sizes');
    this.colorsSection = this.section('Colors');
    this.statesSection = this.section('States');
    this.constraintsSection = this.section('Min, max & filter');
    this.withTimeSection = this.section('With time');
    this.actionBarSection = this.section('Action bar');
    this.tdSection = this.section('Template-driven forms');
    this.reactiveSection = this.section('Reactive forms');
    this.signalSection = this.section('Signal forms');
    this.formFieldSection = this.section('Inside form-field (auto-naked)');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/date-picker/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Returns the n-th `<tw-date-picker>` inside a section. */
  pickerIn(section: Locator, nth = 0): Locator {
    return section.locator('tw-date-picker').nth(nth);
  }

  /** The picker inside a given strategy section (one picker per strategy). */
  pickerForStrategy(strategy: FormStrategy): Locator {
    return this.pickerIn(this.section(STRATEGY_TO_SECTION[strategy]));
  }

  /** The `<input role="combobox">` element of a picker. */
  triggerInput(picker: Locator): Locator {
    return picker.getByRole('combobox');
  }

  /** The calendar-icon trigger button (`aria-label="Open calendar"` by default). */
  triggerButton(picker: Locator): Locator {
    return picker.getByRole('button', { name: 'Open calendar' });
  }

  /** Wait for the overlay to be present and visible. */
  async waitForOpen(): Promise<void> {
    await expect(this.overlayDialog).toBeVisible();
  }

  /** Wait for the overlay to detach. */
  async waitForClosed(): Promise<void> {
    await expect(this.overlayDialog).toHaveCount(0);
  }

  /** Calendar day cell by accessible name (e.g. "June 15, 2025"). */
  dayCell(name: string | RegExp): Locator {
    return this.overlayCalendar.getByRole('button', { name });
  }

  /** All day cells (buttons) inside the overlay calendar grid. */
  get allDayCells(): Locator {
    return this.overlayCalendar.locator('[role="grid"] button');
  }

  /** Action-bar Today / Clear / Cancel / Apply buttons inside the overlay. */
  overlayAction(label: 'Today' | 'Clear' | 'Cancel' | 'Apply'): Locator {
    return this.overlayDialog.getByRole('button', { name: label, exact: true });
  }

  /** `data-testid="output-{slug}"` element under a specific section. */
  output(slug: string): Locator {
    return this.page.getByTestId(`output-${slug}`);
  }

  private section(name: DatePickerSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
