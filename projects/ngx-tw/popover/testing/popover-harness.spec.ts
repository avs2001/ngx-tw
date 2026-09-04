import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
 * Waits by reading `document` directly, not through the harness.
 *
 * The panel detaches behind `popover.ts`'s hard-coded 120 ms leave window,
 * driven by a plain `setTimeout` that Angular's `PendingTasks` does not track —
 * so the harness's own `whenStable()` does not wait for it and a test has to
 * wait for something. `document.querySelector` sees the DOM directly, so this
 * settles on the real transition rather than burning a fixed interval.
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
    fixture.detectChanges();
    await fixture.whenStable();
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
    const popover = await loader.getHarness(PopoverHarness.with({ triggerText: 'Details' }));

    expect(await popover.getTriggerText()).toBe('Details');
    expect(await popover.isOpen()).toBe(false);
    expect(await popover.getText()).toBeNull();
  });

  it('opens, exposes its content, and closes', async () => {
    const popover = await loader.getHarness(PopoverHarness.with({ triggerText: 'Details' }));

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
    const popover = await loader.getHarness(PopoverHarness.with({ triggerText: 'Details' }));

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
    const details = await loader.getHarness(PopoverHarness.with({ triggerText: 'Details' }));
    const help = await loader.getHarness(PopoverHarness.with({ triggerText: 'Help' }));

    await details.open();
    await settleOpen();

    expect(await details.getText()).toBe('Shipping in 2 days');
    // A popover IS open in the document; `aria-controls` scoping keeps the other
    // trigger from claiming it.
    expect(await help.isOpen()).toBe(false);
    expect(await help.getText()).toBeNull();
  });

  it('reports arrow presence and absence', async () => {
    const popover = await loader.getHarness(PopoverHarness.with({ triggerText: 'Details' }));

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
    expect(await loader.getAllHarnesses(PopoverHarness)).toHaveLength(2);
    expect(await loader.getAllHarnesses(PopoverHarness.with({ triggerText: 'Nope' }))).toHaveLength(
      0,
    );
  });
});
