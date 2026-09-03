import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideTwDialog, TwDialog } from '../dialog';
import type { TwDialogConfig } from '../dialog-config';
import {
  DialogActionsDirective,
  DialogContentDirective,
  DialogTitleDirective,
} from '../dialog-content';
import { DialogHarness } from './dialog-harness';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogTitleDirective, DialogContentDirective, DialogActionsDirective],
  template: `
    <h2 twDialogTitle>Edit profile</h2>
    <p twDialogContent>Change the name shown on your account.</p>
    <div twDialogActions>
      <button type="button" class="confirm">Save</button>
    </div>
  `,
})
class DialogBody {}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button">host</button>`,
})
class HarnessHost {
  readonly dialog = inject(TwDialog);
}

describe('DialogHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  /**
   * The DOCUMENT-ROOT loader, deliberately — and the one place in this library's
   * harnesses where it is required. A dialog is service-opened, so no element in
   * `fixture.nativeElement` represents it; the container renders straight into
   * the overlay container on `document.body`. Contrast `SelectHarness`, whose
   * host lives in the fixture and which resolves its panel internally, so the
   * plain `TestbedHarnessEnvironment.loader(fixture)` suffices there.
   */
  let rootLoader: HarnessLoader;

  /**
   * Opens a dialog and waits for it to be in the DOM.
   *
   * `TwDialog` defers its render layer behind a dynamic `import()`, so nothing
   * exists synchronously after `open()`. `whenComponentReady()` is the public
   * await for that — it resolves for template content too. Enter/exit durations
   * are zeroed so `OverlayContainerCoordinator` runs its state machine
   * synchronously (no `requestAnimationFrame`, no fallback timer).
   */
  async function open(config: Partial<TwDialogConfig> = {}) {
    const ref = fixture.componentInstance.dialog.open(DialogBody, {
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
      providers: [provideTwDialog()],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  });

  afterEach(() => {
    TestBed.inject(TwDialog).closeAll();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  it('finds nothing before open() and the container after it', async () => {
    expect(await rootLoader.getAllHarnesses(DialogHarness)).toHaveLength(0);

    await open();

    expect(await rootLoader.getAllHarnesses(DialogHarness)).toHaveLength(1);
  });

  it('reads the id, role, title and content', async () => {
    const ref = await open({ id: 'profile-dialog' });
    const dialog = await rootLoader.getHarness(DialogHarness);

    expect(await dialog.getId()).toBe('profile-dialog');
    expect(await dialog.getId()).toBe(ref.id);
    expect(await dialog.getRole()).toBe('dialog');
    expect(await dialog.getTitleText()).toBe('Edit profile');
    expect(await dialog.getContentText()).toBe(
      'Change the name shown on your account.',
    );
  });

  it('reports the alertdialog role when configured', async () => {
    await open({ role: 'alertdialog' });
    const dialog = await rootLoader.getHarness(DialogHarness);

    // Reads differently from the default asserted above, so a hardcoded
    // `getRole()` cannot satisfy both tests.
    expect(await dialog.getRole()).toBe('alertdialog');
  });

  it('finds a dialog by title through the predicate', async () => {
    await open();
    const dialog = await rootLoader.getHarness(
      DialogHarness.with({ title: 'Edit profile' }),
    );

    expect(await dialog.getTitleText()).toBe('Edit profile');
    expect(
      await rootLoader.getAllHarnesses(DialogHarness.with({ title: 'Nope' })),
    ).toHaveLength(0);
  });

  it('reports the backdrop, and its absence', async () => {
    await open();
    expect(await (await rootLoader.getHarness(DialogHarness)).hasBackdrop()).toBe(
      true,
    );

    TestBed.inject(TwDialog).closeAll();
    fixture.detectChanges();
    await fixture.whenStable();

    await open({ hasBackdrop: false });
    const dialog = await rootLoader.getHarness(DialogHarness);
    expect(await dialog.hasBackdrop()).toBe(false);
    await expect(dialog.clickBackdrop()).rejects.toThrow(/no backdrop/i);
  });

  it('dismisses on a backdrop click', async () => {
    const ref = await open();
    const dialog = await rootLoader.getHarness(DialogHarness);

    await dialog.clickBackdrop();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ref.state()).toBe('closed');
    expect(await rootLoader.getAllHarnesses(DialogHarness)).toHaveLength(0);
  });

  it('dismisses on Escape', async () => {
    const ref = await open();
    const dialog = await rootLoader.getHarness(DialogHarness);

    await dialog.pressEscape();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ref.state()).toBe('closed');
    expect(await rootLoader.getAllHarnesses(DialogHarness)).toHaveLength(0);
  });

  it('blocks both dismiss gestures when disableClose is set', async () => {
    const ref = await open({ disableClose: true });
    const dialog = await rootLoader.getHarness(DialogHarness);

    await dialog.pressEscape();
    await dialog.clickBackdrop();
    fixture.detectChanges();
    await fixture.whenStable();

    // The same two calls closed the dialog in the tests above — the state
    // difference is produced by `disableClose`, not by an inert harness.
    expect(ref.state()).toBe('open');
    expect(await rootLoader.getAllHarnesses(DialogHarness)).toHaveLength(1);
  });

  it('reports which of two stacked dialogs holds focus', async () => {
    await open({ id: 'first' });
    const first = await rootLoader.getHarness(DialogHarness.with({ id: 'first' }));
    expect(await first.containsFocus()).toBe(true);

    // Stacking a second dialog moves the focus trap onto it. The SAME reader now
    // answers differently for the two instances, which a hardcoded
    // `containsFocus()` could not do.
    await open({ id: 'second' });
    const second = await rootLoader.getHarness(DialogHarness.with({ id: 'second' }));

    expect(await second.containsFocus()).toBe(true);
    expect(await first.containsFocus()).toBe(false);
  });
});
