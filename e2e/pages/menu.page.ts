import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for the menu examples route. The menu component composes
 * CDK's `CdkMenu` / `CdkMenuTrigger`, so the rendered overlay surfaces
 * `role="menu"` containing items with `role="menuitem"` (or
 * `menuitemcheckbox` / `menuitemradio`).
 */
export class MenuPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly menus: Locator;
  readonly topMenu: Locator;

  readonly basicSection: Locator;
  readonly iconsSection: Locator;
  readonly descriptionsSection: Locator;
  readonly submenuSection: Locator;
  readonly checkRadioSection: Locator;
  readonly contextSection: Locator;
  readonly sizesSection: Locator;
  readonly colorsSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.menus = this.overlayContainer.locator('[role="menu"]');
    this.topMenu = this.menus.last();

    this.basicSection = this.section('Basic Menu');
    this.iconsSection = this.section('Icons & Shortcuts');
    this.descriptionsSection = this.section('Descriptions');
    this.submenuSection = this.section('Nested Submenus');
    this.checkRadioSection = this.section('Checkbox & Radio Items');
    this.contextSection = this.section('Context Menu');
    this.sizesSection = this.section('Sizes');
    this.colorsSection = this.section('Item Colors');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/menu/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async waitForOpen(): Promise<void> {
    await expect(this.topMenu).toBeVisible();
  }

  async waitForClosed(): Promise<void> {
    await expect(this.menus).toHaveCount(0);
  }

  get basicTrigger(): Locator {
    return this.basicSection.getByRole('button', { name: 'Project actions' });
  }

  get editTrigger(): Locator {
    return this.submenuSection.getByRole('button', { name: 'Edit', exact: true });
  }

  get viewOptionsTrigger(): Locator {
    return this.checkRadioSection.getByRole('button', { name: 'View options' });
  }

  get checkRadioStatus(): Locator {
    return this.checkRadioSection.locator('span.font-mono');
  }

  get contextZone(): Locator {
    return this.contextSection.locator('[twcontextmenutrigger], div.border-dashed').first();
  }

  private section(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
