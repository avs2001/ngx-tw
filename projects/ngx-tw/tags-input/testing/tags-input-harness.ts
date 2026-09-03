import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import {
  TagsInputTagHarness,
  type TagsInputTagHarnessFilters,
} from './tags-input-tag-harness';

/** Filters accepted by `TagsInputHarness.with`. */
export interface TagsInputHarnessFilters extends BaseHarnessFilters {
  /** Match by the control's accessible name (its `aria-label`). */
  label?: string | RegExp;
  /** Match disabled / enabled controls. */
  disabled?: boolean;
}

/**
 * Harness for `tw-tags-input`.
 *
 * The control renders committed tags as chips followed by a single text input;
 * everything lives inside the `tw-tags-input` host, so no overlay handling is
 * needed and the ordinary fixture loader is enough.
 *
 * Note where the ARIA lives: the host is a `role="group"`, which ARIA 1.2 does
 * not allow to carry `aria-required` / `aria-invalid`, so those sit on the
 * inner text input — the element that actually owns the pending value.
 * {@link isRequired} and {@link isInvalid} read them from there;
 * {@link isDisabled} reads `aria-disabled` from the group, which is allowed.
 */
export class TagsInputHarness extends ComponentHarness {
  static hostSelector = 'tw-tags-input';

  private readonly textInput = this.locatorFor('input[type="text"]');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: TagsInputHarnessFilters = {}): HarnessPredicate<TagsInputHarness> {
    return new HarnessPredicate(TagsInputHarness, options)
      .addOption('label', options.label, async (h, label) =>
        HarnessPredicate.stringMatches(await h.getLabel(), label),
      )
      .addOption(
        'disabled',
        options.disabled,
        async (h, disabled) => (await h.isDisabled()) === disabled,
      );
  }

  /** The control's accessible name, from `aria-label` when one is set. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Whether the group reports `aria-disabled="true"`. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-disabled')) === 'true';
  }

  /** Whether the text input reports `aria-required="true"`. */
  async isRequired(): Promise<boolean> {
    return (await (await this.textInput()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the text input reports `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.textInput()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Every committed chip, in render order. Remove by index by indexing this
   * array — `(await input.getTags())[1].remove()` — which is why no
   * `removeTagAt(index)` exists.
   */
  async getTags(
    filters: TagsInputTagHarnessFilters = {},
  ): Promise<TagsInputTagHarness[]> {
    return this.locatorForAll(TagsInputTagHarness.with(filters))();
  }

  /** The visible label of every committed chip, in render order. */
  async getTagTexts(): Promise<string[]> {
    const tags = await this.getTags();
    return Promise.all(tags.map((tag) => tag.getText()));
  }

  /** The in-progress (uncommitted) text currently in the input. */
  async getInputValue(): Promise<string> {
    return (await this.textInput()).getProperty<string>('value');
  }

  /**
   * Types `text` into the input and commits it with Enter. Typing appends, so
   * any pending text already in the input is committed along with it.
   *
   * Enter is the commit gesture only while `separatorKeys` contains `'Enter'`
   * (the default). A control configured with, say, `[separatorKeys]="[';']"`
   * commits through {@link typeInput} instead — `typeInput('alpha;')`.
   *
   * The commit may be dropped by the component (empty, duplicate, or `maxTags`
   * reached); assert against {@link getTagTexts} rather than assuming it
   * landed.
   */
  async addTag(text: string): Promise<void> {
    const input = await this.textInput();
    await input.sendKeys(text);
    await input.sendKeys(TestKey.ENTER);
  }

  /**
   * Types `text` into the input character by character, appending to whatever
   * is already there. Use it to stage pending text that {@link addTag} would
   * commit for you — reading it back, discarding it, or letting `addOnBlur`
   * pick it up.
   *
   * A separator character in `text` does commit the text before it, but CDK's
   * synthetic typing appends every character to the input regardless of the
   * component's `preventDefault()`, so the separator itself is left behind in
   * the input where a real browser swallows it. Commit with {@link addTag},
   * and treat a trailing separator here as staging, not as a commit gesture.
   */
  async typeInput(text: string): Promise<void> {
    await (await this.textInput()).sendKeys(text);
  }

  /**
   * Removes the first chip whose label matches. Throws when nothing matches,
   * rather than failing silently.
   */
  async removeTag(text: string | RegExp): Promise<void> {
    const matches = await this.getTags({ text });
    if (matches.length === 0) {
      throw new Error(`TagsInputHarness.removeTag: no tag matching ${String(text)}.`);
    }
    await matches[0].remove();
  }

  /**
   * Discards the in-progress text with Escape — the control's own clear
   * gesture. A no-op when the input is already empty. Does not touch committed
   * chips.
   */
  async clearInput(): Promise<void> {
    await (await this.textInput()).sendKeys(TestKey.ESCAPE);
  }

  /** Moves focus to the text input. */
  async focus(): Promise<void> {
    await (await this.textInput()).focus();
  }

  /**
   * Moves focus out of the control. This is the gesture that marks the control
   * touched and, with `addOnBlur`, commits the pending text.
   */
  async blur(): Promise<void> {
    await (await this.textInput()).blur();
  }
}
