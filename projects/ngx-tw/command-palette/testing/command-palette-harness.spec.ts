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

  it('closes with Escape', async () => {
    const palette = await openPalette();
    expect(await palette.isOpen()).toBe(true);

    await palette.close();
    // A plain timer, deliberately not a poll through the harness: harness calls
    // route through `whenStable()`, which can hang rather than resolve.
    // 120ms is the component's leave animation; 250 gives it margin.
    await new Promise((resolve) => setTimeout(resolve, 250));
    fixture.detectChanges();

    expect(await palette.isOpen()).toBe(false);
  });
});
