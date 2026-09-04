import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';

/** Filters accepted by `TooltipHarness.with`. */
export interface TooltipHarnessFilters extends BaseHarnessFilters {
  /** Match by the text rendered in the trigger. */
  triggerText?: string | RegExp;
}

/**
 * Harness for a `[twTooltip]` trigger and the panel it shows.
 *
 * Deliberately narrow: a tooltip's whole observable surface is *whether it is
 * showing and what it says*. Position, delays, color, size and arrow are
 * configuration, not state, and a harness method for any of them would freeze an
 * API that may still move — so none is offered.
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
 *
 * ## Waiting for the panel
 *
 * Every method stabilizes the fixture the way CDK harnesses always do, which
 * covers change detection but **not** the component's own timers: show and hide
 * are driven by plain `setTimeout`s behind `twTooltipShowDelay` (200 ms by
 * default) and `twTooltipHideDelay` (150 ms), which Angular's `PendingTasks`
 * does not track, so `whenStable()` does not wait for them — not even at a delay
 * of `0`. {@link show} and {@link hide} therefore dispatch the interaction and
 * return before anything has attached or detached. Set both delays to `0` in the
 * fixture, poll the DOM for the panel —
 * `document.querySelector('tw-tooltip-overlay')` — and only then read through
 * the harness.
 */
export class TooltipHarness extends ComponentHarness {
  static hostSelector = '[data-tw-tooltip-trigger]';

  /** Resolves the tooltip panel, which lives outside this harness's host. */
  private readonly panel =
    this.documentRootLocatorFactory().locatorForOptional('tw-tooltip-overlay');

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
    return (await (await this.host()).text()).trim();
  }

  /** Whether a tooltip panel is currently showing. */
  async isOpen(): Promise<boolean> {
    return (await this.panel()) !== null;
  }

  /**
   * The tooltip's message, trimmed, or `null` when nothing is showing. Works
   * for string and `TemplateRef` content alike.
   */
  async getTooltipText(): Promise<string | null> {
    const panel: TestElement | null = await this.panel();
    return panel ? (await panel.text()).trim() : null;
  }

  /** Hovers the trigger. The panel appears once `twTooltipShowDelay` elapses. */
  async show(): Promise<void> {
    await (await this.host()).hover();
  }

  /** Moves the pointer off the trigger. The panel detaches once `twTooltipHideDelay` elapses. */
  async hide(): Promise<void> {
    await (await this.host()).mouseAway();
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
    const host = await this.host();
    await host.focus();
    await host.dispatchEvent('focusin');
  }

  /** Blurs the trigger — the keyboard equivalent of {@link hide}. */
  async blurTrigger(): Promise<void> {
    const host = await this.host();
    await host.blur();
    await host.dispatchEvent('focusout');
  }
}
