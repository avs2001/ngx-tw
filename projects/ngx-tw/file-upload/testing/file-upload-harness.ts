import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import type { BaseHarnessFilters } from '@angular/cdk/testing';
import {
  FileUploadFileHarness,
  type FileUploadFileHarnessFilters,
} from './file-upload-file-harness';

/** Filters accepted by `FileUploadHarness.with`. */
export interface FileUploadHarnessFilters extends BaseHarnessFilters {
  /** Match by the control's accessible name (its `aria-label`). */
  label?: string | RegExp;
  /** Match disabled / enabled controls. */
  disabled?: boolean;
}

/**
 * Harness for `tw-file-upload`.
 *
 * ## What this harness deliberately cannot do
 *
 * It cannot attach a file. Selecting a file means populating
 * `HTMLInputElement.files`, which is read-only to script and which CDK's
 * `TestElement` — the whole reason a harness runs unchanged against a real
 * browser — has no operation for. The only way to do it is
 * `Object.defineProperty` on the raw DOM node, which exists solely in the
 * Testbed environment. Exposing that would make the harness silently
 * unusable in every other environment, so attaching stays the caller's job:
 * seed files through the bound form control (`writeValue` takes a `File[]`),
 * or through the component's own API, and use this harness for everything
 * downstream of the attachment.
 *
 * Nothing here needs a CDK overlay, so the ordinary fixture loader is enough.
 *
 * Note where the ARIA lives: the host is a `role="group"`, which ARIA 1.2 does
 * not allow to carry `aria-required` / `aria-invalid`, so both sit on the
 * hidden `<input type="file">` — the element that actually owns the value.
 * {@link isRequired} and {@link isInvalid} read them from there;
 * {@link isDisabled} reads `aria-disabled` from the group, which is allowed.
 */
export class FileUploadHarness extends ComponentHarness {
  static hostSelector = 'tw-file-upload';

  /** The hidden native control. It carries the value-owning ARIA and state. */
  private readonly nativeInput = this.locatorFor('input[type="file"]');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(
    options: FileUploadHarnessFilters = {},
  ): HarnessPredicate<FileUploadHarness> {
    return new HarnessPredicate(FileUploadHarness, options)
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

  /** Whether the native file input is marked required. */
  async isRequired(): Promise<boolean> {
    return (await this.nativeInput()).getProperty<boolean>('required');
  }

  /** Whether the native file input reports `aria-invalid="true"`. */
  async isInvalid(): Promise<boolean> {
    return (await (await this.nativeInput()).getAttribute('aria-invalid')) === 'true';
  }

  /**
   * Every attached file, in list order. Returns `[]` when nothing is attached
   * — the list element is always rendered, just empty.
   */
  async getFiles(
    filters: FileUploadFileHarnessFilters = {},
  ): Promise<FileUploadFileHarness[]> {
    return this.locatorForAll(FileUploadFileHarness.with(filters))();
  }

  /** The name of every attached file, in list order. */
  async getFileNames(): Promise<string[]> {
    const files = await this.getFiles();
    return Promise.all(files.map((file) => file.getName()));
  }

  /**
   * Removes the first attached file whose name matches. Throws when nothing
   * matches, rather than failing silently.
   */
  async removeFile(name: string | RegExp): Promise<void> {
    const matches = await this.getFiles({ name });
    if (matches.length === 0) {
      throw new Error(
        `FileUploadHarness.removeFile: no attached file matching ${String(name)}.`,
      );
    }
    await matches[0].remove();
  }
}
