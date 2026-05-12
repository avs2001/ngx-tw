import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside `select-examples.component.ts`.
 * Anchored by raw `h2` text per chapter 02's heading-anchored convention
 * (and per `e2e/pages/README.md` overlay-POM recipe: raw `h2` survives the
 * `aria-hidden` flip on `<main>` while the overlay is open).
 */
export type SelectSectionName =
  | 'Colors'
  | 'Sizes'
  | 'Searchable'
  | 'Multi-select'
  | 'Grouped options'
  | 'States'
  | 'Template-Driven Forms'
  | 'Reactive Forms'
  | 'Signal Forms'
  | 'Inside form-field (auto-naked)'
  | 'Custom option template'
  | 'Custom trigger'
  | 'Custom empty state & header'
  | 'Playground';

/** Form-strategy section markers wired via `data-section` on each `<section>`. */
export type FormStrategy = 'td' | 'reactive' | 'signal';

/**
 * Page Object Model for the select component's examples route. Same shape as
 * `dialog.page.ts` (overlay control) and `input.page.ts` (form control).
 * Exposes the overlay container, the listbox, named section anchors, and the
 * per-strategy section + readout shortcuts the three-strategy suite uses.
 */
export class SelectPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly backdrop: Locator;
  readonly listbox: Locator;
  readonly searchInput: Locator;

  // Sections — one per `<section class="mb-10">` in the examples template.
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly searchableSection: Locator;
  readonly multiSection: Locator;
  readonly groupedSection: Locator;
  readonly statesSection: Locator;
  readonly templateDrivenSection: Locator;
  readonly reactiveSection: Locator;
  readonly signalSection: Locator;
  readonly formFieldSection: Locator;
  readonly customOptionSection: Locator;
  readonly customTriggerSection: Locator;
  readonly customEmptySection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.backdrop = this.overlayContainer.locator('.cdk-overlay-backdrop');
    this.listbox = this.overlayContainer.locator('[role="listbox"]');
    this.searchInput = this.overlayContainer.locator('input[type="search"]');

    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.searchableSection = this.section('Searchable');
    this.multiSection = this.section('Multi-select');
    this.groupedSection = this.section('Grouped options');
    this.statesSection = this.section('States');
    this.templateDrivenSection = this.strategySection('td');
    this.reactiveSection = this.strategySection('reactive');
    this.signalSection = this.strategySection('signal');
    this.formFieldSection = this.section('Inside form-field (auto-naked)');
    this.customOptionSection = this.section('Custom option template');
    this.customTriggerSection = this.section('Custom trigger');
    this.customEmptySection = this.section('Custom empty state & header');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/select/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** The combobox trigger inside the given section, located by accessible name. */
  triggerIn(section: Locator, name: string | RegExp): Locator {
    return section.getByRole('combobox', { name });
  }

  /** Open the overlay listbox via the given trigger and wait for it to render. */
  async openVia(trigger: Locator): Promise<void> {
    await trigger.click();
    await this.waitForOpen();
  }

  async waitForOpen(): Promise<void> {
    await expect(this.listbox).toBeVisible();
  }

  async waitForClosed(): Promise<void> {
    await expect(this.listbox).toHaveCount(0);
  }

  /** Options rendered inside the listbox (post-filter), in DOM order. */
  options(): Locator {
    return this.listbox.locator('[role="option"]');
  }

  /** A specific option by its accessible text content. */
  optionByLabel(label: string | RegExp): Locator {
    return this.listbox.getByRole('option', { name: label });
  }

  /**
   * Section anchored by `[data-section]` — the three-strategy suite contract
   * (chapter 05 §5.1; `e2e/specs/02-cross-cutting/forms-three-strategies/README.md`).
   */
  strategySection(strategy: FormStrategy): Locator {
    return this.main.locator(`section[data-section="${strategy}"]`);
  }

  /**
   * Readout `<p>` mirroring the bound value for the given strategy. The demo
   * names them `output-td-forms` / `output-reactive-forms` / `output-signal-forms`
   * — a per-strategy alias keeps the rest of the spec consistent with the
   * `value-readout` convention used by other form-control POMs.
   */
  readoutIn(strategy: FormStrategy): Locator {
    return this.strategySection(strategy).getByTestId(`output-${strategy}-forms`);
  }

  /** Button inside a form-strategy section, located by exact label. */
  buttonIn(strategy: FormStrategy, label: string): Locator {
    return this.strategySection(strategy).getByRole('button', { name: label, exact: true });
  }

  /** Output `<p>` rendered next to the searchable / multi / playground selects. */
  outputByTestId(testId: string): Locator {
    return this.main.getByTestId(testId);
  }

  /**
   * Anchor a `<section>` by its level-2 heading. Raw `h2` + text (not
   * `getByRole`) survives the `aria-hidden` flip CDK puts on `<main>` while
   * the overlay is open, matching the dialog POM recipe.
   */
  private section(name: SelectSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
