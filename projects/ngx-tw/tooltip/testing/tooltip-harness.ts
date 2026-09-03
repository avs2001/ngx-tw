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
 * ## Known limitation: only statically-declared triggers are matched
 *
 * `TooltipDirective` adds **no** host class or attribute — its host block is
 * event listeners only, and `aria-describedby` appears just while the tooltip is
 * showing. The sole marker is the directive's own attribute, and Angular renders
 * that attribute only for the static form:
 *
 * - `twTooltip="Saves your changes"` — attribute present, harness finds it.
 * - `[twTooltip]="message()"` — a property binding, so **no attribute is
 *   rendered** and this harness cannot locate the trigger. `getHarness` throws
 *   "failed to find element", which is at least loud rather than wrong.
 *
 * There is no workaround inside the harness; the fix is a host marker on the
 * directive (Material's `MatTooltip` adds `.mat-mdc-tooltip-trigger` for exactly
 * this reason). Widening this selector to such a marker later is a non-breaking
 * change. Until then, a fixture that needs a bound message can wrap the trigger
 * in an element its own test can find, or bind the message statically.
 *
 * ## Loading it
 *
 * The host is the trigger, which lives in the fixture, so the ordinary
 * `TestbedHarnessEnvironment.loader(fixture)` is correct. The panel renders into
 * the CDK overlay container outside the fixture, and this harness resolves it
 * internally via `documentRootLocatorFactory()` — a consumer never needs
 * `documentRootLoader`.
 *
 * Unlike `MenuHarness` and `PopoverHarness`, a tooltip trigger carries no
 * `aria-controls` linking it to its panel (`aria-describedby` points at CDK
 * `AriaDescriber`'s shared hidden message element for string content), so the
 * panel is resolved as "the tooltip showing in the document". That is exact for
 * the hover/focus model, where only one tooltip is visible at a time, but a test
 * that forces two open at once cannot tell them apart.
 *
 * ## Showing and hiding cost real time
 *
 * `show()` and `hide()` dispatch the interaction and return; the panel appears
 * after `twTooltipShowDelay` (200 ms by default) and detaches after
 * `twTooltipHideDelay` (150 ms). Set both to `0` in a fixture and still let a
 * macrotask elapse before asserting.
 */
export class TooltipHarness extends ComponentHarness {
  static hostSelector = '[twTooltip]';

  /** Resolves the tooltip panel, which lives outside this harness's host. */
  private readonly panel = this.documentRootLocatorFactory().locatorForOptional(
    'tw-tooltip-overlay',
  );

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
