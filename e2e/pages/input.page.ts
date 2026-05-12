import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside `input-examples.component.ts`.
 * Used to anchor section locators by accessible name — matches the convention
 * documented in chapter 02 §"Required source-side affordances".
 */
export type InputSectionName =
  | 'Standalone vs Form Field'
  | 'Input Types'
  | 'Prefix & Suffix'
  | 'Textarea'
  | 'Disabled & Read-only'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Custom Error-State Matcher'
  | 'Custom Value Accessor'
  | 'Playground';

/** Form-strategy section markers, mirrored in `<section data-section>` on each strategy. */
export type FormStrategy = 'td' | 'reactive' | 'signal';

/**
 * Page Object Model for the input component's examples route. Thin by
 * design: it exposes a `goto()`, one locator per `<section class="mb-10">`,
 * and small composite helpers for the three form-strategy sections that
 * the cross-cutting suite drives.
 *
 * Reference implementation for form-control POMs (checkbox, radio, switch,
 * select, slider, segmented-control, date-picker, date-range-picker,
 * time-picker). See `e2e/pages/README.md` and
 * `e2e/specs/02-cross-cutting/forms-three-strategies/README.md`.
 */
export class InputPage {
  readonly main: Locator;

  // One per `<section class="mb-10">` in the examples template.
  readonly standaloneSection: Locator;
  readonly typesSection: Locator;
  readonly prefixSuffixSection: Locator;
  readonly textareaSection: Locator;
  readonly disabledSection: Locator;
  readonly templateDrivenSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly matcherSection: Locator;
  readonly accessorSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');

    this.standaloneSection = this.section('Standalone vs Form Field');
    this.typesSection = this.section('Input Types');
    this.prefixSuffixSection = this.section('Prefix & Suffix');
    this.textareaSection = this.section('Textarea');
    this.disabledSection = this.section('Disabled & Read-only');
    this.templateDrivenSection = this.strategySection('td');
    this.reactiveSection = this.strategySection('reactive');
    this.signalSection = this.strategySection('signal');
    this.matcherSection = this.section('Custom Error-State Matcher');
    this.accessorSection = this.section('Custom Value Accessor');
    this.playgroundSection = this.section('Playground');
  }

  /** Navigate to the input examples route and wait for the H1 to mount. */
  async goto(): Promise<void> {
    await this.page.goto('/components/input/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /**
   * Section anchored by `[data-section]` — the Phase 0b prerequisite documented
   * in chapter 05 §5.1. Section anchoring by data-attribute is the contract
   * the cross-cutting three-strategy suite relies on; do not fall back to H2
   * text matching here because the heading copy is fluid (the demo may
   * eventually localise it).
   */
  strategySection(strategy: FormStrategy): Locator {
    return this.main.locator(`section[data-section="${strategy}"]`);
  }

  /**
   * The `<input twInput>` inside a given form-strategy section. Each section
   * renders exactly one bound input, so this is unambiguous.
   */
  inputIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('input[twInput], textarea[twInput]');
  }

  /**
   * The visible value/state readout rendered at the bottom of each
   * form-strategy section. Anchored by `data-testid="value-readout"` to
   * isolate it from any other text inside the section card.
   */
  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByTestId('value-readout');
  }

  /** Button inside a form-strategy section, located by exact label. */
  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  /** The `<input twInput>` rendered in the "Standalone vs Form Field" section's Standalone group. */
  standaloneTextInput(): Locator {
    return this.standaloneSection.locator('input[twInput]').first();
  }

  /** The `<textarea twInput>` rendered standalone (outside any form-field). */
  standaloneTextarea(): Locator {
    return this.standaloneSection.locator('textarea[twInput]').first();
  }

  /**
   * `<input twInput>` inside the Disabled & Read-only section, by accessible
   * label. The demo renders two: "Account ID" (readonly) and "Legacy slug"
   * (disabled) — match each via its label-bound id without coupling to copy.
   */
  disabledInputByLabel(label: 'Account ID' | 'Legacy slug'): Locator {
    return this.disabledSection.getByLabel(label);
  }

  /** Submit button inside the Custom Error-State Matcher section. */
  get matcherSubmitButton(): Locator {
    return this.matcherSection.getByRole('button', { name: 'Submit' });
  }

  /** Email control inside the Custom Error-State Matcher section. */
  get matcherEmailInput(): Locator {
    return this.matcherSection.getByLabel('Email');
  }

  /** Uppercase-value accessor input — the demo's `[uppercaseValue]` extension example. */
  get accessorInput(): Locator {
    return this.accessorSection.getByLabel('Product code');
  }

  /**
   * Anchor a `<section>` by its level-2 heading. Used for sections that
   * don't have a `data-section` marker (every section except the three
   * form-strategy ones — Phase 0b only marks those).
   *
   * Same DOM-level pattern as `dialog.page.ts` for resilience against
   * `aria-hidden` flips on `<main>` while overlays are open.
   */
  private section(name: InputSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
