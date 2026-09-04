import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';

/** Filters accepted by `PopoverHarness.with`. */
export interface PopoverHarnessFilters extends BaseHarnessFilters {
  /** Match by the text rendered in the trigger. */
  triggerText?: string | RegExp;
}

/**
 * Harness for a `[twPopover]` trigger and the panel it opens.
 *
 * ## Loading it
 *
 * The host is the trigger, which lives in the fixture, so the ordinary
 * `TestbedHarnessEnvironment.loader(fixture)` is correct. The panel renders into
 * the CDK overlay container outside the fixture, and this harness resolves it
 * internally via `documentRootLocatorFactory()` — a consumer never needs
 * `documentRootLoader`.
 *
 * The host selector is the directive's static `data-tw-popover-trigger` marker.
 * `[twPopover]` cannot be used: it takes a required `TemplateRef` or component
 * type, so it is always property-bound and Angular renders no attribute for a
 * bound input. The marker also makes the match exact, so no disambiguation
 * against `aria-haspopup="dialog"` — which the two date-picker triggers also
 * carry — is needed.
 *
 * ## Waiting for the panel
 *
 * Every method stabilizes the fixture the way CDK harnesses always do, which
 * covers change detection but **not** the component's own timers: `popover.ts`
 * detaches the panel behind a hard-coded 120 ms leave window driven by a plain
 * `setTimeout`, which Angular's `PendingTasks` does not track, so
 * `whenStable()` does not wait for it. {@link close} therefore dispatches
 * Escape and returns while the panel is still attached. Poll the DOM for its
 * removal — `document.querySelector('tw-popover-overlay')` — and only then read
 * through the harness.
 *
 * ## The panel is detached, not disposed
 *
 * Unlike `tw-select`, closing a popover **detaches** the portal and keeps the
 * `OverlayRef` for reuse; it is only rebuilt when `twPopoverBackdrop` or
 * `twPopoverScrollStrategy` changes. The panel element is therefore absent while
 * closed and present again after a reopen, on the same overlay.
 */
export class PopoverHarness extends ComponentHarness {
  static hostSelector = '[data-tw-popover-trigger]';

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: PopoverHarnessFilters = {}): HarnessPredicate<PopoverHarness> {
    return new HarnessPredicate(PopoverHarness, options).addOption(
      'triggerText',
      options.triggerText,
      async (h, text) => HarnessPredicate.stringMatches(await h.getTriggerText(), text),
    );
  }

  /** The text currently rendered in the trigger, trimmed. */
  async getTriggerText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the popover is open, read from the trigger's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
  }

  /**
   * Opens the popover by clicking the trigger. No-op when already open.
   *
   * This is the gesture for the default `twPopoverTriggerOn="click"`. A
   * `'focus'`- or `'manual'`-triggered popover is opened through the directive's
   * own `open()` (reachable via `exportAs: 'twPopover'`), not through a click.
   */
  async open(): Promise<void> {
    const host = await this.host();
    if ((await host.getAttribute('aria-expanded')) === 'true') return;
    await host.click();
  }

  /**
   * Closes the popover by sending Escape to the trigger — the one dismissal
   * that works for click, focus and manual triggers alike. No-op when already
   * closed, and deliberately inert when `twPopoverCloseOnEscape` is `false`.
   *
   * Returns as soon as the key is dispatched. The panel detaches only after the
   * 120 ms leave window; poll the DOM for its removal before asserting.
   */
  async close(): Promise<void> {
    const host = await this.host();
    if ((await host.getAttribute('aria-expanded')) !== 'true') return;
    await host.sendKeys(TestKey.ESCAPE);
  }

  /**
   * Text rendered inside the panel, trimmed, or `null` when the popover is
   * closed and the panel is detached.
   */
  async getText(): Promise<string | null> {
    const panel = await this.getPanel();
    return panel ? (await panel.text()).trim() : null;
  }

  /**
   * Whether the panel renders its directional arrow (`twPopoverArrow`). `false`
   * while the popover is closed, because the panel does not exist then.
   */
  async hasArrow(): Promise<boolean> {
    const id = await this.getPanelId();
    if (!id) return false;
    // The arrow has no dedicated attribute hook: it is the panel wrapper's only
    // `aria-hidden` grandchild span, with the content nested one level deeper.
    const arrow = await this.documentRootLocatorFactory().locatorForOptional(
      `#${id} > div > span[aria-hidden="true"]`,
    )();
    return arrow !== null;
  }

  /** The panel element, or `null` when the popover is closed. */
  private async getPanel(): Promise<TestElement | null> {
    const id = await this.getPanelId();
    if (!id) return null;
    return this.documentRootLocatorFactory().locatorForOptional(`#${id}`)();
  }

  /**
   * The id of this trigger's own panel, or `null` when closed. Scoping by
   * `aria-controls` keeps sibling popovers apart.
   */
  private async getPanelId(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-controls');
  }
}
