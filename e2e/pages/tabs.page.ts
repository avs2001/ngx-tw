import { expect, type Locator, type Page } from '@playwright/test';

export type TabsSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Vertical Orientation'
  | 'Fitted (Equal Width)'
  | 'Disabled Tab'
  | 'Closable Tabs'
  | 'Lazy Content'
  | 'Custom Triggers with Icons'
  | 'Playground';

/**
 * POM for the tabs component's examples route. The library renders the
 * tablist as `[role="tablist"]` with `[role="tab"]` triggers, panels as
 * `[role="tabpanel"]` with `aria-labelledby` pointing at the active tab.
 */
export class TabsPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly verticalSection: Locator;
  readonly fittedSection: Locator;
  readonly disabledSection: Locator;
  readonly closableSection: Locator;
  readonly lazySection: Locator;
  readonly customTriggerSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.verticalSection = this.section('Vertical Orientation');
    this.fittedSection = this.section('Fitted (Equal Width)');
    this.disabledSection = this.section('Disabled Tab');
    this.closableSection = this.section('Closable Tabs');
    this.lazySection = this.section('Lazy Content');
    this.customTriggerSection = this.section('Custom Triggers with Icons');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/tabs/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Find a tab trigger by its accessible name inside a section. */
  tab(section: Locator, name: string | RegExp): Locator {
    return section.getByRole('tab', { name });
  }

  /** The first tablist inside a section. */
  tablist(section: Locator): Locator {
    return section.getByRole('tablist').first();
  }

  private section(name: TabsSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
