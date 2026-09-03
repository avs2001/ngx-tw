import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `TagsInputTagHarness.with`. */
export interface TagsInputTagHarnessFilters extends BaseHarnessFilters {
  /** Match by the chip's visible label. */
  text?: string | RegExp;
}

/**
 * Harness for a single committed chip inside a `tw-tags-input`.
 *
 * Chips are rendered by composing `[twBadge]`, so that attribute is the host
 * selector. Reach these through {@link TagsInputHarness.getTags} rather than
 * locating them directly against a fixture — located from a document root the
 * selector would also match every unrelated badge on the page.
 */
export class TagsInputTagHarness extends ComponentHarness {
  static hostSelector = '[twBadge]';

  /**
   * The chip's remove control. It is the only `<button>` a chip contains: the
   * badge's own `dismissible` button is not enabled here, so this always
   * resolves to the tags-input remove control.
   */
  private readonly removeButton = this.locatorFor('button');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: TagsInputTagHarnessFilters = {},
  ): HarnessPredicate<TagsInputTagHarness> {
    return new HarnessPredicate(TagsInputTagHarness, options).addOption(
      'text',
      options.text,
      async (h, text) => HarnessPredicate.stringMatches(await h.getText(), text),
    );
  }

  /**
   * The chip's visible label, trimmed. This is `tagLabel(tag)`, not the tag
   * value — for object tags the two differ.
   */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /**
   * The remove control's accessible name (`Remove <label>`). Useful for
   * asserting the control is announced, which is the only signal a screen
   * reader gets for a chip.
   */
  async getRemoveLabel(): Promise<string | null> {
    return (await this.removeButton()).getAttribute('aria-label');
  }

  /**
   * Clicks the chip's remove control. The component restores focus to the
   * neighbouring chip (or the text input when none remain), so the caller may
   * assert focus immediately afterwards.
   */
  async remove(): Promise<void> {
    await (await this.removeButton()).click();
  }
}
