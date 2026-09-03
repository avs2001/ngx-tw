import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TooltipDirective } from '../tooltip';
import { TooltipHarness } from './tooltip-harness';

/**
 * Two statically-declared tooltip triggers, plus a third whose message is a
 * PROPERTY BINDING. Angular renders no `twTooltip` attribute for the bound form,
 * so the third button is invisible to the harness — see the documented
 * limitation on `TooltipHarness` and the last test in this file.
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
 * Show and hide are `setTimeout`-driven even at a delay of `0`, and fake timers
 * are not an option here: every harness call routes through
 * `fixture.whenStable()`, which can hang under them.
 *
 * So this polls for the expected state instead of sleeping a fixed interval.
 * The earlier version waited a flat 100ms at each of eight call sites — 800ms of
 * guaranteed real time in one file, which blew the 5000ms budget under
 * full-suite contention while passing in isolation. That is the load-dependent
 * flake class the suite was just cleaned of; a fixed sleep only moves the
 * threshold, whereas polling returns as soon as the state settles (immediately,
 * at a delay of 0) and still fails loudly if it never does.
 */
async function settleUntil(
  condition: () => Promise<boolean>,
  what: string,
): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`tooltip harness: timed out waiting for ${what}.`);
}

/** Waits until the tooltip is attached. */
function settleOpen(tooltip: { isOpen(): Promise<boolean> }): Promise<void> {
  return settleUntil(() => tooltip.isOpen(), 'the tooltip to show');
}

/** Waits until the tooltip is detached. */
function settleClosed(tooltip: { isOpen(): Promise<boolean> }): Promise<void> {
  return settleUntil(async () => !(await tooltip.isOpen()), 'the tooltip to hide');
}

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
    await settleOpen(tooltip);
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getTooltipText()).toBe('Saves your changes');

    await tooltip.hide();
    await settleClosed(tooltip);
    expect(await tooltip.isOpen()).toBe(false);
    expect(await tooltip.getTooltipText()).toBeNull();
  });

  it('shows on focus and hides on blur', async () => {
    const tooltip = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));

    await tooltip.focusTrigger();
    await settleOpen(tooltip);
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getTooltipText()).toBe('Saves your changes');

    await tooltip.blurTrigger();
    await settleClosed(tooltip);
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('reports the message of whichever trigger was used', async () => {
    const save = await loader.getHarness(TooltipHarness.with({ triggerText: 'Save' }));
    const discard = await loader.getHarness(
      TooltipHarness.with({ triggerText: 'Discard' }),
    );

    await save.show();
    await settleOpen(save);
    expect(await save.getTooltipText()).toBe('Saves your changes');

    await save.hide();
    await settleClosed(save);

    await discard.show();
    await settleOpen(discard);
    // Same reader, different answer — a hardcoded `getTooltipText()` could not
    // satisfy both.
    expect(await discard.getTooltipText()).toBe('Throws your changes away');
  });

  it('finds tooltips by trigger text through the predicate', async () => {
    expect(await loader.getAllHarnesses(TooltipHarness)).toHaveLength(2);
    expect(
      await loader.getAllHarnesses(TooltipHarness.with({ triggerText: 'Delete' })),
    ).toHaveLength(0);
  });

  it('cannot see a trigger whose message is a property binding', async () => {
    // DOCUMENTS A GAP, not a desired behaviour. `[twTooltip]="expr"` renders no
    // attribute, and `TooltipDirective` adds no host class, so the third button
    // in the fixture is invisible to this harness — hence a count of 2, not 3,
    // above. If the directive ever gains a host marker and this selector is
    // widened, this test goes red and should be deleted.
    expect(
      await loader.getAllHarnesses(TooltipHarness.with({ triggerText: 'Bound' })),
    ).toHaveLength(0);
  });
});
