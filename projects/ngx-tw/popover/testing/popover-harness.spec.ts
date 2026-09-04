import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, PendingTasks, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { PopoverDirective } from '../popover';
import { PopoverHarness } from './popover-harness';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PopoverDirective],
  template: `
    <button type="button" [twPopover]="details" [twPopoverArrow]="arrow()">Details</button>
    <ng-template #details><p>Shipping in 2 days</p></ng-template>

    <button type="button" [twPopover]="help">Help</button>
    <ng-template #help><p>Read the manual</p></ng-template>
  `,
})
class HarnessHost {
  readonly arrow = signal(true);
}

const PANEL = 'tw-popover-overlay';

/**
 * Waits by reading `document` directly, never through the harness.
 *
 * The panel detaches behind `popover.ts`'s hard-coded 120 ms leave window, so a
 * test has to wait for something. Polling a *harness* method to detect the
 * settled state is the trap this file exists to avoid: before the harness moved
 * onto `manualChangeDetection`, every harness call awaited
 * `fixture.whenStable()`, and a deadline checked *between* awaits cannot bound a
 * single await that never returns — such a poll HUNG for the whole budget
 * instead of failing. `document.querySelector` needs no stabilization, so it can
 * neither hang nor burn a fixed interval.
 */
async function settleUntil(condition: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`popover harness spec: timed out waiting for ${what}.`);
}

const settleOpen = () =>
  settleUntil(() => document.querySelector(PANEL) !== null, 'the panel to attach');
const settleClosed = () =>
  settleUntil(() => document.querySelector(PANEL) === null, 'the panel to detach');

describe('PopoverHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    // `detectChanges()` and nothing else. In zoneless it is
    // `includeAllTestViews = true; _appRef.tick()` — synchronous, so the fixture
    // is rendered when it returns. The `await fixture.whenStable()` that used to
    // follow was the last stabilization await in this file, and the only claim
    // here resting on a run tally rather than on construction; the harness's own
    // acquisition does not stabilize either, so nothing needed it.
    fixture.detectChanges();
    // The ORDINARY fixture loader, deliberately. The panel renders into the
    // overlay container outside the fixture, but the harness hosts on the
    // in-fixture trigger and resolves the panel via `documentRootLocatorFactory()`
    // — so a consumer never needs `TestbedHarnessEnvironment.documentRootLoader`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('reads the trigger text and reports the closed state', async () => {
    const popover = await PopoverHarness.load(loader, { triggerText: 'Details' });

    expect(await popover.getTriggerText()).toBe('Details');
    expect(await popover.isOpen()).toBe(false);
    expect(await popover.getText()).toBeNull();
  });

  it('opens, exposes its content, and closes', async () => {
    const popover = await PopoverHarness.load(loader, { triggerText: 'Details' });

    await popover.open();
    await settleOpen();
    expect(await popover.isOpen()).toBe(true);
    expect(await popover.getText()).toBe('Shipping in 2 days');

    await popover.close();
    await settleClosed();
    expect(await popover.isOpen()).toBe(false);
    expect(await popover.getText()).toBeNull();
  });

  it('detaches and reuses its overlay rather than disposing it', async () => {
    const popover = await PopoverHarness.load(loader, { triggerText: 'Details' });

    await popover.open();
    await settleOpen();
    expect(await popover.getText()).toBe('Shipping in 2 days');

    await popover.close();
    await settleClosed();
    expect(await popover.getText()).toBeNull();

    // Reopening on the SAME OverlayRef must produce the panel again. This is the
    // assertion that goes red if popover ever switches to dispose-on-close (like
    // `tw-select`) or stops detaching at all.
    await popover.open();
    await settleOpen();
    expect(await popover.isOpen()).toBe(true);
    expect(await popover.getText()).toBe('Shipping in 2 days');
  });

  it('scopes the panel to its own trigger, not to every open popover', async () => {
    const details = await PopoverHarness.load(loader, { triggerText: 'Details' });
    const help = await PopoverHarness.load(loader, { triggerText: 'Help' });

    await details.open();
    await settleOpen();

    expect(await details.getText()).toBe('Shipping in 2 days');
    // A popover IS open in the document; `aria-controls` scoping keeps the other
    // trigger from claiming it.
    expect(await help.isOpen()).toBe(false);
    expect(await help.getText()).toBeNull();
  });

  it('reports arrow presence and absence', async () => {
    const popover = await PopoverHarness.load(loader, { triggerText: 'Details' });

    await popover.open();
    await settleOpen();
    expect(await popover.hasArrow()).toBe(true);

    await popover.close();
    await settleClosed();

    fixture.componentInstance.arrow.set(false);
    fixture.detectChanges();

    await popover.open();
    await settleOpen();
    // Same reader, opposite answer — driven by `twPopoverArrow`, not by a
    // hardcoded return.
    expect(await popover.hasArrow()).toBe(false);
    expect(await popover.getText()).toBe('Shipping in 2 days');
  });

  it('finds triggers by text through the predicate', async () => {
    expect(await PopoverHarness.loadAll(loader)).toHaveLength(2);
    expect(await PopoverHarness.loadAll(loader, { triggerText: 'Nope' })).toHaveLength(0);
  });

  /**
   * The guard this harness was withdrawn twice for the want of.
   *
   * `TestbedHarnessEnvironment` routes every `TestElement` operation through
   * `forceStabilize()` — `fixture.detectChanges()` then
   * `await fixture.whenStable()` — and that await resolves only when Angular's
   * `PendingTasks` set is empty. Under full-suite contention it was observed not
   * to resolve at all around an open overlay, so every harness method hung for
   * the full test budget rather than failing. Two withdrawals were decided on
   * run tallies, which is the wrong instrument: local green was not evidence,
   * and CI green would not have been proof either.
   *
   * This makes the property deterministic instead. Holding one real
   * `PendingTasks` entry open guarantees `whenStable()` never resolves, so any
   * method that awaits it can never return — the exact production failure, on
   * demand, in every environment. Every method must still answer.
   *
   * `Promise.race` is what bounds it, and it is doing something a polling
   * deadline cannot: it bounds a *single* await that never returns, turning the
   * hang into a named failure. Remove `manualChangeDetection` from any method
   * below and this test goes red in about a second.
   */
  describe('never awaits application stabilization', () => {
    /**
     * Bounds a SINGLE await that may never return, which a polling deadline
     * cannot: a deadline checked between awaits never gets to run again. This
     * turns the production hang into a named failure in about a second.
     */
    async function withinBudget<T>(work: Promise<T>, label: string): Promise<T> {
      let timer: ReturnType<typeof setTimeout>;
      const bail = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`PopoverHarness.${label} awaited app stabilization.`)),
          1000,
        );
      });
      try {
        return await Promise.race([work, bail]);
      } finally {
        clearTimeout(timer!);
      }
    }

    /**
     * Makes stabilization impossible for the WHOLE body, acquisition included.
     *
     * The earlier draft of this guard acquired the harness first and only then
     * held the entry — which would have passed while leaving the real defect in
     * place, because the hang that withdrew this harness was at acquisition, not
     * in a method. `PopoverHarness.load` is what closes that, so the guard has to
     * cover it.
     */
    async function underPermanentInstability(
      body: (popover: PopoverHarness) => Promise<void>,
    ): Promise<void> {
      const release = TestBed.inject(PendingTasks).add();
      try {
        const popover = await withinBudget(
          PopoverHarness.load(loader, { triggerText: 'Details' }),
          'load',
        );
        await body(popover);
      } finally {
        release();
      }
    }

    it('acquires in bulk while the application can never stabilize', async () => {
      const release = TestBed.inject(PendingTasks).add();
      try {
        const all = await withinBudget(PopoverHarness.loadAll(loader), 'loadAll');
        expect(all.length).toBeGreaterThan(1);
      } finally {
        release();
      }
    });

    it('answers every read while the application can never stabilize', async () => {
      await underPermanentInstability(async (popover) => {
        expect(await withinBudget(popover.getTriggerText(), 'getTriggerText')).toBe('Details');
        expect(await withinBudget(popover.isOpen(), 'isOpen')).toBe(false);
        expect(await withinBudget(popover.getText(), 'getText')).toBeNull();
        expect(await withinBudget(popover.hasArrow(), 'hasArrow')).toBe(false);
      });
    });

    it('completes both actions while the application can never stabilize', async () => {
      await underPermanentInstability(async (popover) => {
        await withinBudget(popover.open(), 'open');
        await settleOpen();
        expect(await withinBudget(popover.isOpen(), 'isOpen')).toBe(true);
        expect(await withinBudget(popover.getText(), 'getText')).toBe('Shipping in 2 days');

        await withinBudget(popover.close(), 'close');
        await settleClosed();
        expect(await withinBudget(popover.isOpen(), 'isOpen')).toBe(false);
      });
    });
  });
});
