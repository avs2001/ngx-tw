import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  manualChangeDetection,
} from '@angular/cdk/testing';
import type { BaseHarnessFilters, HarnessLoader, TestElement } from '@angular/cdk/testing';

/** Filters accepted by `PopoverHarness.with`. */
export interface PopoverHarnessFilters extends BaseHarnessFilters {
  /** Match by the text rendered in the trigger. */
  triggerText?: string | RegExp;
}

/**
 * Lets the zoneless change-detection scheduler run its pending tick.
 *
 * `ApplicationRef` schedules a tick with `setTimeout(cb)` raced against
 * `requestAnimationFrame`. A timer registered *after* the notify that dirtied a
 * signal therefore fires *after* that tick, so one macrotask is enough to
 * observe everything already scheduled. It is a fixed, bounded yield, not a
 * stabilization await, so it cannot hang.
 *
 * Every method spends one: an action yields after dispatching, so the effects
 * the directive applied synchronously are rendered; a read yields before
 * looking, so it sees any tick that was already pending. The composition is what
 * matters — `open()` returns while the panel's first render is still pending,
 * and the following read's own yield is what picks the rendered content up.
 */
function afterSchedulerTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

/**
 * Harness for a `[twPopover]` trigger and the panel it opens.
 *
 * ## Nothing here awaits application stabilization, and that is load-bearing
 *
 * `TestbedHarnessEnvironment` routes every `TestElement` operation through
 * `forceStabilize()` — `fixture.detectChanges()` then
 * `await fixture.whenStable()` — and that await resolves only when Angular's
 * `PendingTasks` set is empty. Under full-suite contention it was observed
 * **not to resolve at all**, and everything built on it hung for the whole test
 * budget instead of failing. This harness was withdrawn twice for that.
 *
 * Every method body therefore runs inside CDK's `manualChangeDetection()`,
 * which sets the flag `forceStabilize()` early-returns on, and so does
 * acquisition, via {@link load} / {@link loadAll}. The spec beside this file
 * adds the third piece: it never awaits `fixture.whenStable()` either, not even
 * in `beforeEach`. All three were needed — each of the two CI failures during
 * this restoration was traced to one of them, and the second landed on
 * `tooltip` rather than here, which is how it became clear the fault belongs to
 * whichever harness spec lands in the unlucky worker slot rather than to any
 * one component. `grep -c whenStable` over this file and its spec returns zero,
 * which is the whole claim and is checkable in one command rather than by
 * counting green runs. The spec pins the rest with tests that hold a real
 * `PendingTasks` entry open across acquisition and every method.
 *
 * Why the application stops stabilizing is **not** known; this removes the
 * dependency rather than curing it.
 *
 * The cost is that change detection is not forced on your behalf. Instead every
 * method spends one macrotask on the scheduler (see {@link afterSchedulerTick}),
 * which covers everything already scheduled — including the panel's first
 * render. What it does not cover is state behind the component's own timers:
 * {@link close} dispatches Escape and returns, and the panel detaches only after
 * the 120 ms leave window in `popover.ts`. Wait for that by polling the DOM —
 * `document.querySelector` needs no stabilization and so can neither hang nor
 * burn a fixed interval — and only then read through the harness.
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
 * ## The panel is detached, not disposed
 *
 * Unlike `tw-select`, closing a popover **detaches** the portal and keeps the
 * `OverlayRef` for reuse; it is only rebuilt when `twPopoverBackdrop` or
 * `twPopoverScrollStrategy` changes. The panel element is therefore absent while
 * closed and present again after a reopen, on the same overlay.
 */
export class PopoverHarness extends ComponentHarness {
  static hostSelector = '[data-tw-popover-trigger]';

  /**
   * Acquires one harness without waiting for the application to stabilize —
   * the counterpart to the guarantee the methods below make.
   *
   * `loader.getHarness(...)` is CDK's own acquisition path and it stabilizes:
   * `getAllRawElements` calls `forceStabilize()`, and `HarnessPredicate`
   * filtering routes through `parallel()`, which asks *every* active fixture in
   * the worker to settle. Both await `fixture.whenStable()`, which is the one
   * thing this harness exists to avoid — and the failure that withdrew it was
   * observed there, at acquisition, before any method had run.
   *
   * So acquisition is wrapped too, and `manualChangeDetection()` nests: the
   * inner `parallel()` sees the flag already set and skips the stabilization
   * entirely. **Render the fixture first** (`fixture.detectChanges()`), because
   * nothing here will do it for you; an unrendered fixture fails loudly with
   * CDK's "failed to find element" rather than returning something wrong.
   *
   * Plain `loader.getHarness(PopoverHarness)` still works and is still supported.
   * This is the path to use when a suite must not be able to hang.
   */
  static load(loader: HarnessLoader, options: PopoverHarnessFilters = {}): Promise<PopoverHarness> {
    return manualChangeDetection(() => loader.getHarness(PopoverHarness.with(options)));
  }

  /** {@link load} for every matching trigger rather than the first. */
  static loadAll(
    loader: HarnessLoader,
    options: PopoverHarnessFilters = {},
  ): Promise<PopoverHarness[]> {
    return manualChangeDetection(() => loader.getAllHarnesses(PopoverHarness.with(options)));
  }

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
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      return (await (await this.host()).text()).trim();
    });
  }

  /** Whether the popover is open, read from the trigger's `aria-expanded`. */
  async isOpen(): Promise<boolean> {
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      return (await (await this.host()).getAttribute('aria-expanded')) === 'true';
    });
  }

  /**
   * Opens the popover by clicking the trigger. No-op when already open.
   *
   * This is the gesture for the default `twPopoverTriggerOn="click"`. A
   * `'focus'`- or `'manual'`-triggered popover is opened through the directive's
   * own `open()` (reachable via `exportAs: 'twPopover'`), not through a click.
   */
  async open(): Promise<void> {
    await manualChangeDetection(async () => {
      await afterSchedulerTick();
      const host = await this.host();
      if ((await host.getAttribute('aria-expanded')) === 'true') return;
      await host.click();
      await afterSchedulerTick();
    });
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
    await manualChangeDetection(async () => {
      await afterSchedulerTick();
      const host = await this.host();
      if ((await host.getAttribute('aria-expanded')) !== 'true') return;
      await host.sendKeys(TestKey.ESCAPE);
      await afterSchedulerTick();
    });
  }

  /**
   * Text rendered inside the panel, trimmed, or `null` when the popover is
   * closed and the panel is detached.
   */
  async getText(): Promise<string | null> {
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      const panel = await this.getPanel();
      return panel ? (await panel.text()).trim() : null;
    });
  }

  /**
   * Whether the panel renders its directional arrow (`twPopoverArrow`). `false`
   * while the popover is closed, because the panel does not exist then.
   */
  async hasArrow(): Promise<boolean> {
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      const id = await this.getPanelId();
      if (!id) return false;
      // The arrow has no dedicated attribute hook: it is the panel wrapper's only
      // `aria-hidden` grandchild span, with the content nested one level deeper.
      const arrow = await this.documentRootLocatorFactory().locatorForOptional(
        `#${id} > div > span[aria-hidden="true"]`,
      )();
      return arrow !== null;
    });
  }

  /**
   * The panel element, or `null` when the popover is closed. Callers are already
   * inside `manualChangeDetection`.
   */
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
