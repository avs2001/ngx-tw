import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';

/** Filters accepted by `FileUploadFileHarness.with`. */
export interface FileUploadFileHarnessFilters extends BaseHarnessFilters {
  /** Match by the attached file's name. */
  name?: string | RegExp;
}

/**
 * Harness for a single attached file in a `tw-file-upload`'s list.
 *
 * Reach these through {@link FileUploadHarness.getFiles}.
 *
 * Everything here reads the *default* row rendering. A consumer who projects a
 * `*twFileUploadItem` template replaces the row wholesale — including the
 * remove control this harness drives — so {@link getName} and {@link remove}
 * apply only to the built-in row.
 */
export class FileUploadFileHarness extends ComponentHarness {
  static hostSelector = 'ul[role="list"] > li';

  private readonly removeButton = this.locatorFor('[data-tw-file-upload-remove]');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: FileUploadFileHarnessFilters = {},
  ): HarnessPredicate<FileUploadFileHarness> {
    return new HarnessPredicate(FileUploadFileHarness, options).addOption(
      'name',
      options.name,
      async (h, name) => HarnessPredicate.stringMatches(await h.getName(), name),
    );
  }

  /**
   * The attached file's name, read from the remove control's accessible name
   * (`Remove <name>`). That is the one place the name is exposed through an
   * accessibility contract rather than through presentational markup.
   */
  async getName(): Promise<string> {
    const label = (await (await this.removeButton()).getAttribute('aria-label')) ?? '';
    return label.replace(/^Remove /, '');
  }

  /**
   * The row's full rendered text, whitespace-collapsed.
   *
   * The name and the meta line sit in adjacent `<span>`s with only a
   * whitespace-only text node between them, which Angular strips, so they run
   * together here (`notes.txt10 B`). Prefer {@link getName} and
   * {@link getMetaText} for the parts; this is the raw read that still says
   * something about a row rendered from a projected template.
   */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).replace(/\s+/g, ' ').trim();
  }

  /**
   * The row's meta line — the formatted size, plus the status and error text
   * once the item leaves `pending` (`10 B`, `10 B · Uploading`,
   * `10 B · Failed — <error>`).
   *
   * This string is the only place per-item status and error surface in the
   * DOM: there is no `data-status` hook, and the status otherwise shows up
   * only in Tailwind classes, which a harness must not read. Derived by
   * subtracting {@link getName} from {@link getText} for the same reason.
   */
  async getMetaText(): Promise<string> {
    const text = await this.getText();
    const name = await this.getName();
    return text.startsWith(name) ? text.slice(name.length).trim() : text;
  }

  /**
   * Clicks the row's remove control.
   *
   * The component retargets focus in an `afterNextRender` — deliberately, so
   * that the list has re-rendered before focus moves — so the focus assertion
   * a caller makes after this resolves is the post-render one.
   */
  async remove(): Promise<void> {
    await (await this.removeButton()).click();
    await this.waitForTasksOutsideAngular();
  }
}
