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

const PANEL = 'tw-tooltip-overlay';

/**
 * Waits by reading `document` directly, not through the harness.
 *
 * Show and hide are driven by plain `setTimeout`s even at a delay of `0`, and
 * Angular's `PendingTasks` does not track those — so the harness's own
 * `whenStable()` does not wait for them and a test has to wait for something.
 * `document.querySelector` sees the DOM directly, so this settles on the real
 * transition rather than burning a fixed interval.
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
    fixture.detectChanges();
    await fixture.whenStable();
    // The ORDINARY fixture loader, deliberately. The panel renders into the
    // overlay container outside the fixture; the harness hosts on the in-fixture
    // trigger and resolves the panel via `documentRootLocatorFactory()`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
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
    const discard = await loader.getHarness(TooltipHarness.with({ triggerText: 'Discard' }));

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
    const bound = await loader.getHarness(TooltipHarness.with({ triggerText: 'Bound' }));
    expect(await bound.getTriggerText()).toBe('Bound');
  });
});
