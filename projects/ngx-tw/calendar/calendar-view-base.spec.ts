import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { MonthViewComponent } from './month-view';
import { provideNativeDateAdapter } from './native-date-adapter';

// ── Test host ─────────────────────────────────────────────────────
//
// `CalendarViewBase` is abstract, so the roving-tabindex contract is exercised
// through `MonthViewComponent`, the view that owns the day grid.
//
// The host deliberately does NOT write `activeDateChange` back into
// `activeDate`. That one-way binding is what reproduces the defect: the roving
// cursor (`focusedCellValue`) advances while the displayed period is changed by
// some *other* route — the header's prev/next buttons, a programmatic
// `activeDate` assignment, a view switch — none of which call `focusCell()`.

@Component({
  imports: [MonthViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-calendar-month-view
      [activeDate]="activeDate()"
      [minDate]="minDate()"
      (activeDateChange)="onActiveDateChange($event)"
    />
  `,
})
class MonthViewHost {
  /** January 15, 2026. */
  readonly activeDate = signal(new Date(2026, 0, 15));
  readonly minDate = signal<Date | null>(null);

  readonly activeDateChangeSpy = vi.fn();

  onActiveDateChange(date: Date): void {
    this.activeDateChangeSpy(date);
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function cellButtons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('tw-calendar-cell button'),
  ) as HTMLButtonElement[];
}

function tabbableCells(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return cellButtons(fixture).filter((b) => b.getAttribute('tabindex') === '0');
}

function cellByText(
  fixture: ComponentFixture<unknown>,
  text: string,
): HTMLButtonElement | undefined {
  return cellButtons(fixture).find((b) => b.textContent?.trim() === text);
}

// ── Tests ─────────────────────────────────────────────────────────

describe('CalendarViewBase roving tabindex', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNativeDateAdapter()],
    });
  });

  it('exposes exactly one tabbable cell on first render', () => {
    const fixture = TestBed.createComponent(MonthViewHost);
    fixture.detectChanges();

    const tabbable = tabbableCells(fixture);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].textContent?.trim()).toBe('15');
  });

  // The SC 2.1.1 regression guard. Before the fix this rendered ZERO tabbable
  // cells: `focusedCellValue` still held the January date the keyboard had
  // moved to, no cell in the March grid matched it, and the whole grid dropped
  // out of the tab order with no way back in.
  it('keeps a tabbable cell after a period change that skips focusCell()', () => {
    const fixture = TestBed.createComponent(MonthViewHost);
    fixture.detectChanges();

    // Arrow-navigate so the view records a focused cell of its own.
    cellByText(fixture, '15')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.activeDateChangeSpy).toHaveBeenCalled();

    // Now change the displayed period WITHOUT routing through `focusCell()`.
    // March 2026 contains no January day, so the recorded cursor is stale.
    fixture.componentInstance.activeDate.set(new Date(2026, 2, 1));
    fixture.detectChanges();

    const tabbable = tabbableCells(fixture);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].textContent?.trim()).toBe('1');
  });

  it('still exposes a tabbable cell when the active date itself is disabled', () => {
    const fixture = TestBed.createComponent(MonthViewHost);
    // January 15 is the active date; bound out of range by minDate.
    fixture.componentInstance.minDate.set(new Date(2026, 0, 20));
    fixture.detectChanges();

    const tabbable = tabbableCells(fixture);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0].getAttribute('aria-disabled')).toBe('true');
  });

  // Pairs with the previous case: a roving cursor parked on a bounded date is
  // only coherent if that cell can actually take DOM focus, which a natively
  // disabled button cannot.
  it('lets the tabbable cell take focus even while disabled', () => {
    const fixture = TestBed.createComponent(MonthViewHost);
    fixture.componentInstance.minDate.set(new Date(2026, 0, 20));
    fixture.detectChanges();

    const target = tabbableCells(fixture)[0];
    target.focus();

    expect(document.activeElement).toBe(target);
  });
});
