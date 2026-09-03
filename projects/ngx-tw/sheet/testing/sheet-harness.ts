import { ComponentHarness, HarnessPredicate, TestKey } from '@angular/cdk/testing';
import type { BaseHarnessFilters, TestElement } from '@angular/cdk/testing';
// Imported through the package entry point, not a `../` path: a secondary entry
// point's `rootDir` is its own directory, so ng-packagr rejects a relative
// import that climbs out of `sheet/testing`.
import type { SheetSide } from '@cdevhub/ngx-tw/sheet';

/** Filters accepted by `SheetHarness.with`. */
export interface SheetHarnessFilters extends BaseHarnessFilters {
  /** Match by the sheet's id — the same value as `SheetRef.id`. */
  id?: string | RegExp;
  /** Match by the text of the projected `[twSheetTitle]` element. */
  title?: string | RegExp;
  /** Match by the edge the sheet is anchored to. */
  side?: SheetSide;
}

/**
 * Harness for a sheet opened with `Sheet.open()`.
 *
 * ## Loading it
 *
 * A sheet is **service-opened**, not template-declared: nothing in the test
 * fixture's own DOM represents it, and the container renders into the CDK
 * overlay container on `document.body`. This harness's host *is* that container,
 * so it must be loaded from
 * `TestbedHarnessEnvironment.documentRootLoader(fixture)` — the ordinary
 * `loader(fixture)` searches inside `fixture.nativeElement` and will never find
 * it. Overlay panels belonging to template-declared components (`tw-select`,
 * `tw-popover-overlay`, `tw-menu`) are the opposite case: those harnesses host
 * on the in-fixture trigger and reach their panel internally, so the plain
 * fixture loader is correct there.
 *
 * ## Waiting for it
 *
 * `Sheet` loads its render layer through a dynamic `import()`, so the container
 * does **not** exist synchronously after `open()`. Await the ref's public
 * {@link SheetRef.whenComponentReady} before asking for the harness — it
 * resolves once the chunk has landed and the overlay is attached, for template
 * sheets (with `null`) as well as component sheets.
 *
 * @example
 * ```ts
 * const ref = sheet.open(FiltersSheet, { side: 'left' });
 * await ref.whenComponentReady();
 * const rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
 * const harness = await rootLoader.getHarness(SheetHarness);
 * expect(await harness.getSide()).toBe('left');
 * ```
 */
export class SheetHarness extends ComponentHarness {
  static hostSelector = 'tw-sheet-container';

  private readonly title = this.locatorForOptional(
    '[twSheetTitle], tw-sheet-title',
  );
  private readonly content = this.locatorForOptional(
    '[twSheetContent], tw-sheet-content',
  );
  /** Any descendant of the container that currently holds DOM focus. */
  private readonly focusedDescendant = this.locatorForOptional(':focus');
  /**
   * Overlay backdrops, which are siblings of the sheet's overlay pane rather
   * than descendants of the container — hence the document-root lookup.
   */
  private readonly backdrops =
    this.documentRootLocatorFactory().locatorForAll('.cdk-overlay-backdrop');

  /** Predicate for `locatorFor` / `locatorForAll`. */
  static with(options: SheetHarnessFilters = {}): HarnessPredicate<SheetHarness> {
    return new HarnessPredicate(SheetHarness, options)
      .addOption('id', options.id, async (h, id) =>
        HarnessPredicate.stringMatches(await h.getId(), id),
      )
      .addOption('title', options.title, async (h, title) =>
        HarnessPredicate.stringMatches(await h.getTitleText(), title),
      )
      .addOption('side', options.side, async (h, side) => (await h.getSide()) === side);
  }

  /** The sheet's id. Matches the `id` on the `SheetRef` returned by `open()`. */
  async getId(): Promise<string | null> {
    return (await this.host()).getAttribute('id');
  }

  /** The sheet's ARIA role — `'dialog'`, or `'alertdialog'` when so configured. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /**
   * The edge the sheet is anchored to, read from the container's `data-side`
   * attribute. This is the one axis a sheet has that a dialog does not.
   */
  async getSide(): Promise<SheetSide | null> {
    return (await (await this.host()).getAttribute('data-side')) as SheetSide | null;
  }

  /**
   * Text of the projected `[twSheetTitle]` element, trimmed, or `null` when the
   * sheet's content does not use the title directive.
   */
  async getTitleText(): Promise<string | null> {
    const title: TestElement | null = await this.title();
    return title ? (await title.text()).trim() : null;
  }

  /**
   * Text of the projected `[twSheetContent]` region, trimmed, or `null` when
   * the sheet's content does not use the content directive.
   */
  async getContentText(): Promise<string | null> {
    const content: TestElement | null = await this.content();
    return content ? (await content.text()).trim() : null;
  }

  /**
   * Whether DOM focus currently sits on the sheet container or anywhere inside
   * it — the observable consequence of the CDK focus trap. CDK moves focus
   * asynchronously, so let the fixture settle after opening before asserting.
   */
  async containsFocus(): Promise<boolean> {
    if (await (await this.host()).isFocused()) return true;
    return (await this.focusedDescendant()) !== null;
  }

  /** Whether the sheet rendered a backdrop. */
  async hasBackdrop(): Promise<boolean> {
    return (await this.backdrops()).length > 0;
  }

  /**
   * Clicks the backdrop — the pointer dismiss gesture. Does nothing observable
   * when the sheet was opened with `disableClose: true` or
   * `closeOnBackdropClick: false`, which is how a test asserts those flags.
   *
   * Throws when no backdrop is rendered. With several overlays stacked, the
   * last backdrop in the overlay container is used, i.e. the topmost one.
   */
  async clickBackdrop(): Promise<void> {
    const backdrops = await this.backdrops();
    if (backdrops.length === 0) {
      throw new Error(
        'SheetHarness.clickBackdrop: no backdrop is rendered. The sheet was opened with `hasBackdrop: false`.',
      );
    }
    await backdrops[backdrops.length - 1].click();
  }

  /**
   * Sends Escape to the sheet — the keyboard dismiss gesture. Deliberately a
   * no-op when the sheet was opened with `disableClose: true` or
   * `closeOnEscape: false`.
   */
  async pressEscape(): Promise<void> {
    await (await this.host()).sendKeys(TestKey.ESCAPE);
  }
}
