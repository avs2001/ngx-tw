import { expect, type Locator, type Page } from '@playwright/test';
import { OVERLAY_SETTLE_TIMEOUT_MS } from '../support/timing';

/**
 * Section labels rendered as `<h2>` headings inside
 * `date-range-picker-examples.component.ts`.
 */
export type DateRangePickerSectionName =
  | 'Sizes'
  | 'Colors'
  | 'States'
  | 'Month layout'
  | 'Presets'
  | 'Min, max & filter'
  | 'With time'
  | 'Action bar'
  | 'Template-driven forms'
  | 'Reactive forms'
  | 'Signal forms'
  | 'Inside form-field (auto-naked)'
  | 'Playground';

export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_TO_SECTION: Record<FormStrategy, DateRangePickerSectionName> = {
  td: 'Template-driven forms',
  reactive: 'Reactive forms',
  signal: 'Signal forms',
};

/**
 * Page Object Model for the date-range-picker examples route.
 *
 * The trigger is a single `<button role="combobox" aria-haspopup="dialog">`
 * that renders three spans (start / separator / end) — NOT two text inputs.
 * Clicking opens a CDK overlay with `<tw-date-range-picker-overlay
 * role="dialog">` containing the calendar and (optionally) presets and a
 * dual time-picker row.
 */
export class DateRangePickerPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly overlayDialog: Locator;
  readonly overlayCalendar: Locator;

  readonly sizesSection: Locator;
  readonly statesSection: Locator;
  readonly monthLayoutSection: Locator;
  readonly presetsSection: Locator;
  readonly constraintsSection: Locator;
  readonly withTimeSection: Locator;
  readonly actionBarSection: Locator;
  readonly tdSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.overlayDialog = this.overlayContainer.locator('tw-date-range-picker-overlay');
    this.overlayCalendar = this.overlayDialog.locator('tw-calendar');

    this.sizesSection = this.section('Sizes');
    this.statesSection = this.section('States');
    this.monthLayoutSection = this.section('Month layout');
    this.presetsSection = this.section('Presets');
    this.constraintsSection = this.section('Min, max & filter');
    this.withTimeSection = this.section('With time');
    this.actionBarSection = this.section('Action bar');
    this.tdSection = this.section('Template-driven forms');
    this.reactiveSection = this.section('Reactive forms');
    this.signalSection = this.section('Signal forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/date-range-picker/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  pickerIn(section: Locator, nth = 0): Locator {
    return section.locator('tw-date-range-picker').nth(nth);
  }

  pickerForStrategy(strategy: FormStrategy): Locator {
    return this.pickerIn(this.section(STRATEGY_TO_SECTION[strategy]));
  }

  /** The combobox-role trigger button — the primary surface a user clicks. */
  trigger(picker: Locator): Locator {
    return picker.getByRole('combobox');
  }

  async waitForOpen(): Promise<void> {
    await expect(this.overlayDialog).toBeVisible({ timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  async waitForClosed(): Promise<void> {
    await expect(this.overlayDialog).toHaveCount(0, { timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  /** A specific day cell by its long-form aria-label (e.g. "June 15, 2025"). */
  dayCell(name: string | RegExp): Locator {
    return this.overlayCalendar.getByRole('button', { name });
  }

  /** All day buttons inside the overlay calendar grids. */
  get allDayCells(): Locator {
    return this.overlayCalendar.locator('[role="grid"] button');
  }

  /** Preset button by label inside the overlay preset list. */
  presetButton(label: string | RegExp): Locator {
    return this.overlayDialog
      .getByRole('listbox', { name: 'Preset ranges' })
      .getByRole('option', { name: label });
  }

  /** Overlay action bar button. */
  overlayAction(label: 'Today' | 'Clear' | 'Cancel' | 'Apply'): Locator {
    return this.overlayDialog.getByRole('button', { name: label, exact: true });
  }

  /** `data-testid` output panel under a section. */
  output(slug: string): Locator {
    return this.page.getByTestId(`output-${slug}`);
  }

  private section(name: DateRangePickerSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
