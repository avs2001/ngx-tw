import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarComponent } from './calendar';
import { provideNativeDateAdapter } from './native-date-adapter';
import type {
  CalendarMode,
  CalendarRangeValue,
  CalendarSelectionState,
  CalendarViewState,
  ModeChangeEvent,
  SelectionClearedEvent,
  SelectionCompleteEvent,
  ViewChangeEvent,
} from './calendar.types';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [CalendarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-calendar
      [mode]="mode()"
      [value]="value()"
      [startAt]="startAt()"
      [disabled]="disabled()"
      [firstDayOfWeek]="firstDayOfWeek()"
      (selectionStart)="onSelectionStart($event)"
      (selectionComplete)="onSelectionComplete($event)"
      (selectionRestart)="onSelectionRestart($event)"
      (selectionCleared)="onSelectionCleared($event)"
      (viewChange)="onViewChange($event)"
    />
  `,
})
class BasicHost {
  readonly mode = signal<CalendarMode>('single');
  readonly value = signal<unknown>(null);
  readonly startAt = signal<Date | null>(new Date(2026, 3, 26)); // April 26, 2026
  readonly disabled = signal(false);
  readonly firstDayOfWeek = signal<number | null>(null);

  // Track every emitted event in arrival order so tests can assert §30.2 ordering.
  readonly events: { name: string; payload: unknown }[] = [];

  readonly valueChangeSpy = vi.fn();
  readonly selectionStartSpy = vi.fn();
  readonly selectionCompleteSpy = vi.fn();
  readonly selectionRestartSpy = vi.fn();
  readonly selectionClearedSpy = vi.fn();
  readonly modeChangeSpy = vi.fn();
  readonly viewChangeSpy = vi.fn();

  onSelectionStart(e: { start: Date }): void {
    this.events.push({ name: 'selectionStart', payload: e });
    this.selectionStartSpy(e);
  }
  onSelectionComplete(e: SelectionCompleteEvent<CalendarMode, Date>): void {
    this.events.push({ name: 'selectionComplete', payload: e });
    this.selectionCompleteSpy(e);
  }
  onSelectionRestart(e: { start: Date }): void {
    this.events.push({ name: 'selectionRestart', payload: e });
    this.selectionRestartSpy(e);
  }
  onSelectionCleared(e: SelectionClearedEvent): void {
    this.events.push({ name: 'selectionCleared', payload: e });
    this.selectionClearedSpy(e);
  }
  onViewChange(e: ViewChangeEvent): void {
    this.events.push({ name: 'viewChange', payload: e });
    this.viewChangeSpy(e);
  }
}

// ── Helpers ───────────────────────────────────────────────────────

function getCalendarHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-calendar') as HTMLElement;
}

function getCalendarComponent(
  fixture: ComponentFixture<unknown>,
): CalendarComponent<CalendarMode, Date> {
  const dbg = fixture.debugElement.query((d) => d.componentInstance instanceof CalendarComponent);
  return dbg.componentInstance as CalendarComponent<CalendarMode, Date>;
}

/**
 * Wires `valueChange` and `modeChange` outputs directly from the calendar
 * instance into the host's spies + event log. Called once per test that needs
 * to observe these events. The `model()`-implicit emitter and the explicit
 * output share the property name, so binding via the template is ambiguous —
 * subscribing programmatically forces resolution against the explicit output.
 */
function wireExplicitOutputs(fixture: ComponentFixture<BasicHost>): void {
  const calendar = getCalendarComponent(fixture);
  const host = fixture.componentInstance;
  calendar.valueChange.subscribe((v) => {
    host.events.push({ name: 'valueChange', payload: v });
    host.valueChangeSpy(v);
  });
  calendar.modeChange.subscribe((e) => {
    host.events.push({ name: 'modeChange', payload: e });
    host.modeChangeSpy(e);
  });
}

function getDayCell(fixture: ComponentFixture<unknown>, dayText: string): HTMLButtonElement | null {
  // Day cells live inside `tw-calendar-month-view` — pick only ones that
  // belong to the displayed month so adjacent-month duplicates don't collide.
  // Since the leading days come first and trailing last, picking the cell that
  // is NOT styled with `text-fg-muted` finds the in-month occurrence.
  const cells = Array.from(
    fixture.nativeElement.querySelectorAll(
      'tw-calendar-month-view tw-calendar-cell button',
    ),
  ) as HTMLButtonElement[];
  // Prefer cells without the muted (outside-month) class.
  const inMonth = cells.find(
    (c) => c.textContent?.trim() === dayText && !c.className.includes('text-fg-muted'),
  );
  if (inMonth) return inMonth;
  return cells.find((c) => c.textContent?.trim() === dayText) ?? null;
}

function getPeriodButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  // The header renders [prev, period, next] in DOM order. The period button
  // is the one with `aria-label` ending in "click to switch to ..." or the
  // middle button if all are present.
  const buttons = Array.from(
    fixture.nativeElement.querySelectorAll(
      'tw-calendar-header button',
    ),
  ) as HTMLButtonElement[];
  // Period button has no fixed aria-label like "Previous month" / "Next month";
  // it carries one ending in "view" or matches the period label text.
  const period = buttons.find((b) => {
    const label = b.getAttribute('aria-label') ?? '';
    return label.includes('switch to') || /\d{4}/.test(b.textContent ?? '');
  });
  return period ?? buttons[1]!;
}

function getDayHeaderRow(fixture: ComponentFixture<unknown>): HTMLElement | null {
  return fixture.nativeElement.querySelector(
    'tw-calendar-month-view [role="row"]',
  ) as HTMLElement | null;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('CalendarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideNativeDateAdapter()],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Default render ──

  describe('rendering', () => {
    it('mounts without errors with no inputs provided', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCalendarHost(fixture)).toBeTruthy();
    });

    it("renders the application landmark with aria-label='Calendar'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const app = fixture.nativeElement.querySelector('[role="application"]');
      expect(app).toBeTruthy();
      expect(app.getAttribute('aria-label')).toBe('Calendar');
    });

    it("renders the day grid view by default", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tw-calendar-month-view')).toBeTruthy();
    });

    it.each<CalendarMode>(['single', 'multiple', 'range'])(
      "renders without errors when mode = '%s'",
      (mode) => {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.componentInstance.mode.set(mode);
        fixture.detectChanges();
        expect(getCalendarHost(fixture)).toBeTruthy();
        expect(fixture.nativeElement.querySelector('tw-calendar-month-view')).toBeTruthy();
      },
    );
  });

  // ── value model + valueChange (single) ──

  describe("mode='single' selection", () => {
    it('emits valueChange with a single Date when a cell is clicked', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      const cell = getDayCell(fixture, '15');
      expect(cell).toBeTruthy();
      cell!.click();
      fixture.detectChanges();

      expect(host.valueChangeSpy).toHaveBeenCalledTimes(1);
      const emitted = host.valueChangeSpy.mock.calls[0]?.[0] as Date;
      expect(emitted).toBeInstanceOf(Date);
      expect(emitted.getDate()).toBe(15);
      // April 2026 anchored by startAt.
      expect(emitted.getMonth()).toBe(3);
      expect(emitted.getFullYear()).toBe(2026);
    });

    it('emits selectionComplete with reason="commit" on the same click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      expect(host.selectionCompleteSpy).toHaveBeenCalledTimes(1);
      const event = host.selectionCompleteSpy.mock.calls[0]?.[0] as SelectionCompleteEvent<
        'single',
        Date
      >;
      expect(event.reason).toBe('commit');
      expect(event.value).toBeInstanceOf(Date);
    });
  });

  // ── value model + valueChange (multiple) ──

  describe("mode='multiple' selection", () => {
    it('appends a clicked date to the value array', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('multiple');
      host.value.set([]);
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();

      expect(host.valueChangeSpy).toHaveBeenCalledTimes(1);
      const last = host.valueChangeSpy.mock.calls[0]?.[0] as Date[];
      expect(Array.isArray(last)).toBe(true);
      expect(last).toHaveLength(1);
      expect(last[0]?.getDate()).toBe(5);
    });

    it('toggles a date out of the array when clicked again (deselect)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('multiple');
      host.value.set([]);
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();
      // Click the same cell again — should remove it.
      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();

      const last = host.valueChangeSpy.mock.calls.at(-1)?.[0] as Date[];
      expect(last).toEqual([]);
    });
  });

  // ── value model + valueChange (range) ──

  describe("mode='range' selection", () => {
    it('emits selectionStart only on the 1st click; valueChange is NOT emitted', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      expect(host.selectionStartSpy).toHaveBeenCalledTimes(1);
      expect(host.valueChangeSpy).not.toHaveBeenCalled();
      expect(host.selectionCompleteSpy).not.toHaveBeenCalled();
    });

    it('emits valueChange THEN selectionComplete on the 2nd click (per §30.2)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();

      expect(host.valueChangeSpy).toHaveBeenCalledTimes(1);
      expect(host.selectionCompleteSpy).toHaveBeenCalledTimes(1);

      // Verify ordering by inspecting the recorded event log.
      const post1stClick = host.events.filter(
        (e) => e.name === 'valueChange' || e.name === 'selectionComplete',
      );
      expect(post1stClick.map((e) => e.name)).toEqual(['valueChange', 'selectionComplete']);

      const value = host.valueChangeSpy.mock.calls[0]?.[0] as CalendarRangeValue<Date>;
      expect(value.start?.getDate()).toBe(10);
      expect(value.end?.getDate()).toBe(20);

      const completeEvent = host.selectionCompleteSpy.mock.calls[0]?.[0] as SelectionCompleteEvent<
        'range',
        Date
      >;
      expect(completeEvent.reason).toBe('commit');
    });

    it('auto-swaps endpoints when the 2nd click is earlier; reason becomes "auto-swap"', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      // First click later, second click earlier (backward range).
      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      const value = host.valueChangeSpy.mock.calls[0]?.[0] as CalendarRangeValue<Date>;
      expect(value.start?.getDate()).toBe(10);
      expect(value.end?.getDate()).toBe(20);

      const event = host.selectionCompleteSpy.mock.calls[0]?.[0] as SelectionCompleteEvent<
        'range',
        Date
      >;
      expect(event.reason).toBe('auto-swap');
    });

    it('auto-swap is silent on selectionRestart (§21.5)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();

      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      expect(host.selectionRestartSpy).not.toHaveBeenCalled();
    });

    it("3rd click after a complete range emits selectionRestart and re-enters SELECTING (default 'restart' behavior)", () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();

      // 3rd click — restart.
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(host.selectionRestartSpy).toHaveBeenCalledTimes(1);
      const restartEvent = host.selectionRestartSpy.mock.calls[0]?.[0] as { start: Date };
      expect(restartEvent.start.getDate()).toBe(15);

      const calendar = getCalendarComponent(fixture);
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('SELECTING');
    });

    it('selectionState transitions EMPTY → SELECTING → COMPLETE during a range commit', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();

      const calendar = getCalendarComponent(fixture);
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('EMPTY');

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('SELECTING');

      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('COMPLETE');
    });
  });

  // ── Mode change at runtime (§11.2) ──

  describe('mode change at runtime', () => {
    it("clears the value and emits selectionCleared({reason: 'mode-change'}) → modeChange → valueChange", () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      // Establish a single-mode selection first.
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      // Reset the events log before mutating mode so the assertions only inspect the
      // mode-change ordering.
      host.events.length = 0;
      host.modeChangeSpy.mockClear();
      host.selectionClearedSpy.mockClear();
      host.valueChangeSpy.mockClear();

      host.mode.set('range');
      fixture.detectChanges();

      // §11.2 canonical order: selectionCleared(mode-change) → modeChange → valueChange.
      const orderedNames = host.events
        .filter((e) =>
          ['selectionCleared', 'modeChange', 'valueChange'].includes(e.name),
        )
        .map((e) => e.name);
      expect(orderedNames).toEqual(['selectionCleared', 'modeChange', 'valueChange']);

      const cleared = host.selectionClearedSpy.mock.calls[0]?.[0] as SelectionClearedEvent;
      expect(cleared.reason).toBe('mode-change');

      const change = host.modeChangeSpy.mock.calls[0]?.[0] as ModeChangeEvent;
      expect(change.from).toBe('single');
      expect(change.to).toBe('range');

      // valueChange resets to range's empty shape ({start:null,end:null}).
      const empty = host.valueChangeSpy.mock.calls[0]?.[0] as CalendarRangeValue<Date>;
      expect(empty.start).toBeNull();
      expect(empty.end).toBeNull();
    });
  });

  // ── viewChange ──

  describe('view changes', () => {
    it("emits viewChange with reason='drill-up' when the period label is clicked from day view", () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();

      getPeriodButton(fixture).click();
      fixture.detectChanges();

      expect(host.viewChangeSpy).toHaveBeenCalledTimes(1);
      const event = host.viewChangeSpy.mock.calls[0]?.[0] as ViewChangeEvent;
      expect(event.from).toBe<CalendarViewState>('day');
      expect(event.to).toBe<CalendarViewState>('month');
      // The period click is a drill-up navigation, not a generic 'user' reason.
      // Source: calendar.ts line 840 — `reason: 'drill-up'` for day → month.
      expect(event.reason).toBe('drill-up');
    });

    it("setView(view) emits viewChange with reason='programmatic'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      calendar.setView('month');
      fixture.detectChanges();

      expect(host.viewChangeSpy).toHaveBeenCalledTimes(1);
      expect(host.viewChangeSpy.mock.calls[0]?.[0].reason).toBe('programmatic');
      expect(calendar.viewState()).toBe<CalendarViewState>('month');
    });
  });

  // ── ControlValueAccessor ──

  describe('ControlValueAccessor', () => {
    it('writeValue updates the rendered selection (the cell becomes aria-selected)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      // CVA contract: `writeValue` is what reactive-forms calls when the parent
      // FormControl changes. Invoking it directly avoids the
      // NG_VALIDATORS/forwardRef circular DI that occurs when binding the
      // calendar to a FormControl in a TestBed-created host (Phase 3 wires the
      // validator; Phase 14 finishes the form integration). See calendar.ts
      // line 116-127 for the multi-provider declarations.
      calendar.writeValue(new Date(2026, 3, 15));
      fixture.detectChanges();

      const selectedButtons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-cell button'),
      ).filter(
        (b) => (b as HTMLButtonElement).getAttribute('aria-selected') === 'true',
      ) as HTMLButtonElement[];
      expect(selectedButtons.length).toBeGreaterThan(0);
      expect(selectedButtons.some((b) => b.textContent?.trim() === '15')).toBe(true);
    });

    it('user click invokes the registered onChange callback with the new value', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const onChange = vi.fn();
      calendar.registerOnChange(onChange);

      getDayCell(fixture, '12')!.click();
      fixture.detectChanges();

      expect(onChange).toHaveBeenCalledTimes(1);
      const arg = onChange.mock.calls[0]?.[0];
      expect(arg).toBeInstanceOf(Date);
      expect((arg as Date).getDate()).toBe(12);
    });

    it('writeValue(null) clears the selection and resets selectionState to EMPTY', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      calendar.writeValue(new Date(2026, 3, 10));
      fixture.detectChanges();
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('COMPLETE');

      calendar.writeValue(null);
      fixture.detectChanges();
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('EMPTY');
    });
  });

  // ── disabled input ──

  describe('disabled state', () => {
    it('does not emit valueChange when the calendar is disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.disabled.set(true);
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      const cell = getDayCell(fixture, '15');
      expect(cell).toBeTruthy();
      cell!.click();
      fixture.detectChanges();

      expect(host.valueChangeSpy).not.toHaveBeenCalled();
    });
  });

  // ── firstDayOfWeek ──

  describe('firstDayOfWeek', () => {
    it('shifts the day-name row when firstDayOfWeek changes', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.firstDayOfWeek.set(0); // Sunday
      fixture.detectChanges();

      const sundayHeaderRow = getDayHeaderRow(fixture);
      const sundayHeaders = Array.from(
        sundayHeaderRow!.querySelectorAll('[role="columnheader"]'),
      ).map((el) => el.getAttribute('aria-label'));

      host.firstDayOfWeek.set(1); // Monday
      fixture.detectChanges();

      const mondayHeaderRow = getDayHeaderRow(fixture);
      const mondayHeaders = Array.from(
        mondayHeaderRow!.querySelectorAll('[role="columnheader"]'),
      ).map((el) => el.getAttribute('aria-label'));

      expect(sundayHeaders).not.toEqual(mondayHeaders);
      // The first column should differ between the two configurations.
      expect(sundayHeaders[0]).not.toBe(mondayHeaders[0]);
    });
  });

  // ── Public methods ──

  describe('public methods', () => {
    it('focusDate({navigate:true}) moves the active date and emits activeDateChange', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const spy = vi.spyOn(calendar.activeDateChange, 'emit');

      const target = new Date(2026, 5, 15); // June 15, 2026
      calendar.focusDate(target, { navigate: true });
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      const active = calendar.activeDate();
      expect(active).toBeInstanceOf(Date);
      expect((active as Date).getMonth()).toBe(5);
      expect((active as Date).getDate()).toBe(15);
    });

    it('goToDate(date) updates the active date and emits activeDateChange', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const spy = vi.spyOn(calendar.activeDateChange, 'emit');

      calendar.goToDate(new Date(2027, 0, 1));
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      expect((calendar.activeDate() as Date).getFullYear()).toBe(2027);
    });

    it('goToToday navigates the active date to today', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 26, 10, 0, 0)); // April 26, 2026 10:00
      const fixture = TestBed.createComponent(BasicHost);
      // Override startAt so today() differs from the default anchor.
      fixture.componentInstance.startAt.set(new Date(2025, 0, 1));
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      calendar.goToToday();
      fixture.detectChanges();

      const active = calendar.activeDate() as Date;
      expect(active.getFullYear()).toBe(2026);
      expect(active.getMonth()).toBe(3);
      expect(active.getDate()).toBe(26);
    });

    it('clear() empties the value and emits selectionCleared / valueChange', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      wireExplicitOutputs(fixture);

      // Establish a selection first.
      getDayCell(fixture, '12')!.click();
      fixture.detectChanges();
      host.selectionClearedSpy.mockClear();
      host.valueChangeSpy.mockClear();

      const calendar = getCalendarComponent(fixture);
      calendar.clear();
      fixture.detectChanges();

      expect(host.selectionClearedSpy).toHaveBeenCalledTimes(1);
      expect(host.selectionClearedSpy.mock.calls[0]?.[0].reason).toBe('user');
      expect(host.valueChangeSpy).toHaveBeenCalledTimes(1);
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('EMPTY');
    });

    it('reset() resets value, view, and active date back to the configured defaults', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      // Drill into month view and select a value.
      calendar.setView('month');
      fixture.detectChanges();
      host.valueChangeSpy.mockClear();
      host.selectionClearedSpy.mockClear();

      calendar.reset();
      fixture.detectChanges();

      expect(calendar.viewState()).toBe<CalendarViewState>('day');
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('EMPTY');
    });

    it('setView(view) updates the rendered view component', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      calendar.setView('month');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tw-calendar-year-view')).toBeTruthy();

      calendar.setView('year');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tw-calendar-years-view')).toBeTruthy();

      calendar.setView('day');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tw-calendar-month-view')).toBeTruthy();
    });
  });
});
