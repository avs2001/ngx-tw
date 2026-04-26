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
  DateFilterFn,
  DisabledDates,
  ModeChangeEvent,
  RangePreviewEvent,
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

/** Returns the active (tabindex=0) day-cell button, used as the keyboard-focus anchor. */
function getActiveDayCell(fixture: ComponentFixture<unknown>): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(
    'tw-calendar-month-view tw-calendar-cell button[tabindex="0"]',
  ) as HTMLButtonElement | null;
}

/** Dispatches a `keydown` event with `key` on `target` and flushes change detection. */
function pressKey(
  fixture: ComponentFixture<unknown>,
  target: HTMLElement,
  key: string,
  init: KeyboardEventInit = {},
): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  fixture.detectChanges();
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

  // ── Date constraints (§10.1) ──
  //
  // The calendar is created standalone (not via a host) so that signal inputs
  // can be driven through `componentRef.setInput()` per CLAUDE.md §7.2. The
  // anchor (`startAt`) lands the day grid on April 2026 — a 7×6 grid where
  // April 1 is a Wednesday and April 30 is a Thursday. Disabled cells are
  // queried by their `aria-disabled="true"` attribute on the inner button.

  describe('date constraints', () => {
    /** Creates a `<tw-calendar>` fixture with `startAt = April 26, 2026` and the given mode. */
    function setupCalendar(mode: CalendarMode = 'single'): {
      fixture: ComponentFixture<CalendarComponent<CalendarMode, Date>>;
      calendar: CalendarComponent<CalendarMode, Date>;
    } {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', mode);
      fixture.detectChanges();
      return { fixture, calendar: fixture.componentInstance };
    }

    function getDayCellByText(
      fixture: ComponentFixture<unknown>,
      dayText: string,
    ): HTMLButtonElement | null {
      return getDayCell(fixture, dayText);
    }

    function isCellDisabled(button: HTMLButtonElement | null): boolean {
      if (!button) return false;
      return button.getAttribute('aria-disabled') === 'true' || button.disabled;
    }

    it('disables cells before minDate (single mode)', () => {
      const { fixture } = setupCalendar('single');
      // April 26, 2026 sits in the active month; disable everything before April 15.
      fixture.componentRef.setInput('minDate', new Date(2026, 3, 15));
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '14'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '10'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '15'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '20'))).toBe(false);
    });

    it('clicking a cell before minDate does not emit valueChange', () => {
      const { fixture, calendar } = setupCalendar('single');
      fixture.componentRef.setInput('minDate', new Date(2026, 3, 15));
      fixture.detectChanges();

      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      const before = getDayCellByText(fixture, '10');
      expect(before).toBeTruthy();
      before!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('disables cells after maxDate (single mode)', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('maxDate', new Date(2026, 3, 20));
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '21'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '30'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '20'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '15'))).toBe(false);
    });

    it('clicking a cell after maxDate does not emit valueChange', () => {
      const { fixture, calendar } = setupCalendar('single');
      fixture.componentRef.setInput('maxDate', new Date(2026, 3, 20));
      fixture.detectChanges();

      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      const after = getDayCellByText(fixture, '25');
      after!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('disables cells listed in disabledDates (array form)', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('disabledDates', [
        new Date(2026, 3, 10),
        new Date(2026, 3, 17),
      ]);
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '10'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '17'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '11'))).toBe(false);
    });

    it('disables cells where disabledDates predicate returns true', () => {
      const { fixture } = setupCalendar('single');
      const isDay7 = (d: Date): boolean => d.getDate() === 7;
      fixture.componentRef.setInput('disabledDates', isDay7);
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '7'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '8'))).toBe(false);
    });

    it('clicking a date in disabledDates does not emit valueChange', () => {
      const { fixture, calendar } = setupCalendar('single');
      fixture.componentRef.setInput('disabledDates', [new Date(2026, 3, 10)]);
      fixture.detectChanges();

      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      getDayCellByText(fixture, '10')!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('disables cells whose weekday is in disabledDaysOfWeek (weekends)', () => {
      const { fixture } = setupCalendar('single');
      // April 2026: Apr 4 = Sat, Apr 5 = Sun, Apr 11 = Sat, Apr 12 = Sun.
      fixture.componentRef.setInput('disabledDaysOfWeek', [0, 6]); // Sun + Sat
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '4'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '5'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '11'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '12'))).toBe(true);
      // Monday + Wednesday remain enabled.
      expect(isCellDisabled(getDayCellByText(fixture, '6'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '8'))).toBe(false);
    });

    it('clicking a weekend cell with disabledDaysOfWeek=[0,6] does not emit valueChange', () => {
      const { fixture, calendar } = setupCalendar('single');
      fixture.componentRef.setInput('disabledDaysOfWeek', [0, 6]);
      fixture.detectChanges();

      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      // April 4, 2026 is a Saturday.
      getDayCellByText(fixture, '4')!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('disables cells where the dateFilter predicate returns false', () => {
      const { fixture } = setupCalendar('single');
      // Block every odd-numbered day.
      const evenOnly: DateFilterFn<Date> = (d) => d.getDate() % 2 === 0;
      fixture.componentRef.setInput('dateFilter', evenOnly);
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '1'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '3'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '2'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '4'))).toBe(false);
    });

    it('clicking a cell rejected by dateFilter does not emit valueChange', () => {
      const { fixture, calendar } = setupCalendar('single');
      const evenOnly: DateFilterFn<Date> = (d) => d.getDate() % 2 === 0;
      fixture.componentRef.setInput('dateFilter', evenOnly);
      fixture.detectChanges();

      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      getDayCellByText(fixture, '7')!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('disables minDate-blocked cells in range mode (cannot start a range before minDate)', () => {
      const { fixture, calendar } = setupCalendar('range');
      fixture.componentRef.setInput('minDate', new Date(2026, 3, 15));
      fixture.detectChanges();

      const startSpy = vi.fn();
      calendar.selectionStart.subscribe(startSpy);

      // Cell 10 is before minDate — must be disabled and must NOT start a range.
      const before = getDayCellByText(fixture, '10');
      expect(isCellDisabled(before)).toBe(true);
      before!.click();
      fixture.detectChanges();

      expect(startSpy).not.toHaveBeenCalled();
    });

    it('disables maxDate-blocked cells in range mode (cannot complete a range past maxDate)', () => {
      const { fixture, calendar } = setupCalendar('range');
      // Allow start in early month, block any end past 20.
      fixture.componentRef.setInput('maxDate', new Date(2026, 3, 20));
      fixture.detectChanges();

      const completeSpy = vi.fn();
      calendar.selectionComplete.subscribe(completeSpy);

      // Start a range on the 15th (enabled), then attempt to commit on the 25th (disabled).
      getDayCellByText(fixture, '15')!.click();
      fixture.detectChanges();

      const after = getDayCellByText(fixture, '25');
      expect(isCellDisabled(after)).toBe(true);
      after!.click();
      fixture.detectChanges();

      expect(completeSpy).not.toHaveBeenCalled();
    });

    // `minRangeLength` / `maxRangeLength` per Phase 4 (§43): the v1 default is
    // permissive — invalid ranges still commit but `rangePreview.invalidPreview`
    // and validator codes flag the violation. The hardening hook
    // (`blockInvalidRangeCommit`) is a v1.1 placeholder. These tests document the
    // current behavior: the commit goes through, but `rangePreview` reports
    // `invalidPreview: true` while the user hovers a too-short / too-long range.

    it('range mode: emits rangePreview with invalidPreview=true while hovered range is shorter than minRangeLength', () => {
      const { fixture, calendar } = setupCalendar('range');
      fixture.componentRef.setInput('minRangeLength', 5);
      fixture.detectChanges();

      const previewSpy = vi.fn();
      calendar.rangePreview.subscribe(previewSpy);

      // 1st click — start at the 10th (no rangePreview emitted yet — needs end).
      getDayCellByText(fixture, '10')!.click();
      fixture.detectChanges();

      // Hover the 12th (range = 10..12, length = 3 days, < min of 5).
      const hoverTarget = getDayCellByText(fixture, '12');
      hoverTarget!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      expect(previewSpy).toHaveBeenCalled();
      const lastCall = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(lastCall.invalidPreview).toBe(true);
    });

    it('range mode: emits rangePreview with invalidPreview=false when hovered range satisfies minRangeLength', () => {
      const { fixture, calendar } = setupCalendar('range');
      fixture.componentRef.setInput('minRangeLength', 3);
      fixture.detectChanges();

      const previewSpy = vi.fn();
      calendar.rangePreview.subscribe(previewSpy);

      getDayCellByText(fixture, '10')!.click();
      fixture.detectChanges();

      // 10..15 = 6 days >= min of 3.
      getDayCellByText(fixture, '15')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      const lastCall = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(lastCall.invalidPreview).toBe(false);
    });

    it('range mode: emits rangePreview with invalidPreview=true while hovered range exceeds maxRangeLength', () => {
      const { fixture, calendar } = setupCalendar('range');
      fixture.componentRef.setInput('maxRangeLength', 3);
      fixture.detectChanges();

      const previewSpy = vi.fn();
      calendar.rangePreview.subscribe(previewSpy);

      getDayCellByText(fixture, '10')!.click();
      fixture.detectChanges();

      // 10..20 = 11 days > max of 3.
      getDayCellByText(fixture, '20')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      const lastCall = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(lastCall.invalidPreview).toBe(true);
    });
  });

  // ── Consolidated `constraints` shorthand (§10.1) ──
  //
  // Mirrors the individual-input suite above but feeds every constraint via the
  // shorthand `constraints` object input. Both forms are first-class — and an
  // individual input non-null value wins over the same field inside the
  // shorthand object, so a consumer can pass a base preset and override one
  // field per call site.

  describe('constraints input (consolidated)', () => {
    function setupCalendar(mode: CalendarMode = 'single'): {
      fixture: ComponentFixture<CalendarComponent<CalendarMode, Date>>;
      calendar: CalendarComponent<CalendarMode, Date>;
    } {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', mode);
      fixture.detectChanges();
      return { fixture, calendar: fixture.componentInstance };
    }

    function getDayCellByText(
      fixture: ComponentFixture<unknown>,
      dayText: string,
    ): HTMLButtonElement | null {
      return getDayCell(fixture, dayText);
    }

    function isCellDisabled(button: HTMLButtonElement | null): boolean {
      if (!button) return false;
      return button.getAttribute('aria-disabled') === 'true' || button.disabled;
    }

    it('disables cells before constraints.minDate', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('constraints', { minDate: new Date(2026, 3, 15) });
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '14'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '10'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '15'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '20'))).toBe(false);
    });

    it('disables cells after constraints.maxDate', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('constraints', { maxDate: new Date(2026, 3, 20) });
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '21'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '30'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '20'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '15'))).toBe(false);
    });

    it('disables specific dates when supplied via constraints.disabledDates (array form)', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('constraints', {
        disabledDates: [new Date(2026, 3, 10), new Date(2026, 3, 17)],
      });
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '10'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '17'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '11'))).toBe(false);
    });

    it('disables weekends when supplied via constraints.disabledDaysOfWeek=[0,6]', () => {
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('constraints', { disabledDaysOfWeek: [0, 6] });
      fixture.detectChanges();

      // April 2026: Apr 4 = Sat, Apr 5 = Sun, Apr 11 = Sat, Apr 12 = Sun.
      expect(isCellDisabled(getDayCellByText(fixture, '4'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '5'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '11'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '12'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '6'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '8'))).toBe(false);
    });

    it('disables filtered cells when supplied via constraints.dateFilter', () => {
      const { fixture } = setupCalendar('single');
      const evenOnly: DateFilterFn<Date> = (d) => d.getDate() % 2 === 0;
      fixture.componentRef.setInput('constraints', { dateFilter: evenOnly });
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '1'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '3'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '2'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '4'))).toBe(false);
    });

    it('individual minDate input wins when both [constraints] and [minDate] are set', () => {
      // `constraints.minDate` would block dates before April 5.
      // The individual `minDate` input raises the floor to April 20. Cells
      // between April 5–19 must remain disabled because the individual input wins.
      const { fixture } = setupCalendar('single');
      fixture.componentRef.setInput('constraints', { minDate: new Date(2026, 3, 5) });
      fixture.componentRef.setInput('minDate', new Date(2026, 3, 20));
      fixture.detectChanges();

      expect(isCellDisabled(getDayCellByText(fixture, '6'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '15'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '19'))).toBe(true);
      expect(isCellDisabled(getDayCellByText(fixture, '20'))).toBe(false);
      expect(isCellDisabled(getDayCellByText(fixture, '25'))).toBe(false);
    });

    it('enforces every field when constraints supplies all five at once', () => {
      const { fixture } = setupCalendar('single');
      const evenOnly: DateFilterFn<Date> = (d) => d.getDate() % 2 === 0;
      fixture.componentRef.setInput('constraints', {
        minDate: new Date(2026, 3, 2),
        maxDate: new Date(2026, 3, 28),
        disabledDates: [new Date(2026, 3, 10)],
        disabledDaysOfWeek: [0, 6], // Sat + Sun
        dateFilter: evenOnly, // odd days disabled
      });
      fixture.detectChanges();

      // minDate boundary (Apr 1 < 2 is disabled).
      expect(isCellDisabled(getDayCellByText(fixture, '1'))).toBe(true);
      // maxDate boundary (Apr 30 > 28 is disabled).
      expect(isCellDisabled(getDayCellByText(fixture, '30'))).toBe(true);
      // disabledDates entry.
      expect(isCellDisabled(getDayCellByText(fixture, '10'))).toBe(true);
      // disabledDaysOfWeek — Apr 4 is Saturday.
      expect(isCellDisabled(getDayCellByText(fixture, '4'))).toBe(true);
      // dateFilter — Apr 7 is odd.
      expect(isCellDisabled(getDayCellByText(fixture, '7'))).toBe(true);
      // Apr 8 satisfies every constraint (even, weekday, in range, not disabled).
      expect(isCellDisabled(getDayCellByText(fixture, '8'))).toBe(false);
    });
  });

  // ── Keyboard navigation (month view, §16) ──
  //
  // Keyboard events are dispatched on the active cell button (the one with
  // tabindex=0). After each key press the harness checks the new active cell
  // by reading the tabindex=0 button's text content. The active date carries
  // through the orchestrator's `activeDateChange` output, which we also assert.

  describe('keyboard navigation (month view)', () => {
    it('ArrowRight moves focus to the next day', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const activeSpy = vi.fn();
      calendar.activeDateChange.subscribe(activeSpy);

      const active = getActiveDayCell(fixture);
      expect(active?.textContent?.trim()).toBe('26');

      pressKey(fixture, active!, 'ArrowRight');

      const newActive = getActiveDayCell(fixture);
      expect(newActive?.textContent?.trim()).toBe('27');
      expect(activeSpy).toHaveBeenCalledTimes(1);
      const emitted = activeSpy.mock.calls[0]?.[0] as Date;
      expect(emitted.getDate()).toBe(27);
    });

    it('ArrowLeft moves focus to the previous day', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'ArrowLeft');

      const newActive = getActiveDayCell(fixture);
      expect(newActive?.textContent?.trim()).toBe('25');
    });

    it('ArrowDown moves focus down one week (+7 days)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'ArrowDown');

      // April 26 + 7 = May 3, but May 3 is in the trailing week of the April grid.
      const newActive = getActiveDayCell(fixture);
      // The compare value advances 7 days; verify by querying the active cell text.
      expect(newActive?.textContent?.trim()).toBe('3');
    });

    it('ArrowUp moves focus up one week (-7 days)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'ArrowUp');

      // April 26 - 7 = April 19.
      const newActive = getActiveDayCell(fixture);
      expect(newActive?.textContent?.trim()).toBe('19');
    });

    it('Home moves focus to the first day of the current week', () => {
      const fixture = TestBed.createComponent(BasicHost);
      // Force firstDayOfWeek=0 (Sunday) for predictable home/end behavior.
      fixture.componentInstance.firstDayOfWeek.set(0);
      fixture.detectChanges();

      // April 26, 2026 is a Sunday — pressing Home with firstDayOfWeek=0 stays
      // on Sunday. Move to a Tuesday first then press Home.
      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'ArrowRight'); // 27 (Mon)
      pressKey(fixture, getActiveDayCell(fixture)!, 'ArrowRight'); // 28 (Tue)

      pressKey(fixture, getActiveDayCell(fixture)!, 'Home');

      // Home from Tue should land on the Sunday of that week (April 26).
      expect(getActiveDayCell(fixture)?.textContent?.trim()).toBe('26');
    });

    it('End moves focus to the last day of the current week', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.firstDayOfWeek.set(0);
      fixture.detectChanges();

      // From Sunday April 26, End lands on Saturday May 2.
      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'End');

      expect(getActiveDayCell(fixture)?.textContent?.trim()).toBe('2');
    });

    it('PageDown advances to the next month', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'PageDown');

      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(4); // May
      expect(activeDate.getDate()).toBe(26);
    });

    it('PageUp moves back to the previous month', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'PageUp');

      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(2); // March
      expect(activeDate.getDate()).toBe(26);
    });

    it('Enter on the focused cell selects it and emits valueChange', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'Enter');

      expect(valueSpy).toHaveBeenCalledTimes(1);
      const emitted = valueSpy.mock.calls[0]?.[0] as Date;
      expect(emitted).toBeInstanceOf(Date);
      expect(emitted.getDate()).toBe(26);
    });

    it('Space on the focused cell selects it and emits valueChange', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, ' ');

      expect(valueSpy).toHaveBeenCalledTimes(1);
      expect((valueSpy.mock.calls[0]?.[0] as Date).getDate()).toBe(26);
    });

    it('Enter on a disabled cell does not emit valueChange', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      // Disable the active anchor (April 26) via dateFilter.
      const filter: DateFilterFn<Date> = (d) => d.getDate() !== 26;
      fixture.componentRef.setInput('dateFilter', filter);
      fixture.detectChanges();

      const valueSpy = vi.fn();
      fixture.componentInstance.valueChange.subscribe(valueSpy);

      const active = fixture.nativeElement.querySelector(
        'tw-calendar-month-view tw-calendar-cell button[tabindex="0"]',
      ) as HTMLButtonElement | null;
      expect(active).toBeTruthy();
      // Disabled buttons natively swallow Enter, but the cell guards regardless;
      // dispatch on the host span (the wrapper around the button) to bypass the
      // native disabled gate and verify the calendar's own check.
      pressKey(fixture, active!, 'Enter');

      expect(valueSpy).not.toHaveBeenCalled();
    });
  });

  // ── ControlValueAccessor.setDisabledState ──

  describe('ControlValueAccessor.setDisabledState', () => {
    it('setDisabledState(true) sets aria-disabled on the calendar host', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      calendar.setDisabledState(true);
      fixture.detectChanges();

      const host = getCalendarHost(fixture);
      expect(host.getAttribute('aria-disabled')).toBe('true');
    });

    it('setDisabledState(true) blocks click selections (no valueChange emitted)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      calendar.setDisabledState(true);
      fixture.detectChanges();

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('setDisabledState(false) re-enables interaction after a previous disable', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      calendar.setDisabledState(true);
      fixture.detectChanges();
      // Confirm the disabled gate is in place.
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();
      expect(valueSpy).not.toHaveBeenCalled();

      calendar.setDisabledState(false);
      fixture.detectChanges();
      expect(getCalendarHost(fixture).getAttribute('aria-disabled')).toBeNull();

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();
      expect(valueSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Range hover preview (§21.1) ──

  describe('range hover preview', () => {
    it('emits rangePreview with the tentative range when hovering after the 1st click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const previewSpy = vi.fn();
      calendar.rangePreview.subscribe(previewSpy);

      // Anchor a draft start at the 10th. Phase 6 emits an immediate keyboard-
      // driven rangePreview at this point with `end == start` because the
      // active date IS the draft anchor — that's spec'd behavior, not a bug.
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      const callsAfterClick = previewSpy.mock.calls.length;

      // Hover the 15th — the orchestrator emits a tentative range 10..15
      // through the hover path.
      getDayCell(fixture, '15')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();

      expect(previewSpy.mock.calls.length).toBeGreaterThan(callsAfterClick);
      const event = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(event.tentativeRange.start.getDate()).toBe(10);
      expect(event.tentativeRange.end.getDate()).toBe(15);
    });

    it('mouseleave on the grid clears the hover anchor (preview reverts to draft anchor)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.mode.set('range');
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const previewSpy = vi.fn();
      calendar.rangePreview.subscribe(previewSpy);

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      // Hover establishes a 10..15 preview.
      getDayCell(fixture, '15')!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      fixture.detectChanges();
      const beforeMouseleave = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(beforeMouseleave.tentativeRange.end.getDate()).toBe(15);

      // mouseleave on the grid clears `_hoveredDate`. The preview cursor falls
      // back to `activeDate` (which the click set to 10), so the preview now
      // reports an `end` matching the draft anchor (10) instead of 15.
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-month-view [role="grid"]',
      ) as HTMLElement;
      grid.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      fixture.detectChanges();

      const afterMouseleave = previewSpy.mock.calls.at(-1)?.[0] as RangePreviewEvent<Date>;
      expect(afterMouseleave.tentativeRange.end.getDate()).toBe(10);
    });
  });

  // ── startAt input ──

  describe('startAt input', () => {
    it('opens the calendar on the configured month when no value is provided', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      // Anchor on July 15, 2027 — well outside any real "today".
      fixture.componentRef.setInput('startAt', new Date(2027, 6, 15));
      fixture.detectChanges();

      const calendar = fixture.componentInstance;
      const active = calendar.activeDate() as Date;
      expect(active.getFullYear()).toBe(2027);
      expect(active.getMonth()).toBe(6); // July
      expect(active.getDate()).toBe(15);

      // The period (middle) header button reflects the configured month + year.
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-header button'),
      ) as HTMLButtonElement[];
      const periodBtn = buttons[1]!;
      expect(periodBtn.textContent ?? '').toContain('2027');
    });
  });
});
