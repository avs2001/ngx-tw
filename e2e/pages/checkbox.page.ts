import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside `checkbox-examples.component.ts`.
 * Used to anchor section locators by accessible name — matches the convention
 * documented in chapter 02 §"Required source-side affordances".
 */
export type CheckboxSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Indeterminate "Select all"'
  | 'With description'
  | 'Label position'
  | 'Custom check icon'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Playground';

/** Form-strategy section markers, mirrored on each strategy section by H2 anchor. */
export type FormStrategy = 'td' | 'reactive' | 'signal';

const STRATEGY_HEADINGS: Record<FormStrategy, CheckboxSectionName> = {
  td: 'Template-Driven Forms',
  reactive: 'Reactive Forms',
  signal: 'Signal Forms',
};

/**
 * Page Object Model for the checkbox component's examples route. Thin by
 * design — locators per section + composite helpers for the three
 * form-strategy sections. The checkbox examples page does NOT yet carry the
 * Phase 0b `data-section` / `value-readout` markers (chapter 05 §5.1), so
 * the form-strategy sections are anchored by their H2 heading and the
 * readouts by their `font-mono` literal text (`value = …`).
 */
export class CheckboxPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly indeterminateSection: Locator;
  readonly descriptionSection: Locator;
  readonly labelPositionSection: Locator;
  readonly customIconSection: Locator;
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
    this.indeterminateSection = this.section('Indeterminate "Select all"');
    this.descriptionSection = this.section('With description');
    this.labelPositionSection = this.section('Label position');
    this.customIconSection = this.section('Custom check icon');
    this.statesSection = this.section('States');
    this.templateDrivenSection = this.section('Template-Driven Forms');
    this.reactiveSection = this.section('Reactive Forms');
    this.signalSection = this.section('Signal Forms');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/checkbox/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Section anchored by its level-2 heading. */
  strategySection(strategy: FormStrategy): Locator {
    return this.section(STRATEGY_HEADINGS[strategy]);
  }

  /** Single `tw-checkbox` host (role=checkbox) inside a given form-strategy section. */
  checkboxIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByRole('checkbox');
  }

  /** The `value = …` mono-font readout rendered inside each strategy section. */
  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).locator('p.font-mono').first();
  }

  /** Button inside a form-strategy section, located by exact label. */
  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  /** The parent "Select all" checkbox in the indeterminate section. */
  get selectAllCheckbox(): Locator {
    return this.indeterminateSection.getByRole('checkbox', { name: /grant all permissions/i });
  }

  /** Child permission checkboxes (read/write/admin) under the parent. */
  permissionCheckbox(label: 'Read repository' | 'Write to repository' | 'Administer repository'): Locator {
    return this.indeterminateSection.getByRole('checkbox', { name: new RegExp(`^${label}$`, 'i') });
  }

  /** `all = … · some = …` summary inside the indeterminate section. */
  get indeterminateSummary(): Locator {
    return this.indeterminateSection.locator('p.font-mono').first();
  }

  private section(name: CheckboxSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
