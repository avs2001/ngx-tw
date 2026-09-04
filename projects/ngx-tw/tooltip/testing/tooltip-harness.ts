import { ComponentHarness, HarnessPredicate, manualChangeDetection } from '@angular/cdk/testing';
import type { BaseHarnessFilters, HarnessLoader, TestElement } from '@angular/cdk/testing';

/** Filters accepted by `TooltipHarness.with`. */
export interface TooltipHarnessFilters extends BaseHarnessFilters {
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
 * matters — `show()` returns while the panel is still behind
 * `twTooltipShowDelay`, and the following read's own yield is what picks the
 * rendered content up.
 */
function afterSchedulerTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

/**
 * Harness for a `[twTooltip]` trigger and the panel it shows.
 *
 * Deliberately narrow: a tooltip's whole observable surface is *whether it is
 * showing and what it says*. Position, delays, color, size and arrow are
 * configuration, not state, and a harness method for any of them would freeze an
 * API that may still move — so none is offered.
 *
 * ## Nothing here awaits application stabilization, and that is load-bearing
 *
 * `TestbedHarnessEnvironment` routes every `TestElement` operation through
 * `forceStabilize()` — `fixture.detectChanges()` then
 * `await fixture.whenStable()` — and that await resolves only when Angular's
 * `PendingTasks` set is empty. Under full-suite contention it was observed
 * **not to resolve at all**, and everything built on it hung for the whole test
 * budget instead of failing. This harness was withdrawn once for that, on five
 * green local runs followed by one red CI run.
 *
 * Every method body therefore runs inside CDK's `manualChangeDetection()`,
 * which sets the flag `forceStabilize()` early-returns on, and so does
 * acquisition, via {@link load} / {@link loadAll}. The spec beside this file
 * adds the third piece: it never awaits `fixture.whenStable()` either, not even
 * in `beforeEach`. All three were needed — each of the two CI failures during
 * this restoration was traced to one of them, and the second landed on
 * `popover` rather than here, which is how it became clear the fault belongs to
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
 * render, which is why {@link getTooltipText} does not come back empty on a
 * tooltip that has only just attached. What it does not cover is state behind
 * the component's own timers: {@link show} and {@link hide} dispatch the
 * interaction and return, and the panel appears or detaches only once
 * `twTooltipShowDelay` (200 ms by default) or `twTooltipHideDelay` (150 ms)
 * elapses. Set both to `0` in a fixture, poll the DOM for the panel —
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
 * The host selector is the directive's static `data-tw-tooltip-trigger` marker,
 * which matches both spellings of the input: `twTooltip="literal"` and the bound
 * `[twTooltip]="expr()"`, for which Angular renders no attribute at all. A
 * harness matching the directive's own selector would silently miss every bound
 * trigger.
 *
 * Unlike `MenuHarness` and `PopoverHarness`, a tooltip trigger carries no
 * `aria-controls` linking it to its panel (`aria-describedby` points at CDK
 * `AriaDescriber`'s shared hidden message element for string content), so the
 * panel is resolved as "the tooltip showing in the document". That is exact for
 * the hover/focus model, where only one tooltip is visible at a time, but a test
 * that forces two open at once cannot tell them apart.
 */
export class TooltipHarness extends ComponentHarness {
  static hostSelector = '[data-tw-tooltip-trigger]';

  /** Resolves the tooltip panel, which lives outside this harness's host. */
  private readonly panel =
    this.documentRootLocatorFactory().locatorForOptional('tw-tooltip-overlay');

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
   * Plain `loader.getHarness(TooltipHarness)` still works and is still supported.
   * This is the path to use when a suite must not be able to hang.
   */
  static load(loader: HarnessLoader, options: TooltipHarnessFilters = {}): Promise<TooltipHarness> {
    return manualChangeDetection(() => loader.getHarness(TooltipHarness.with(options)));
  }

  /** {@link load} for every matching trigger rather than the first. */
  static loadAll(
    loader: HarnessLoader,
    options: TooltipHarnessFilters = {},
  ): Promise<TooltipHarness[]> {
    return manualChangeDetection(() => loader.getAllHarnesses(TooltipHarness.with(options)));
  }

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: TooltipHarnessFilters = {}): HarnessPredicate<TooltipHarness> {
    return new HarnessPredicate(TooltipHarness, options).addOption(
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

  /** Whether a tooltip panel is currently showing. */
  async isOpen(): Promise<boolean> {
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      return (await this.panel()) !== null;
    });
  }

  /**
   * The tooltip's message, trimmed, or `null` when nothing is showing. Works
   * for string and `TemplateRef` content alike.
   */
  async getTooltipText(): Promise<string | null> {
    return manualChangeDetection(async () => {
      await afterSchedulerTick();
      const panel: TestElement | null = await this.panel();
      return panel ? (await panel.text()).trim() : null;
    });
  }

  /** Hovers the trigger. The panel appears once `twTooltipShowDelay` elapses. */
  async show(): Promise<void> {
    await manualChangeDetection(async () => {
      await (await this.host()).hover();
      await afterSchedulerTick();
    });
  }

  /** Moves the pointer off the trigger. The panel detaches once `twTooltipHideDelay` elapses. */
  async hide(): Promise<void> {
    await manualChangeDetection(async () => {
      await (await this.host()).mouseAway();
      await afterSchedulerTick();
    });
  }

  /**
   * Focuses the trigger — the keyboard equivalent of {@link show}, and the path
   * WCAG 2.1 SC 1.4.13 requires to work.
   *
   * Moves real DOM focus *and* dispatches `focusin`, because a programmatic
   * `focus()` does not reliably raise `focusin` in every test DOM. The directive
   * treats a repeated show as a no-op, so the belt-and-braces pair is safe.
   */
  async focusTrigger(): Promise<void> {
    await manualChangeDetection(async () => {
      const host = await this.host();
      await host.focus();
      await host.dispatchEvent('focusin');
      await afterSchedulerTick();
    });
  }

  /** Blurs the trigger — the keyboard equivalent of {@link hide}. */
  async blurTrigger(): Promise<void> {
    await manualChangeDetection(async () => {
      const host = await this.host();
      await host.blur();
      await host.dispatchEvent('focusout');
      await afterSchedulerTick();
    });
  }
}
