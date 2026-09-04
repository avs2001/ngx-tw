import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { CommandPaletteComponent } from '../command-palette';
import type { CommandPaletteItem } from '../command-palette-tokens';
import { CommandPaletteHarness } from './command-palette-harness';

const COMMANDS: readonly CommandPaletteItem[] = [
  { id: 'cut', label: 'Cut', group: 'Clipboard' },
  { id: 'copy', label: 'Copy', group: 'Clipboard' },
  { id: 'paste', label: 'Paste', group: 'Clipboard', disabled: true },
  { id: 'settings', label: 'Settings', group: 'Application' },
];

@Component({
  imports: [CommandPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-command-palette
      [(open)]="isOpen"
      [commands]="commands"
      (itemSelected)="onSelected($event)"
    />
  `,
})
class HarnessHost {
  isOpen = signal(false);
  commands = COMMANDS;
  onSelected = vi.fn();
}

/**
 * The palette's overlay component. `role="dialog"` — what the harness resolves —
 * is rendered *inside* this element, so the two attach and detach together.
 *
 * Deliberately NOT `.tw-command-palette-panel`: that class sits on the CDK pane,
 * which `overlayRef.detach()` leaves in the document, so a poll on it could
 * never observe a close.
 */
const PANEL = 'tw-command-palette-overlay';

/**
 * Waits by reading `document` directly, never through the harness.
 *
 * The panel detaches behind the component's hard-coded 120 ms leave window, so a
 * test has to wait for something. The two things it must not be: a fixed sleep
 * (the deleted version of the Escape test slept 250 ms, which is a guess racing
 * a budget rather than a condition), or a poll on a *harness* method — every
 * `CommandPaletteHarness` call routes through `fixture.whenStable()`, and a
 * deadline checked *between* awaits cannot bound a single await that never
 * returns. `document.querySelector` needs no stabilization, so it can neither
 * hang nor burn a fixed interval.
 */
async function settleUntil(condition: () => boolean, what: string): Promise<void> {
  const deadline = Date.now() + 2000;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`command palette harness spec: timed out waiting for ${what}.`);
}

const settleOpen = () =>
  settleUntil(() => document.querySelector(PANEL) !== null, 'the palette to attach');
const settleClosed = () =>
  settleUntil(() => document.querySelector(PANEL) === null, 'the palette to detach');

describe('CommandPaletteHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // The ordinary fixture loader. The palette renders into the overlay
    // container, but the harness resolves it via `documentRootLocatorFactory()`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  // Six tests here open the palette and never close it. `settleClosed()` below
  // waits for the LAST `tw-command-palette-overlay` to leave the document, so a
  // panel surviving into the next test would make it time out for a reason that
  // has nothing to do with Escape. Same guard both newer harness specs carry.
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  /** Opens through the host's two-way `open` model, as a consumer would. */
  async function openPalette(): Promise<CommandPaletteHarness> {
    fixture.componentInstance.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return loader.getHarness(CommandPaletteHarness);
  }

  it('reports closed before it is opened', async () => {
    const palette = await loader.getHarness(CommandPaletteHarness);

    expect(await palette.isOpen()).toBe(false);
    expect(await palette.getItems()).toHaveLength(0);
    expect(await palette.getGroupLabels()).toEqual([]);
  });

  it('names its typing methods in the error when closed', async () => {
    const palette = await loader.getHarness(CommandPaletteHarness);

    // "Cannot read properties of null" would not say which call failed or why.
    await expect(palette.setQuery('cut')).rejects.toThrow(/palette is closed/i);
  });

  it('enumerates every result once open', async () => {
    const palette = await openPalette();

    expect(await palette.isOpen()).toBe(true);
    const items = await palette.getItems();
    expect(items).toHaveLength(4);
    expect(await items[0].getText()).toContain('Cut');
  });

  it('reports group headings in DOM order', async () => {
    const palette = await openPalette();

    expect(await palette.getGroupLabels()).toEqual(['Clipboard', 'Application']);
  });

  it('reports the disabled item', async () => {
    const palette = await openPalette();

    const disabled = await palette.getItems({ disabled: true });
    expect(disabled).toHaveLength(1);
    expect(await disabled[0].getText()).toContain('Paste');
  });

  it('filters results by query, and the set CHANGES', async () => {
    const palette = await openPalette();
    expect(await palette.getItems()).toHaveLength(4);

    await palette.setQuery('set');
    fixture.detectChanges();
    await fixture.whenStable();

    const filtered = await palette.getItems();
    expect(filtered).toHaveLength(1);
    expect(await filtered[0].getText()).toContain('Settings');
    expect(await palette.getQuery()).toBe('set');
  });

  it('resolves the active row through aria-activedescendant, not DOM focus', async () => {
    const palette = await openPalette();

    // DOM focus is on the search input the whole time — asserting on
    // document.activeElement here would report the input, never a row. This is
    // the single thing most likely to be got wrong about this component.
    const before = await palette.getActiveItemText();
    expect(before).not.toBeNull();

    await palette.pressArrowDown();
    fixture.detectChanges();
    await fixture.whenStable();

    const after = await palette.getActiveItemText();
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);

    // Exactly one row is active at a time.
    expect(await palette.getItems({ active: true })).toHaveLength(1);
  });

  it('activates a result by text', async () => {
    const palette = await openPalette();

    await palette.selectItem('Copy');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.onSelected).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.onSelected.mock.calls[0][0]).toMatchObject({
      id: 'copy',
    });
  });

  it('throws a named error rather than failing silently on an unknown result', async () => {
    const palette = await openPalette();

    await expect(palette.selectItem('Nonexistent')).rejects.toThrow(
      /no result matching/i,
    );
  });

  /**
   * The only coverage `CommandPaletteHarness.close()` has.
   *
   * Deleted in pass 7 (`28dd6a4`) as an overlay-leave-animation flake; restored
   * in pass 14, when the hang was root-caused to something else entirely — a
   * STARVED MACROTASK QUEUE. `@angular/build:unit-test` defaulted `isolate` to
   * `false`, so spec files shared a worker and a runaway microtask loop in one
   * file starved timers in the next; Angular's zoneless scheduler ticks off
   * `setTimeout`, so `whenStable()` could not resolve and every harness call
   * hung for the whole budget. `angular.json` now sets `"isolate": true` on both
   * test targets, and files that do not share a process cannot starve each other.
   *
   * `command-palette.spec.ts` covers Escape dismissal against the component; what
   * is covered *here* is that a consumer can drive it through the harness.
   */
  it('closes with Escape', async () => {
    const palette = await openPalette();
    await settleOpen();
    expect(await palette.isOpen()).toBe(true);
    // Exactly one panel, so the detach polled for below is this test's own.
    expect(document.querySelectorAll(PANEL).length).toBe(1);

    await palette.close();
    // `close()` resolves while the overlay is STILL ATTACHED — the component
    // defers the detach behind its 120 ms leave window — so the wait is the
    // caller's job, and its JSDoc says so.
    await settleClosed();

    expect(await palette.isOpen()).toBe(false);
    // The detach writes `false` back through the two-way `open` model, so the
    // consumer's binding is dismissed too, not just the DOM.
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });
});
