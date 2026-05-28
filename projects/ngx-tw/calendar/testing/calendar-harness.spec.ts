import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { type HarnessLoader } from '@angular/cdk/testing';
import { CalendarComponent } from '../calendar';
import { provideNativeDateAdapter } from '../native-date-adapter';
import type { CalendarMode } from '../calendar.types';
import { CalendarHarness } from './calendar-harness';

@Component({
  imports: [CalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-calendar
      [mode]="mode()"
      [value]="value()"
      [startAt]="startAt()"
      [disabled]="disabled()"
    />
  `,
})
class Host {
  readonly mode = signal<CalendarMode>('single');
  readonly value = signal<unknown>(null);
  readonly startAt = signal<Date | null>(new Date(2026, 3, 26)); // April 26, 2026
  readonly disabled = signal(false);
}

describe('CalendarHarness', () => {
  let fixture: ComponentFixture<Host>;
  let loader: HarnessLoader;
  let harness: CalendarHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideNativeDateAdapter()],
    });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
    harness = await loader.getHarness(CalendarHarness);
  });

  it('reports the period label for the current view', async () => {
    expect(await harness.getPeriodLabel()).toMatch(/April\s+2026/i);
  });

  it('navigates to previous and next pages', async () => {
    await harness.goToPreviousPage();
    fixture.detectChanges();
    expect(await harness.getPeriodLabel()).toMatch(/March\s+2026/i);
    await harness.goToNextPage();
    await harness.goToNextPage();
    fixture.detectChanges();
    expect(await harness.getPeriodLabel()).toMatch(/May\s+2026/i);
  });

  it('reports prev / next disabled state (both enabled by default)', async () => {
    expect(await harness.isPreviousDisabled()).toBe(false);
    expect(await harness.isNextDisabled()).toBe(false);
  });

  it('returns the current view', async () => {
    expect(await harness.getCurrentView()).toBe('day');
  });

  it('switches view up to month then to year', async () => {
    await harness.switchView();
    fixture.detectChanges();
    expect(await harness.getCurrentView()).toBe('month');
    await harness.switchView();
    fixture.detectChanges();
    expect(await harness.getCurrentView()).toBe('year');
  });

  it('switchView(target) reaches the requested view', async () => {
    await harness.switchView('year');
    fixture.detectChanges();
    expect(await harness.getCurrentView()).toBe('year');
  });

  it('returns cells for the current view', async () => {
    const cells = await harness.getCells();
    expect(cells.length).toBeGreaterThan(0);
  });

  it('selects a cell by its visible text', async () => {
    await harness.selectCell('15');
    fixture.detectChanges();
    const selected = await harness.getSelectedCells();
    expect(selected.length).toBe(1);
    expect(await selected[0]!.getText()).toBe('15');
  });

  it('throws when selecting a non-existent cell', async () => {
    await expect(harness.selectCell('does-not-exist')).rejects.toThrow();
  });

  it('returns today cell when the current view contains today', async () => {
    fixture.componentInstance.startAt.set(new Date());
    fixture.detectChanges();
    const today = await harness.getTodayCell();
    expect(today).not.toBeNull();
  });

  it('returns null today cell when today is not visible', async () => {
    // April 2026 — far from any conceivable "today" at runtime.
    expect(await harness.getTodayCell()).toBeNull();
  });

  it('reports isDisabled from aria-disabled on the host', async () => {
    expect(await harness.isDisabled()).toBe(false);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(await harness.isDisabled()).toBe(true);
  });

  it('selectRange clicks both endpoints in range mode', async () => {
    fixture.componentInstance.mode.set('range');
    fixture.detectChanges();
    harness = await loader.getHarness(CalendarHarness);
    await harness.selectRange('10', '15');
    fixture.detectChanges();
    const selected = await harness.getSelectedCells();
    expect(selected.length).toBeGreaterThanOrEqual(2);
  });
});
