import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';

/** Filters accepted by `DialogHarness.with`. */
export interface DialogHarnessFilters extends BaseHarnessFilters {
  /** Match by the dialog's id — the same value as `TwDialogRef.id`. */
  id?: string | RegExp;
  /** Match by the text of the projected `[twDialogTitle]` element. */
  title?: string | RegExp;
  /** Match by ARIA role — `'dialog'` or `'alertdialog'`. */
  role?: string | RegExp;
}

/**
 * Harness for a dialog opened with `TwDialog.open()`.
 *
 * ## Loading it
 *
 * A dialog is **service-opened**, not template-declared: nothing in the test
 * fixture's own DOM represents it, and the container renders into the CDK
 * overlay container on `document.body`. This harness's host *is* that container,
 * so it must be loaded from
 * `TestbedHarnessEnvironment.documentRootLoader(fixture)` — the ordinary
 * `loader(fixture)` searches inside `fixture.nativeElement` and will never find
 * it. This is not the same situation as an overlay *panel* belonging to a
 * template-declared component (`tw-select`, `tw-popover-overlay`, `tw-menu`),
 * where the harness hosts on the in-fixture trigger and reaches its panel
 * internally; there the plain fixture loader is correct.
 *
 * ## Waiting for it
 *
 * `TwDialog` loads its render layer through a dynamic `import()`, so the
 * container does **not** exist synchronously after `open()`. Await the ref's
 * public {@link TwDialogRef.whenComponentReady} before asking for the harness —
 * it resolves once the chunk has landed and the overlay is attached, for
 * template dialogs (with `null`) as well as component dialogs.
 *
 * @example
 * ```ts
 * const ref = dialog.open(EditorDialog);
 * await ref.whenComponentReady();
 * const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
 * const harness = await rootLoader.getHarness(DialogHarness);
 * expect(await harness.getTitleText()).toBe('Edit profile');
 * ```
 */
export class DialogHarness extends ComponentHarness {
  static hostSelector = 'tw-dialog-container';

  private readonly title = this.locatorForOptional(
    '[twDialogTitle], tw-dialog-title',
  );
  private readonly content = this.locatorForOptional(
    '[twDialogContent], tw-dialog-content',
  );
  /** Any descendant of the container that currently holds DOM focus. */
  private readonly focusedDescendant = this.locatorForOptional(':focus');
  /**
   * Overlay backdrops, which are siblings of the dialog's overlay pane rather
   * than descendants of the container — hence the document-root lookup.
   */
  private readonly backdrops =
    this.documentRootLocatorFactory().locatorForAll('.cdk-overlay-backdrop');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: DialogHarnessFilters = {}): HarnessPredicate<DialogHarness> {
    return new HarnessPredicate(DialogHarness, options)
      .addOption('id', options.id, async (h, id) =>
        HarnessPredicate.stringMatches(await h.getId(), id),
      )
      .addOption('title', options.title, async (h, title) =>
        HarnessPredicate.stringMatches(await h.getTitleText(), title),
      )
      .addOption('role', options.role, async (h, role) =>
        HarnessPredicate.stringMatches(await h.getRole(), role),
      );
  }

  /** The dialog's id. Matches the `id` on the `TwDialogRef` returned by `open()`. */
  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  /** The dialog's ARIA role — `'dialog'`, or `'alertdialog'` when so configured. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /**
   * Text of the projected `[twDialogTitle]` element, trimmed, or `null` when
   * the dialog's content does not use the title directive.
   */
  async getTitleText(): Promise<string | null> {
    const title: TestElement | null = await this.title();
    return title ? (await title.text()).trim() : null;
  }

  /**
   * Text of the projected `[twDialogContent]` region, trimmed, or `null` when
   * the dialog's content does not use the content directive.
   */
  async getContentText(): Promise<string | null> {
    const content: TestElement | null = await this.content();
    return content ? (await content.text()).trim() : null;
  }

  /**
   * Whether DOM focus currently sits on the dialog container or anywhere inside
   * it — the observable consequence of the CDK focus trap. CDK moves focus
   * asynchronously, so let the fixture settle after opening before asserting.
   */
  async containsFocus(): Promise<boolean> {
    if (await (await this.host()).isFocused()) return true;
    return (await this.focusedDescendant()) !== null;
  }

  /** Whether the dialog rendered a backdrop. */
  async hasBackdrop(): Promise<boolean> {
    return (await this.backdrops()).length > 0;
  }

  /**
   * Clicks the backdrop — the pointer dismiss gesture. Does nothing observable
   * when the dialog was opened with `disableClose: true`, which is exactly how
   * a test asserts that flag.
   *
   * Throws when no backdrop is rendered. With several overlays stacked, the
   * last backdrop in the overlay container is used, i.e. the topmost one.
   */
  async clickBackdrop(): Promise<void> {
    const backdrops = await this.backdrops();
    if (backdrops.length === 0) {
      throw new Error(
        'DialogHarness.clickBackdrop: no backdrop is rendered. The dialog was opened with `hasBackdrop: false`.',
      );
    }
    await backdrops[backdrops.length - 1].click();
  }

  /**
   * Sends Escape to the dialog — the keyboard dismiss gesture. Like
   * {@link clickBackdrop}, it is deliberately a no-op when the dialog was
   * opened with `disableClose: true`.
   */
  async pressEscape(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }
}
