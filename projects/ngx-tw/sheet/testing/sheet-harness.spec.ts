import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideSheet, Sheet } from '../sheet';
import type { SheetConfig } from '../sheet-config';
import {
  SheetActionsDirective,
  SheetContentDirective,
  SheetTitleDirective,
} from '../sheet-content';
import { SheetHarness } from './sheet-harness';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SheetTitleDirective, SheetContentDirective, SheetActionsDirective],
  template: `
    <h2 twSheetTitle>Filters</h2>
    <div twSheetContent>Narrow the result set.</div>
    <div twSheetActions>
      <button type="button" class="apply">Apply</button>
    </div>
  `,
})
class SheetBody {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button">host</button>`,
})
class HarnessHost {
  readonly sheet = inject(Sheet);
}

describe('SheetHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  /**
   * The DOCUMENT-ROOT loader, deliberately. A sheet is service-opened, so no
   * element in `fixture.nativeElement` represents it — the container renders
   * straight into the overlay container on `document.body`. Harnesses whose host
   * IS in the fixture (`SelectHarness`, `MenuHarness`, `PopoverHarness`,
   * `TooltipHarness`) use the plain `loader(fixture)` and reach their overlay
   * internally; this is the case where that is impossible.
   */
  let rootLoader: HarnessLoader;

  /**
   * Opens a sheet and waits for it to be in the DOM.
   *
   * `Sheet` defers its render layer behind a dynamic `import()`, so nothing
   * exists synchronously after `open()`. `whenComponentReady()` is the public
   * await for that. Enter/exit durations are zeroed so
   * `OverlayContainerCoordinator` runs its state machine synchronously.
   */
  async function open(config: Partial<SheetConfig> = {}) {
    const ref = fixture.componentInstance.sheet.open(SheetBody, {
      enterAnimationDuration: 0,
      exitAnimationDuration: 0,
      ...config,
    });
    await ref.whenComponentReady();
    fixture.detectChanges();
    await fixture.whenStable();
    return ref;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
      providers: [provideSheet()],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  });

  afterEach(() => {
    TestBed.inject(Sheet).closeAll();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  it('finds nothing before open() and the container after it', async () => {
    expect(await rootLoader.getAllHarnesses(SheetHarness)).toHaveLength(0);

    await open();

    expect(await rootLoader.getAllHarnesses(SheetHarness)).toHaveLength(1);
  });

  it('reads the id, role, title and content', async () => {
    const ref = await open({ id: 'filters-sheet' });
    const sheet = await rootLoader.getHarness(SheetHarness);

    expect(await sheet.getId()).toBe('filters-sheet');
    expect(await sheet.getId()).toBe(ref.id);
    expect(await sheet.getRole()).toBe('dialog');
    expect(await sheet.getTitleText()).toBe('Filters');
    expect(await sheet.getContentText()).toBe('Narrow the result set.');
  });

  it('reports the anchored edge, and tracks it across configurations', async () => {
    await open();
    expect(await (await rootLoader.getHarness(SheetHarness)).getSide()).toBe(
      'right',
    );

    TestBed.inject(Sheet).closeAll();
    fixture.detectChanges();
    await fixture.whenStable();

    await open({ side: 'bottom' });
    expect(await (await rootLoader.getHarness(SheetHarness)).getSide()).toBe(
      'bottom',
    );
  });

  it('finds a sheet by side and title through the predicate', async () => {
    await open({ side: 'left' });

    const sheet = await rootLoader.getHarness(
      SheetHarness.with({ side: 'left', title: 'Filters' }),
    );
    expect(await sheet.getSide()).toBe('left');

    expect(
      await rootLoader.getAllHarnesses(SheetHarness.with({ side: 'top' })),
    ).toHaveLength(0);
  });

  it('reports the backdrop, and its absence', async () => {
    await open();
    expect(await (await rootLoader.getHarness(SheetHarness)).hasBackdrop()).toBe(
      true,
    );

    TestBed.inject(Sheet).closeAll();
    fixture.detectChanges();
    await fixture.whenStable();

    await open({ hasBackdrop: false });
    const sheet = await rootLoader.getHarness(SheetHarness);
    expect(await sheet.hasBackdrop()).toBe(false);
    await expect(sheet.clickBackdrop()).rejects.toThrow(/no backdrop/i);
  });

  it('dismisses on a backdrop click and on Escape', async () => {
    const byBackdrop = await open();
    await (await rootLoader.getHarness(SheetHarness)).clickBackdrop();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(byBackdrop.state()).toBe('closed');
    expect(await rootLoader.getAllHarnesses(SheetHarness)).toHaveLength(0);

    const byEscape = await open();
    await (await rootLoader.getHarness(SheetHarness)).pressEscape();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(byEscape.state()).toBe('closed');
    expect(await rootLoader.getAllHarnesses(SheetHarness)).toHaveLength(0);
  });

  it('blocks both dismiss gestures when disableClose is set', async () => {
    const ref = await open({ disableClose: true });
    const sheet = await rootLoader.getHarness(SheetHarness);

    await sheet.pressEscape();
    await sheet.clickBackdrop();
    fixture.detectChanges();
    await fixture.whenStable();

    // The same two calls closed the sheet in the test above — the difference is
    // produced by `disableClose`, not by an inert harness.
    expect(ref.state()).toBe('open');
    expect(await rootLoader.getAllHarnesses(SheetHarness)).toHaveLength(1);
  });

  it('reports which of two stacked sheets holds focus', async () => {
    await open({ id: 'first' });
    const first = await rootLoader.getHarness(SheetHarness.with({ id: 'first' }));
    expect(await first.containsFocus()).toBe(true);

    // Stacking a second sheet moves the focus trap onto it. The SAME reader now
    // answers differently for the two instances, which a hardcoded
    // `containsFocus()` could not do.
    await open({ id: 'second' });
    const second = await rootLoader.getHarness(SheetHarness.with({ id: 'second' }));

    expect(await second.containsFocus()).toBe(true);
    expect(await first.containsFocus()).toBe(false);
  });
});
