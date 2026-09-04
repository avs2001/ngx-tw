import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, PendingTasks } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TooltipDirective } from '../tooltip';
import { TooltipHarness } from './tooltip-harness';

/**
 * Two statically-declared tooltip triggers plus a third whose message is a
 * PROPERTY BINDING. All three are reachable: `TooltipDirective` carries a static
 * `data-tw-tooltip-trigger` marker, which is what the harness matches. Matching
 * `[twTooltip]` instead would find only the two literal forms, because Angular
 * renders no attribute for a bound input — the bound trigger is the case the
 * marker exists for.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TooltipDirective],
  template: `
    <button
      type="button"
      twTooltip="Saves your changes"
      [twTooltipShowDelay]="0"
      [twTooltipHideDelay]="0"
    >
      Save
    </button>

    <button
      type="button"
      twTooltip="Throws your changes away"
      [twTooltipShowDelay]="0"
      [twTooltipHideDelay]="0"
    >
      Discard
    </button>

    <button
      type="button"
      [twTooltip]="'Bound message'"
      [twTooltipShowDelay]="0"
      [twTooltipHideDelay]="0"
    >
      Bound
    </button>
  `,
})
class HarnessHost {}

const PANEL = 'tw-tooltip-overlay';

/**
 * Waits by reading `document` directly, never through the harness.
 *
 * Show and hide are `setTimeout`-driven even at a delay of `0`, so a test has to
 * wait for something. Polling a *harness* method to detect the settled state is
 * the trap this file exists to avoid: before the harness moved onto
 * `manualChangeDetection`, every harness call awaited `fixture.whenStable()`,
 * and a deadline checked *between* awaits cannot bound a single await that never
 * returns — such a poll HUNG for the whole budget instead of failing.
 * `document.querySelector` needs no stabilization, so it can neither hang nor
 * burn a fixed interval.
 */
async function settleUntil(condition: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`tooltip harness spec: timed out waiting for ${what}.`);
}

const settleOpen = () =>
  settleUntil(() => document.querySelector(PANEL) !== null, 'the tooltip to show');
const settleClosed = () =>
  settleUntil(() => document.querySelector(PANEL) === null, 'the tooltip to hide');

describe('TooltipHarness', () => {
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
    // overlay container outside the fixture; the harness hosts on the in-fixture
    // trigger and resolves the panel via `documentRootLocatorFactory()`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  it('starts hidden and reads the trigger text', async () => {
    const tooltip = await TooltipHarness.load(loader, { triggerText: 'Save' });

    expect(await tooltip.getTriggerText()).toBe('Save');
    expect(await tooltip.isOpen()).toBe(false);
    expect(await tooltip.getTooltipText()).toBeNull();
  });

  it('shows on hover and hides on mouse away', async () => {
    const tooltip = await TooltipHarness.load(loader, { triggerText: 'Save' });

    await tooltip.show();
    await settleOpen();
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getTooltipText()).toBe('Saves your changes');

    await tooltip.hide();
    await settleClosed();
    expect(await tooltip.isOpen()).toBe(false);
    expect(await tooltip.getTooltipText()).toBeNull();
  });

  it('shows on focus and hides on blur', async () => {
    const tooltip = await TooltipHarness.load(loader, { triggerText: 'Save' });

    await tooltip.focusTrigger();
    await settleOpen();
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getTooltipText()).toBe('Saves your changes');

    await tooltip.blurTrigger();
    await settleClosed();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('reports the message of whichever trigger was used', async () => {
    const save = await TooltipHarness.load(loader, { triggerText: 'Save' });
    const discard = await TooltipHarness.load(loader, { triggerText: 'Discard' });

    await save.show();
    await settleOpen();
    expect(await save.getTooltipText()).toBe('Saves your changes');

    await save.hide();
    await settleClosed();

    await discard.show();
    await settleOpen();
    // Same reader, different answer — a hardcoded `getTooltipText()` could not
    // satisfy both.
    expect(await discard.getTooltipText()).toBe('Throws your changes away');
  });

  it('finds tooltips by trigger text through the predicate', async () => {
    expect(await TooltipHarness.loadAll(loader)).toHaveLength(3);
    expect(await TooltipHarness.loadAll(loader, { triggerText: 'Delete' })).toHaveLength(0);
  });

  it('sees a trigger whose message is a property binding', async () => {
    // This asserted the OPPOSITE until `TooltipDirective` gained its
    // `data-tw-tooltip-trigger` marker, and said so in writing: a bound
    // `[twTooltip]="expr"` renders no attribute, so a harness matching the
    // directive's own selector found only literal triggers. That was a coverage
    // hole, not a design choice — a consumer binding the message could not test
    // it. The count above went 2 -> 3 with the marker.
    const bound = await TooltipHarness.load(loader, { triggerText: 'Bound' });
    expect(await bound.getTriggerText()).toBe('Bound');
  });

  /**
   * The guard this harness was withdrawn for the want of.
   *
   * `TestbedHarnessEnvironment` routes every `TestElement` operation through
   * `forceStabilize()` — `fixture.detectChanges()` then
   * `await fixture.whenStable()` — and that await resolves only when Angular's
   * `PendingTasks` set is empty. Under full-suite contention it was observed not
   * to resolve at all around an open overlay, so every harness method hung for
   * the full test budget rather than failing. The withdrawal was decided on a
   * run tally — five green local runs, then one red CI run — which is the wrong
   * instrument: local green was not evidence, and CI green would not have been
   * proof either.
   *
   * This makes the property deterministic instead. Holding one real
   * `PendingTasks` entry open guarantees `whenStable()` never resolves, so any
   * method that awaits it can never return — the exact production failure, on
   * demand, in every environment. Every method must still answer.
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
          () => reject(new Error(`TooltipHarness.${label} awaited app stabilization.`)),
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
     * in a method. `TooltipHarness.load` is what closes that, so the guard has to
     * cover it.
     */
    async function underPermanentInstability(
      body: (tooltip: TooltipHarness) => Promise<void>,
    ): Promise<void> {
      const release = TestBed.inject(PendingTasks).add();
      try {
        const tooltip = await withinBudget(
          TooltipHarness.load(loader, { triggerText: 'Save' }),
          'load',
        );
        await body(tooltip);
      } finally {
        release();
      }
    }

    it('acquires in bulk while the application can never stabilize', async () => {
      const release = TestBed.inject(PendingTasks).add();
      try {
        const all = await withinBudget(TooltipHarness.loadAll(loader), 'loadAll');
        expect(all.length).toBeGreaterThan(1);
      } finally {
        release();
      }
    });

    it('answers every read while the application can never stabilize', async () => {
      await underPermanentInstability(async (tooltip) => {
        expect(await withinBudget(tooltip.getTriggerText(), 'getTriggerText')).toBe('Save');
        expect(await withinBudget(tooltip.isOpen(), 'isOpen')).toBe(false);
        expect(await withinBudget(tooltip.getTooltipText(), 'getTooltipText')).toBeNull();
      });
    });

    it('completes hover show and hide while the application can never stabilize', async () => {
      await underPermanentInstability(async (tooltip) => {
        await withinBudget(tooltip.show(), 'show');
        await settleOpen();
        expect(await withinBudget(tooltip.isOpen(), 'isOpen')).toBe(true);
        expect(await withinBudget(tooltip.getTooltipText(), 'getTooltipText')).toBe(
          'Saves your changes',
        );

        await withinBudget(tooltip.hide(), 'hide');
        await settleClosed();
        expect(await withinBudget(tooltip.isOpen(), 'isOpen')).toBe(false);
      });
    });

    it('completes focus show and blur hide while the application can never stabilize', async () => {
      await underPermanentInstability(async (tooltip) => {
        await withinBudget(tooltip.focusTrigger(), 'focusTrigger');
        await settleOpen();
        expect(await withinBudget(tooltip.isOpen(), 'isOpen')).toBe(true);

        await withinBudget(tooltip.blurTrigger(), 'blurTrigger');
        await settleClosed();
        expect(await withinBudget(tooltip.isOpen(), 'isOpen')).toBe(false);
      });
    });
  });
});
