import { expect, type Locator, type Page } from '@playwright/test';

export type ToastSectionName =
  | 'Severities'
  | 'Positions'
  | 'Action Button'
  | 'promise()'
  | 'Pause on Interaction & Swipe'
  | 'Custom Content'
  | 'Stacking & maxVisible'
  | 'Lifecycle Observables'
  | 'Playground';

/**
 * Page Object Model for the toast examples route. Follows the overlay POM
 * recipe documented in `e2e/pages/README.md` (copy of `dialog.page.ts`).
 *
 * Toast lives inside the CDK overlay container; each position lazy-mounts
 * its own `<tw-toast-container>` (with `role="region"`) the first time it
 * is used. Individual toasts render as `<tw-toast>` elements inside.
 */
export class ToastPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly toasts: Locator;
  readonly topToast: Locator;

  readonly severitiesSection: Locator;
  readonly actionSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    this.toasts = this.overlayContainer.locator('tw-toast');
    this.topToast = this.toasts.last();

    this.severitiesSection = this.section('Severities');
    this.actionSection = this.section('Action Button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/components/toast/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /** Severities-section trigger button by name (`info`, `success`, `warning`, `error`, `neutral`). */
  severityTrigger(label: 'info' | 'success' | 'warning' | 'error' | 'neutral'): Locator {
    return this.severitiesSection.getByRole('button', { name: label, exact: true });
  }

  private section(name: ToastSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }
}
