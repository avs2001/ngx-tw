import { expect, type Locator, type Page } from '@playwright/test';
import { OVERLAY_SETTLE_TIMEOUT_MS } from '../support/timing';

/**
 * Page Object for the command-palette examples route. The overlay renders
 * `<tw-command-palette-overlay>` with `role="dialog"` and a search
 * `role="combobox"` paired with a `role="listbox"` of options.
 */
export class CommandPalettePage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly overlays: Locator;
  readonly topOverlay: Locator;
  readonly backdrop: Locator;

  readonly sizesSection: Locator;
  readonly groupsSection: Locator;
  readonly fuzzySection: Locator;
  readonly hotkeySection: Locator;
  readonly statesSection: Locator;
  readonly templatesSection: Locator;
  readonly programmaticSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.overlays = this.overlayContainer.locator('tw-command-palette-overlay');
    this.topOverlay = this.overlays.last();
    this.backdrop = this.overlayContainer.locator('.cdk-overlay-backdrop');

    this.sizesSection = this.section('Sizes');
    this.groupsSection = this.section('Groups & Shortcuts');
    this.fuzzySection = this.section('Data-driven with a custom filter');
    this.hotkeySection = this.section('Global hotkey (⌘K / Ctrl+K)');
    this.statesSection = this.section('States');
    this.templatesSection = this.section('Custom empty state & footer');
    this.programmaticSection = this.section('Programmatic control');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/command-palette/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async waitForOpen(): Promise<void> {
    await expect(this.topOverlay).toBeVisible({ timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  async waitForClosed(): Promise<void> {
    await expect(this.overlays).toHaveCount(0, { timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  /** The search input rendered inside the open overlay. */
  get searchInput(): Locator {
    return this.topOverlay.getByRole('combobox');
  }

  get listbox(): Locator {
    return this.topOverlay.getByRole('listbox');
  }

  options(): Locator {
    return this.listbox.getByRole('option');
  }

  optionByLabel(label: string | RegExp): Locator {
    return this.listbox.locator('[role="option"]').filter({ hasText: label });
  }

  groupTriggerInGroups(): Locator {
    return this.groupsSection.getByRole('button', { name: 'Open grouped palette' });
  }

  fuzzyOpenTrigger(): Locator {
    return this.fuzzySection.getByRole('button', { name: 'Open fuzzy palette' });
  }

  disabledItemTrigger(): Locator {
    // The States section renders two stacked subsections, each opening with
    // a `<p>` label. Anchor the trigger via the immediate parent div that
    // also contains the matching label.
    return this.statesSection
      .locator('div')
      .filter({ has: this.page.getByText('Disabled item', { exact: true }) })
      .last()
      .getByRole('button', { name: 'Open palette' });
  }

  stayOpenTrigger(): Locator {
    return this.statesSection
      .locator('div')
      .filter({ has: this.page.getByText('Stay open after select', { exact: true }) })
      .last()
      .getByRole('button', { name: 'Open palette' });
  }

  stayLastLabel(): Locator {
    return this.statesSection.getByText(/Last selected:/);
  }

  templatesTrigger(): Locator {
    return this.templatesSection.getByRole('button', { name: 'Open palette' });
  }

  programmaticControl(label: 'show()' | 'hide()' | 'toggle()'): Locator {
    return this.programmaticSection.getByRole('button', { name: label, exact: true });
  }

  hotkeyLastLabel(): Locator {
    return this.hotkeySection.getByText(/Last activated:/);
  }

  private section(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
