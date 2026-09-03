import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { PopoverDirective } from '../popover';
import { PopoverHarness } from './popover-harness';

/**
 * Two real popovers plus a decoy: the third button carries the same
 * `aria-haspopup="dialog"` marker this harness must select on (tw-date-picker
 * and tw-date-range-picker triggers look exactly like it), so the harness's
 * mismatch guard is exercised by a real fixture rather than by assertion alone.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PopoverDirective],
  template: `
    <button type="button" [twPopover]="details" [twPopoverArrow]="arrow()">
      Details
    </button>
    <ng-template #details><p>Shipping in 2 days</p></ng-template>

    <button type="button" [twPopover]="help">Help</button>
    <ng-template #help><p>Read the manual</p></ng-template>

    <button type="button" aria-haspopup="dialog" aria-controls="tw-date-picker-panel-1">
      Pick a date
    </button>
  `,
})
class HarnessHost {
  readonly arrow = signal(true);
}

/**
 * The popover's leave transition is a hard-coded 120 ms `setTimeout` in
 * `popover.ts`, not an input, so it cannot be zeroed away. Fake timers are not
 * an option either: every harness call routes through `fixture.whenStable()`,
 * which can hang under them (see the note in `dialog.spec.ts`). Real time with a
 * ~3x margin is the honest option; 400 ms against 120 ms leaves no race to lose.
 */
const LEAVE_MARGIN_MS = 400;
function settleLeaveAnimation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LEAVE_MARGIN_MS));
}

describe('PopoverHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // The ORDINARY fixture loader, deliberately. The panel renders into the
    // overlay container outside the fixture, but the harness hosts on the
    // in-fixture trigger and resolves the panel via `documentRootLocatorFactory()`
    // — so a consumer never needs `TestbedHarnessEnvironment.documentRootLoader`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  it('reads the trigger text and reports the closed state', async () => {
    const popover = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Details' }),
    );

    expect(await popover.getTriggerText()).toBe('Details');
    expect(await popover.isOpen()).toBe(false);
    expect(await popover.getText()).toBeNull();
  });

  it('opens, exposes its content, and closes', async () => {
    const popover = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Details' }),
    );

    await popover.open();
    expect(await popover.isOpen()).toBe(true);
    expect(await popover.getText()).toBe('Shipping in 2 days');

    await popover.close();
    await settleLeaveAnimation();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await popover.isOpen()).toBe(false);
    expect(await popover.getText()).toBeNull();
  });

  it('detaches and reuses its overlay rather than disposing it', async () => {
    const popover = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Details' }),
    );

    await popover.open();
    expect(await popover.getText()).toBe('Shipping in 2 days');

    await popover.close();
    await settleLeaveAnimation();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await popover.getText()).toBeNull();

    // Reopening on the SAME OverlayRef must produce the panel again. This is the
    // assertion that goes red if popover ever switches to dispose-on-close (like
    // `tw-select`) or stops detaching at all.
    await popover.open();
    expect(await popover.isOpen()).toBe(true);
    expect(await popover.getText()).toBe('Shipping in 2 days');
  });

  it('scopes the panel to its own trigger, not to every open popover', async () => {
    const details = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Details' }),
    );
    const help = await loader.getHarness(PopoverHarness.with({ triggerText: 'Help' }));

    await details.open();

    expect(await details.getText()).toBe('Shipping in 2 days');
    // A popover IS open in the document; `aria-controls` scoping keeps the other
    // trigger from claiming it.
    expect(await help.isOpen()).toBe(false);
    expect(await help.getText()).toBeNull();
  });

  it('reports arrow presence and absence', async () => {
    const popover = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Details' }),
    );

    await popover.open();
    expect(await popover.hasArrow()).toBe(true);

    await popover.close();
    await settleLeaveAnimation();
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.arrow.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    await popover.open();
    // Same reader, opposite answer — driven by `twPopoverArrow`, not by a
    // hardcoded return.
    expect(await popover.hasArrow()).toBe(false);
    expect(await popover.getText()).toBe('Shipping in 2 days');
  });

  it('throws instead of misreading a foreign aria-haspopup="dialog" control', async () => {
    // `[twPopover]` renders no attribute, so the host selector is
    // `aria-haspopup="dialog"` — which date pickers also carry. The guard turns
    // that unavoidable ambiguity into a named error rather than a wrong read.
    const foreign = await loader.getHarness(
      PopoverHarness.with({ triggerText: 'Pick a date' }),
    );

    await expect(foreign.getText()).rejects.toThrow(/not a tw-popover panel/i);
    await expect(foreign.isOpen()).rejects.toThrow(/not a tw-popover panel/i);
    await expect(foreign.open()).rejects.toThrow(/not a tw-popover panel/i);
    await expect(foreign.close()).rejects.toThrow(/not a tw-popover panel/i);
    await expect(foreign.hasArrow()).rejects.toThrow(/not a tw-popover panel/i);

    // `getTriggerText()` stays unguarded on purpose: `with({ triggerText })`
    // calls it while filtering, so it must be able to look at a foreign control
    // and report its text instead of throwing mid-query.
    expect(await foreign.getTriggerText()).toBe('Pick a date');
  });
});
