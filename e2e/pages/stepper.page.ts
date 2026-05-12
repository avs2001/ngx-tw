import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside
 * `stepper-examples.component.ts`. Used to anchor section locators by
 * accessible name — matches the convention documented in chapter 02.
 */
export type StepperSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Vertical orientation'
  | 'Linear mode with reactive forms'
  | 'Error state'
  | 'Optional step'
  | 'Custom icons'
  | 'Custom labels'
  | 'Playground';

/**
 * Page Object Model for the stepper component's examples route. Thin by
 * design: a `goto()`, one locator per `<section class="mb-10">`, and small
 * helpers for step headers (the CDK `role="tab"` buttons exposed by the
 * stepper's tablist).
 */
export class StepperPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly verticalSection: Locator;
  readonly linearSection: Locator;
  readonly errorSection: Locator;
  readonly optionalSection: Locator;
  readonly iconsSection: Locator;
  readonly labelsSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.verticalSection = this.section('Vertical orientation');
    this.linearSection = this.section('Linear mode with reactive forms');
    this.errorSection = this.section('Error state');
    this.optionalSection = this.section('Optional step');
    this.iconsSection = this.section('Custom icons');
    this.labelsSection = this.section('Custom labels');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/stepper/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** All step header buttons (role="tab") inside the given section. */
  stepHeaders(section: Locator): Locator {
    return section.locator('button[role="tab"]');
  }

  /** Tablist (role="tablist") inside a section — `aria-orientation` reflects horizontal/vertical. */
  tablist(section: Locator): Locator {
    return section.locator('[role="tablist"]').first();
  }

  private section(name: StepperSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
