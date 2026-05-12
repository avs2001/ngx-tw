import { expect, type Locator, type Page } from '@playwright/test';

export class PopoverPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly popovers: Locator;
  readonly topPopover: Locator;
  readonly backdrop: Locator;

  readonly positionsSection: Locator;
  readonly triggersSection: Locator;
  readonly sizesSection: Locator;
  readonly colorsSection: Locator;
  readonly richSection: Locator;
  readonly contextSection: Locator;
  readonly componentSection: Locator;
  readonly closeSection: Locator;
  readonly dismissalSection: Locator;
  readonly programmaticSection: Locator;
  readonly modelSection: Locator;
  readonly disabledSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.popovers = this.overlayContainer.locator('tw-popover-overlay');
    this.topPopover = this.popovers.last();
    this.backdrop = this.overlayContainer.locator('.cdk-overlay-backdrop');

    this.positionsSection = this.section('Positions');
    this.triggersSection = this.section('Triggers');
    this.sizesSection = this.section('Sizes');
    this.colorsSection = this.section('Color Accents');
    this.richSection = this.section('Rich Content Patterns');
    this.contextSection = this.section('Template Context');
    this.componentSection = this.section('Component Content');
    this.closeSection = this.section('Close Directive');
    this.dismissalSection = this.section('Dismissal Behavior');
    this.programmaticSection = this.section('Programmatic Control');
    this.modelSection = this.section('Two-way Open Binding');
    this.disabledSection = this.section('Disabled');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/popover/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async waitForOpen(): Promise<void> {
    await expect(this.topPopover).toBeVisible();
  }

  async waitForClosed(): Promise<void> {
    await expect(this.popovers).toHaveCount(0);
  }

  triggerInTriggers(label: 'click' | 'focus' | 'manual'): Locator {
    return this.triggersSection.getByRole('button', { name: label, exact: true });
  }

  get manualToggleButton(): Locator {
    return this.triggersSection.getByRole('button', { name: 'toggle', exact: true });
  }

  get inviteTeammateTrigger(): Locator {
    return this.contextSection.getByRole('button', { name: 'Invite teammate' });
  }

  get inviteComponentTrigger(): Locator {
    return this.componentSection.getByRole('button', { name: 'Invite via component' });
  }

  get closeDirectiveTrigger(): Locator {
    return this.closeSection.getByRole('button', { name: 'Delete 3 items' });
  }

  get programmaticTarget(): Locator {
    return this.programmaticSection.getByRole('button', { name: 'Target' });
  }

  programmaticControl(label: 'open()' | 'close()' | 'toggle()'): Locator {
    return this.programmaticSection.getByRole('button', { name: label, exact: true });
  }

  get modelTrigger(): Locator {
    return this.modelSection.getByRole('button', { name: 'Toggle popover' });
  }

  get modelExternalToggle(): Locator {
    return this.modelSection.getByRole('button', { name: 'Toggle externally' });
  }

  get modelStatus(): Locator {
    return this.modelSection.locator('span.font-mono');
  }

  get disabledTrigger(): Locator {
    return this.disabledSection.getByRole('button', { name: 'Disabled trigger' });
  }

  positionTrigger(pos: string): Locator {
    return this.positionsSection.getByRole('button', { name: pos, exact: true });
  }

  private section(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
