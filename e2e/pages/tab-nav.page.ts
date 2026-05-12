import { expect, type Locator, type Page } from '@playwright/test';

export type TabNavSectionName =
  | 'Variants'
  | 'Colors'
  | 'Sizes'
  | 'Fitted (equal-width links)'
  | 'With Panel (ARIA tabs pattern)'
  | 'Disabled link'
  | 'Playground';

/**
 * POM for tab-nav. Two ARIA patterns coexist on the same demo route:
 *  - landmark/nav pattern (no `[tabPanel]`) — links carry `aria-current="page"`
 *  - tabs pattern (with `<tw-tab-nav-panel>`) — `<nav>` becomes `role="tablist"`,
 *    links become `role="tab"` with `aria-selected`.
 *
 * The demo wires no `routerLink` for any link (NEEDS-DEMO-CHANGE per
 * REVIEW.md) — every demo link uses `href="#"` plus `preventDefault()` and
 * a signal-driven `[active]`. URL-routing scenarios are blocked.
 */
export class TabNavPage {
  readonly main: Locator;

  readonly variantsSection: Locator;
  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly fittedSection: Locator;
  readonly panelSection: Locator;
  readonly disabledSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.variantsSection = this.section('Variants');
    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.fittedSection = this.section('Fitted (equal-width links)');
    this.panelSection = this.section('With Panel (ARIA tabs pattern)');
    this.disabledSection = this.section('Disabled link');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/tab-nav/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** All `[twTabLink]` anchors inside a section. */
  links(section: Locator): Locator {
    return section.locator('a[twtablink], nav a');
  }

  /** Link by visible name inside a section. */
  link(section: Locator, name: string | RegExp): Locator {
    return section.getByRole('link', { name }).or(section.getByRole('tab', { name })).first();
  }

  /** The `<tw-tab-nav-panel>` element inside the panel-pattern section. */
  get panel(): Locator {
    return this.panelSection.locator('tw-tab-nav-panel');
  }

  private section(name: TabNavSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
