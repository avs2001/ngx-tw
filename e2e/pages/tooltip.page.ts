import { expect, type Locator, type Page } from '@playwright/test';
import { OVERLAY_SETTLE_TIMEOUT_MS } from '../support/timing';

export type TooltipSize = 'sm' | 'md' | 'lg';
export type TooltipMainPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Page Object for the tooltip examples route. Tooltip overlays render via
 * CDK with `panelClass: 'tw-tooltip-panel'` and a host element with
 * `role="tooltip"`, which is what we anchor against.
 */
export class TooltipPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly tooltips: Locator;
  readonly topTooltip: Locator;

  readonly colorsSection: Locator;
  readonly sizesSection: Locator;
  readonly positionsSection: Locator;
  readonly arrowSection: Locator;
  readonly richSection: Locator;
  readonly programmaticSection: Locator;
  readonly statesSection: Locator;
  readonly delaysSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.tooltips = this.overlayContainer.locator('tw-tooltip-overlay');
    this.topTooltip = this.tooltips.last();

    this.colorsSection = this.section('Colors');
    this.sizesSection = this.section('Sizes');
    this.positionsSection = this.section('Positions');
    this.arrowSection = this.section('Arrow');
    this.richSection = this.section('Rich Content');
    this.programmaticSection = this.section('Programmatic Control');
    this.statesSection = this.section('States');
    this.delaysSection = this.section('Custom Delays');
    this.playgroundSection = this.section('Playground');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/tooltip/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async waitForOpen(): Promise<void> {
    await expect(this.topTooltip).toBeVisible({ timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  async waitForClosed(): Promise<void> {
    await expect(this.tooltips).toHaveCount(0, { timeout: OVERLAY_SETTLE_TIMEOUT_MS });
  }

  positionTrigger(pos: string): Locator {
    return this.positionsSection.getByRole('button', { name: pos, exact: true });
  }

  sizeTrigger(size: TooltipSize): Locator {
    return this.sizesSection.getByRole('button', { name: size, exact: true });
  }

  colorTrigger(color: string): Locator {
    return this.colorsSection.getByRole('button', { name: color, exact: true });
  }

  get programmaticTarget(): Locator {
    return this.programmaticSection.getByRole('button', { name: 'Target' });
  }

  programmaticControl(label: 'Show' | 'Hide' | 'Toggle'): Locator {
    return this.programmaticSection.getByRole('button', { name: label, exact: true });
  }

  get disabledTrigger(): Locator {
    return this.statesSection.getByRole('button', { name: 'Disabled tooltip' });
  }

  get enabledTrigger(): Locator {
    return this.statesSection.getByRole('button', { name: 'Enabled tooltip' });
  }

  get noArrowTrigger(): Locator {
    return this.arrowSection.getByRole('button', { name: 'No arrow' });
  }

  get withArrowTrigger(): Locator {
    return this.arrowSection.getByRole('button', { name: 'With arrow' });
  }

  get richContentTrigger(): Locator {
    return this.richSection.getByRole('button', { name: 'Save' });
  }

  private section(name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
