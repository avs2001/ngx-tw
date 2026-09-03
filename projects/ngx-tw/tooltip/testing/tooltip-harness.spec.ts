import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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

/**
 * Show and hide are `setTimeout`-driven even at a delay of `0`, so a test must
 * let time pass before asserting.
 *
 * These poll the DOM **directly** rather than through the harness. Two earlier
 * attempts failed for opposite reasons and both are worth recording:
 *
 * 1. A flat 100ms sleep at each of eight call sites — 800ms of guaranteed real
 *    time in one file, which lost the race against the default budget under
 *    full-suite contention while passing in isolation.
 * 2. Polling `harness.isOpen()` until it settled. That reads better, and it is
 *    unsound: every harness call routes through `fixture.whenStable()`, which
 *    under zoneless can wait on a re-scheduled timer and never resolve. A
 *    deadline checked *between* awaits cannot bound a single await that never
 *    returns, so the poll HUNG — it timed out at the full 15000ms budget rather
 *    than failing, which no timeout can fix.
 *
 * Reading `document` needs no stabilization, so it can neither hang nor burn a
 * fixed interval. The harness's own `isOpen()` remains correct for ordinary use;
 * it is *waiting* on it that is unsound.
 */
const TOOLTIP_PANEL = 'tw-tooltip-overlay';

async function settleUntil(condition: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`tooltip harness spec: timed out waiting for ${what}.`);
}

/** Waits until a tooltip panel is in the document. */
function settleOpen(): Promise<void> {
  return settleUntil(
    () => document.querySelector(TOOLTIP_PANEL) !== null,
    'the tooltip to show',
  );
}

/** Waits until no tooltip panel is in the document. */
function settleClosed(): Promise<void> {
  return settleUntil(
    () => document.querySelector(TOOLTIP_PANEL) === null,
    'the tooltip to hide',
  );
}

/**
 * Harness specs get a larger budget than Vitest's 5000ms default, applied at the
 * suite level rather than per test.
 *
 * Every harness call is an async round-trip through `fixture.whenStable()`, and
 * overlay components add real time that cannot be zeroed: their enter/leave
 * animations are hard-coded constants, not inputs, and fake timers hang against
 * `whenStable()`. A file that fits the default comfortably when run alone loses
 * the race under full-suite contention — these failed roughly one run in three,
 * one file at a time, which is how a suite trains people to re-run until green.
 *
 * This is sizing a budget to bounded, genuinely-real work. It is NOT the same as
 * widening a timeout to paper over a fixed sleep standing in for a condition —
 * that was the `menu` type-ahead flake, and it was fixed with virtual time
 * instead.
 */
const HARNESS_TIMEOUT_MS = 15_000;

describe('TooltipHarness', { timeout: HARNESS_TIMEOUT_MS }, () => {
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
    // overlay container outside the fixture; the harness hosts on the in-fixture
    // trigger and resolves the panel via `documentRootLocatorFactory()`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  it('starts hidden and reads the trigger text', async () => {
    const tooltip = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));

    expect(await tooltip.getTriggerText()).toBe('Save');
    expect(await tooltip.isOpen()).toBe(false);
    expect(await tooltip.getTooltipText()).toBeNull();
  });

  it('shows on hover and hides on mouse away', async () => {
    const tooltip = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));

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
    const tooltip = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));

    await tooltip.focusTrigger();
    await settleOpen();
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getTooltipText()).toBe('Saves your changes');

    await tooltip.blurTrigger();
    await settleClosed();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('reports the message of whichever trigger was used', async () => {
    const save = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));
    const discard = await loader.getHarness(
      TooltipHarness.with({ triggerText: 'Discard' }),
    );

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
    expect(await loader.getAllHarnesses(TooltipHarness)).toHaveLength(3);
    expect(
      await loader.getAllHarnesses(TooltipHarness.with({ triggerText: 'Delete' })),
    ).toHaveLength(0);
  });

  it('sees a trigger whose message is a property binding', async () => {
    // This asserted the OPPOSITE until `TooltipDirective` gained its
    // `data-tw-tooltip-trigger` marker, and said so in writing: a bound
    // `[twTooltip]="expr"` renders no attribute, so a harness matching the
    // directive's own selector found only literal triggers. That was a coverage
    // hole, not a design choice — a consumer binding the message could not test
    // it. The count above went 2 -> 3 with the marker.
    const bound = await loader.getHarness(
      TooltipHarness.with({ triggerText: 'Bound' }),
    );
    expect(await bound.getTriggerText()).toBe('Bound');
  });
});
