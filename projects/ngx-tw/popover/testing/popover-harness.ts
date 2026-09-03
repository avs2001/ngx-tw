import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';

/** Prefix of the id `PopoverDirective` puts on its overlay component. */
const PANEL_ID_PREFIX = 'tw-popover-';

/** Filters accepted by `PopoverHarness.with`. */
export interface PopoverHarnessFilters extends BaseHarnessFilters {
  /** Match by the text rendered in the trigger. */
  triggerText?: string | RegExp;
}

/**
 * Harness for a `[twPopover]` trigger and the panel it opens.
 *
 * ## Why the host selector is not `[twPopover]`
 *
 * `twPopover` takes a required `TemplateRef` or component type, so it is always
 * written as a property binding — `[twPopover]="content"` — and Angular renders
 * **no attribute** for a bound input. `[twPopover]` therefore matches nothing in
 * the DOM, and `PopoverDirective` adds no host class of its own (contrast
 * Material, whose trigger directives add one precisely so their harnesses can
 * find them). The only durable marker is `aria-haspopup="dialog"`.
 *
 * That marker is **not unique inside ngx-tw**: `tw-date-picker` and
 * `tw-date-range-picker` triggers carry it too. So this harness verifies what it
 * matched: `aria-controls` must name a `tw-popover-*` panel, and every method
 * except {@link getTriggerText} throws a named error when it does not, rather
 * than silently driving the wrong control. Both pickers bind `aria-controls`
 * unconditionally, so the check fires whether they are open or closed.
 *
 * {@link getTriggerText} is the one exception, and deliberately: it is what
 * `with({ triggerText })` calls while filtering, so it must be able to look at a
 * foreign control and report its text rather than throw. Narrow the query with
 * `PopoverHarness.with({ triggerText })` when a fixture holds both. If
 * `PopoverDirective` ever grows a host marker, tightening this selector to it is
 * a non-breaking change and this whole mechanism goes away.
 *
 * ## Loading it
 *
 * The host is the trigger, which lives in the fixture, so the ordinary
 * `TestbedHarnessEnvironment.loader(fixture)` is correct. The panel renders into
 * the CDK overlay container outside the fixture, and this harness resolves it
 * internally via `documentRootLocatorFactory()` — a consumer never needs
 * `documentRootLoader`.
 *
 * ## The panel is detached, not disposed
 *
 * Unlike `tw-select`, closing a popover **detaches** the portal and keeps the
 * `OverlayRef` for reuse; it is only rebuilt when `twPopoverBackdrop` or
 * `twPopoverScrollStrategy` changes. The panel element is therefore absent while
 * closed and present again after a reopen, on the same overlay.
 *
 * ## Closing costs real time
 *
 * The leave transition is a hard-coded 120 ms in `popover.ts` — not an input, so
 * a test cannot shorten it. {@link close} dispatches the key and returns; the
 * panel detaches once that timer elapses, so a test must let real time pass
 * before asserting the panel is gone.
 */
export class PopoverHarness extends ComponentHarness {
  static hostSelector = '[aria-haspopup="dialog"]';

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

  /**
   * Whether the popover is open, read from the trigger's `aria-expanded`.
   * Throws if the host turned out to be a foreign `aria-haspopup="dialog"`
   * control — see the class note.
   */
  async isOpen(): Promise<boolean> {
    await this.getPanelId();
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
    // `isOpen()` already refuses a foreign `aria-haspopup="dialog"` host, so a
    // mismatched trigger is never clicked.
    if (await this.isOpen()) return;
    await (await this.host()).click();
  }

  /**
   * Closes the popover by sending Escape to the trigger — the one dismissal
   * that works for click, focus and manual triggers alike. No-op when already
   * closed, and deliberately inert when `twPopoverCloseOnEscape` is `false`.
   *
   * The panel detaches after the 120 ms leave transition; see the class note.
   */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.host()).sendKeys(TestKey.ESCAPE);
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
   * `aria-controls` keeps sibling popovers apart, and the prefix check turns a
   * host-selector false positive into a named error instead of a wrong read.
   */
  private async getPanelId(): Promise<string | null> {
    const id = await (await this.host()).getAttribute('aria-controls');
    if (id === null) return null;
    if (!id.startsWith(PANEL_ID_PREFIX)) {
      throw new Error(
        `PopoverHarness: the matched trigger controls "${id}", which is not a tw-popover panel. ` +
          '`[twPopover]` renders no attribute of its own, so this harness matches `aria-haspopup="dialog"` — ' +
          'which tw-date-picker and tw-date-range-picker triggers also carry. ' +
          'Narrow the query, e.g. `PopoverHarness.with({ triggerText: … })`.',
      );
    }
    return id;
  }
}
