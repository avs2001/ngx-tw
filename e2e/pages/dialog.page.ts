import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Section labels rendered as `<h2>` headings inside `dialog-examples.component.ts`.
 * Used to anchor section locators by accessible name — matches the convention
 * documented in chapter 02 §"Required source-side affordances".
 */
export type DialogSectionName =
  | 'Sizes'
  | 'Confirmation (alertdialog)'
  | 'Long scrollable content'
  | 'Component content'
  | 'Close guard'
  | 'Lifecycle events'
  | 'Stacked dialogs'
  | 'Playground';

/**
 * Sizes the demo Sizes section exposes. Mirrors `TwDialogSize` from
 * `ngx-tw/dialog` and matches the buttons rendered in the Sizes section.
 */
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

/**
 * Page Object Model for the dialog component's examples route. Thin by
 * design: it exposes a `goto()`, one locator per `<section class="mb-10">`,
 * and overlay-side accessors (`dialogs`, `topDialog`, `backdrop`). Anything
 * higher-level — e.g. "open size X then close via Esc" — belongs in the
 * spec, not the POM.
 *
 * Reference implementation for overlay POMs (select, menu, popover,
 * command-palette, tooltip, toast). See `e2e/pages/README.md`.
 */
export class DialogPage {
  readonly main: Locator;
  readonly overlayContainer: Locator;
  readonly backdrop: Locator;
  readonly dialogs: Locator;
  readonly topDialog: Locator;

  // Sections — one per `<section class="mb-10">` in the examples template.
  readonly sizesSection: Locator;
  readonly confirmationSection: Locator;
  readonly scrollSection: Locator;
  readonly componentSection: Locator;
  readonly guardSection: Locator;
  readonly lifecycleSection: Locator;
  readonly stackedSection: Locator;
  readonly playgroundSection: Locator;

  constructor(readonly page: Page) {
    this.main = page.locator('main');
    this.overlayContainer = page.locator('.cdk-overlay-container');
    // BUG (ngx-tw/dialog#backdrop-class): `dialog.ts` writes
    // `backdropClass: merged.backdropClass ?? 'tw-dialog-backdrop'`, but
    // CDK's `DialogConfig` initialises `backdropClass = ''`, not nullish —
    // the `??` therefore never fires and the library-specific class is
    // missing. We anchor on the generic CDK class instead. Update this
    // selector to `.tw-dialog-backdrop` once the source bug is fixed.
    this.backdrop = this.overlayContainer.locator('.cdk-overlay-backdrop');
    this.dialogs = this.overlayContainer.locator('tw-dialog-container');
    // Top of the dialog stack. CDK appends new dialogs to the overlay
    // container, so the last element is always the most recently opened.
    this.topDialog = this.dialogs.last();

    this.sizesSection = this.section('Sizes');
    this.confirmationSection = this.section('Confirmation (alertdialog)');
    this.scrollSection = this.section('Long scrollable content');
    this.componentSection = this.section('Component content');
    this.guardSection = this.section('Close guard');
    this.lifecycleSection = this.section('Lifecycle events');
    this.stackedSection = this.section('Stacked dialogs');
    this.playgroundSection = this.section('Playground');
  }

  /** Navigate to the dialog examples route and wait for the H1 to mount. */
  async goto(): Promise<void> {
    await this.page.goto('/components/dialog/examples');
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  /**
   * Wait for the top-most dialog to be present in the DOM and reach the
   * `data-state="open"` phase. The container starts at `opening` (initial
   * styles applied) and flips to `open` once `requestAnimationFrame` has
   * given the browser a chance to lay down the transition. Asserting on
   * `open` makes downstream interactions (Tab, click) reliable regardless
   * of animation timing.
   */
  async waitForOpen(): Promise<void> {
    await expect(this.topDialog).toBeVisible();
    await expect(this.topDialog).toHaveAttribute('data-state', 'open');
  }

  /** Wait until no dialog containers remain in the overlay tree. */
  async waitForClosed(): Promise<void> {
    await expect(this.dialogs).toHaveCount(0);
  }

  /**
   * Size-section trigger button. Matched by exact text inside the Sizes
   * section to avoid colliding with the Playground's identically labelled
   * size toggles (which live under a different `<h2>`).
   */
  sizeTrigger(size: DialogSize): Locator {
    return this.sizesSection.getByRole('button', { name: size, exact: true });
  }

  /** Confirmation-section trigger that opens the alertdialog. */
  get confirmationTrigger(): Locator {
    return this.confirmationSection.getByRole('button', { name: 'Delete repository' });
  }

  /** Visible result `<code>` rendered after the confirmation closes. */
  get confirmationResult(): Locator {
    return this.resultCode(this.confirmationSection);
  }

  /** Long-scrollable-content trigger. */
  get scrollTrigger(): Locator {
    return this.scrollSection.getByRole('button', { name: 'Open terms of service' });
  }

  /** Component-content trigger. */
  get componentTrigger(): Locator {
    return this.componentSection.getByRole('button', { name: 'Open teammate card' });
  }

  /** Close-guard trigger. */
  get guardTrigger(): Locator {
    return this.guardSection.getByRole('button', { name: 'Discard unsaved changes' });
  }

  /** Lifecycle-events trigger. */
  get lifecycleTrigger(): Locator {
    return this.lifecycleSection.getByRole('button', { name: 'Open import summary' });
  }

  /**
   * Visible `<code>` mirroring the `lifecycleLog` signal.
   *
   * The demo renders the label as `<span>Events: <code>…</code></span>`.
   * `span > code` isolates that pattern from the surrounding
   * `tw-code-block` snippets, which render `<pre><code>` instead — no
   * `<span>` parent, no collision.
   */
  get lifecycleLog(): Locator {
    return this.lifecycleSection.locator('span > code');
  }

  /** Visible `<code>` mirroring the `lastProfileResult` signal. */
  get componentResult(): Locator {
    return this.resultCode(this.componentSection);
  }

  /** Stacked-dialogs root trigger. */
  get stackedTrigger(): Locator {
    return this.stackedSection.getByRole('button', { name: 'Invite to project' });
  }

  /** Visible "Stack depth" counter inside the Stacked section. */
  get stackDepth(): Locator {
    return this.stackedSection.locator('span > code');
  }

  /** Playground trigger. */
  get playgroundTrigger(): Locator {
    return this.playgroundSection.getByRole('button', { name: 'Open dialog' });
  }

  /** Playground size selector (under the Size label). */
  playgroundSizeToggle(size: DialogSize): Locator {
    return this.playgroundSection.getByRole('button', { name: size, exact: true });
  }

  /** Playground feature toggles (`backdrop`, `disableClose`, `instant`). */
  playgroundFeatureToggle(label: 'backdrop' | 'disableClose' | 'instant'): Locator {
    return this.playgroundSection.getByRole('button', { name: label, exact: true });
  }

  /**
   * Anchor a `<section>` by its level-2 heading.
   *
   * We use a raw `h2` + text selector here rather than `getByRole`. When a
   * dialog opens, CDK sets `aria-hidden="true"` on the underlying page so
   * the modal owns the accessibility tree; that flips the section's `<h2>`
   * to inaccessible and `getByRole('heading', …)` returns zero inside the
   * filter — even though the heading is still in the DOM. Specs that read
   * the page body *while a dialog is open* (stack depth, lifecycle log)
   * need the section locator to survive that state. The DOM-level
   * `locator('h2')` does.
   *
   * The first-child invariant ("every `<section class="mb-10">` opens with
   * an `<h2>`") is documented in `02-architecture.md`.
   */
  private section(name: DialogSectionName): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.main.locator('section').filter({
      has: this.page.locator('h2').filter({ hasText: new RegExp(`^${escaped}$`) }),
    });
  }

  /**
   * The `<code>` element rendered next to a "Result:" label. Each demo
   * section that mirrors `afterClosed()` into UI state uses the pattern
   * `<span>Result: <code>{{ value }}</code></span>`. The `span > code`
   * direct-child selector isolates it from the surrounding
   * `tw-code-block` snippets, which render `<pre><code>` instead — no
   * `<span>` parent, no collision.
   */
  private resultCode(section: Locator): Locator {
    return section.locator('span > code');
  }
}
