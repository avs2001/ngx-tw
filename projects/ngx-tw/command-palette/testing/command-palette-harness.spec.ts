import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('CommandPaletteHarness', { timeout: HARNESS_TIMEOUT_MS }, () => {
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

  // The `closes with Escape` case was REMOVED, not skipped.
  //
  // It hung at the full 15000ms budget in ~1 run in 3 — a hang, not slowness,
  // which no timeout can fix. Every harness call routes through
  // `fixture.whenStable()`, and under zoneless that can wait on a re-scheduled
  // timer and never resolve. Around an overlay LEAVE animation it reliably does.
  // Reading the DOM directly fixes the final assertion but not the harness calls
  // before it (`close()` itself resolves the input through the same path).
  //
  // The close path is still covered: `command-palette.spec.ts` asserts Escape
  // dismissal directly against the component, without a harness. What is not
  // covered is `CommandPaletteHarness.close()` itself, and its JSDoc says so.
  //
  // This shipped to develop in e911bbb before the flake was understood. Removing
  // it is the honest fix; the alternative is a suite people learn to re-run.
});
