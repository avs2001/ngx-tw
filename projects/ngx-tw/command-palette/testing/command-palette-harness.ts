import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import {
  CommandPaletteItemHarness,
  type CommandPaletteItemHarnessFilters,
} from './command-palette-item-harness';

/** Filters accepted by `CommandPaletteHarness.with`. */
export interface CommandPaletteHarnessFilters extends BaseHarnessFilters {
  /** Match by the palette's accessible label. */
  label?: string | RegExp;
}

/**
 * Harness for `tw-command-palette`.
 *
 * The palette renders into the CDK overlay container, outside the
 * `tw-command-palette` host, so this harness resolves the panel through
 * `documentRootLocatorFactory()`. A consumer loads it from the ordinary fixture
 * loader and still reaches the results.
 *
 * The palette is an **activedescendant listbox**: DOM focus stays on the search
 * input and the active row is identified only by `aria-activedescendant`. Every
 * "active" method here resolves that id reference — none of them consults
 * `document.activeElement`, which would always report the input.
 */
export class CommandPaletteHarness extends ComponentHarness {
  static hostSelector = 'tw-command-palette';

  private readonly panel =
    this.documentRootLocatorFactory().locatorForOptional('[role="dialog"]');
  private readonly input =
    this.documentRootLocatorFactory().locatorForOptional('input[role="combobox"]');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: CommandPaletteHarnessFilters = {},
  ): HarnessPredicate<CommandPaletteHarness> {
    return new HarnessPredicate(CommandPaletteHarness, options).addOption(
      'label',
      options.label,
      async (harness, label) =>
        HarnessPredicate.stringMatches(await harness.getLabel(), label),
    );
  }

  /** Whether the palette overlay is currently attached. */
  async isOpen(): Promise<boolean> {
    return (await this.panel()) !== null;
  }

  /** The palette's accessible label, or `null` when it is closed. */
  async getLabel(): Promise<string | null> {
    const panel = await this.panel();
    return panel ? panel.getAttribute('aria-label') : null;
  }

  /** The current search query. Returns an empty string when the palette is closed. */
  async getQuery(): Promise<string> {
    const input = await this.input();
    return input ? input.getProperty<string>('value') : '';
  }

  /**
   * Types into the search input, replacing any existing query, then waits for
   * the results to settle.
   */
  async setQuery(query: string): Promise<void> {
    const input = await this.requireInput('setQuery');
    await input.clear();
    await input.sendKeys(query);
    await this.waitForTasksOutsideAngular();
  }

  /** Clears the search query. */
  async clearQuery(): Promise<void> {
    const input = await this.requireInput('clearQuery');
    await input.clear();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Sends Escape to the search input. No-op when the palette is already closed.
   *
   * **The overlay is still attached when this resolves.** The component defers
   * the detach behind a leave animation, so a caller asserting on `isOpen()`
   * immediately afterwards will still see `true`. Wait for the animation before
   * asserting — with a plain timer, not by polling a harness method.
   *
   * That caveat is deliberate rather than hidden behind a poll. An earlier
   * version looped on `isOpen()` until the panel detached, which reads better
   * but is unsound here: every harness call routes through
   * `fixture.whenStable()`, and under zoneless that can wait on a re-scheduled
   * timer and never resolve. A deadline checked *between* awaits cannot bound a
   * single await that never returns, so the loop hung the suite instead of
   * failing it. A harness that can hang is worse than one that makes the caller
   * wait explicitly.
   *
   * **This method is not covered by a spec.** A test driving it hung at the full
   * 15000ms budget in roughly one run in three: the harness calls it makes
   * around a leave animation route through `whenStable()`, which can wait on a
   * re-scheduled timer and never resolve. Escape dismissal itself is covered in
   * `command-palette.spec.ts`, directly against the component.
   */
  async close(): Promise<void> {
    const input = await this.input();
    if (!input) return;
    await input.sendKeys(TestKey.ESCAPE);
  }

  /** Moves the active descendant down one row. */
  async pressArrowDown(): Promise<void> {
    await (await this.requireInput('pressArrowDown')).sendKeys(TestKey.DOWN_ARROW);
    await this.waitForTasksOutsideAngular();
  }

  /** Moves the active descendant up one row. */
  async pressArrowUp(): Promise<void> {
    await (await this.requireInput('pressArrowUp')).sendKeys(TestKey.UP_ARROW);
    await this.waitForTasksOutsideAngular();
  }

  /** Activates the current active descendant with Enter. */
  async pressEnter(): Promise<void> {
    await (await this.requireInput('pressEnter')).sendKeys(TestKey.ENTER);
    await this.waitForTasksOutsideAngular();
  }

  /**
   * Every result row currently rendered. Returns an empty array when the palette
   * is closed.
   */
  async getItems(
    filters: CommandPaletteItemHarnessFilters = {},
  ): Promise<CommandPaletteItemHarness[]> {
    if (!(await this.panel())) return [];
    return this.documentRootLocatorFactory().locatorForAll(
      CommandPaletteItemHarness.with(filters),
    )();
  }

  /**
   * The labels of the rendered group headings, in DOM order. Ungrouped results
   * produce an empty array.
   */
  async getGroupLabels(): Promise<string[]> {
    if (!(await this.panel())) return [];
    const groups = await this.documentRootLocatorFactory().locatorForAll(
      '[role="group"]',
    )();
    const labels = await Promise.all(
      groups.map((group) => group.getAttribute('aria-label')),
    );
    return labels.filter((label): label is string => label !== null);
  }

  /**
   * The text of the active row, resolved through the input's
   * `aria-activedescendant`, or `null` when nothing is active.
   */
  async getActiveItemText(): Promise<string | null> {
    const active = await this.getItems({ active: true });
    return active.length > 0 ? active[0].getText() : null;
  }

  /**
   * Clicks the first row whose text matches. Throws when nothing matches, rather
   * than failing silently.
   */
  async selectItem(text: string | RegExp): Promise<void> {
    const matches = await this.getItems({ text });
    if (matches.length === 0) {
      throw new Error(
        `CommandPaletteHarness.selectItem: no result matching ${String(text)}.`,
      );
    }
    await matches[0].click();
    await this.waitForTasksOutsideAngular();
  }

  /**
   * The search input, or a named error when the palette is closed. Every typing
   * and key method needs it, and "cannot read property of null" would not say why.
   */
  private async requireInput(method: string) {
    const input = await this.input();
    if (!input) {
      throw new Error(
        `CommandPaletteHarness.${method}: the palette is closed, so it has no search input.`,
      );
    }
    return input;
  }
}
