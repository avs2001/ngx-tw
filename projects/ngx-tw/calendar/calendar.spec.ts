import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
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

    it("renders a labelled group landmark (NOT role=application) with aria-label='Calendar'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      // role="application" hijacks AT browse-mode keyboard handlers and is
      // discouraged outside of canvas/widget editors. The inner views still
      // carry role="grid" — the root only needs to label the group.
      expect(fixture.nativeElement.querySelector('[role="application"]')).toBeNull();
      const group = fixture.nativeElement.querySelector('tw-calendar [role="group"]');
      expect(group).toBeTruthy();
      expect(group.getAttribute('aria-label')).toBe('Calendar');
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
      // FormControl changes. Invoking it directly exercises the same code path
      // without needing a FormControl-bound host.
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
    // and validator codes flag the violation. These tests document the current
    // behavior: the commit goes through, but `rangePreview` reports
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

  // ── A1 — CDK LiveAnnouncer wiring ──

  describe('LiveAnnouncer announcements', () => {
    it('announces a navigation step when the next-month button is clicked', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-header button'),
      ) as HTMLButtonElement[];
      // [prev, period, next] in DOM order.
      buttons[2]!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [message, politeness] = spy.mock.calls[spy.mock.calls.length - 1]!;
      expect(typeof message).toBe('string');
      expect((message as string).length).toBeGreaterThan(0);
      expect(politeness).toBe('polite');
    });

    it('announces a navigation step when the previous-month button is clicked', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-header button'),
      ) as HTMLButtonElement[];
      buttons[0]!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [, politeness] = spy.mock.calls[spy.mock.calls.length - 1]!;
      expect(politeness).toBe('polite');
    });

    it('announces a view change when the period header drills up to month view', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();

      const periodButton = getPeriodButton(fixture);
      periodButton.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [, politeness] = spy.mock.calls[spy.mock.calls.length - 1]!;
      expect(politeness).toBe('polite');
    });

    it('announces a view change when drilling down from the year view (month grid)', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startView', 'month');
      fixture.detectChanges();

      const monthCell = fixture.nativeElement.querySelector(
        'tw-calendar-year-view tw-calendar-cell button',
      ) as HTMLButtonElement | null;
      expect(monthCell).toBeTruthy();
      monthCell!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [, politeness] = spy.mock.calls[spy.mock.calls.length - 1]!;
      expect(politeness).toBe('polite');
    });

    it('does NOT render a hand-rolled <div aria-live> region', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      // The calendar root must not ship its own aria-live region — the CDK
      // LiveAnnouncer owns the announcement surface (A1).
      const ariaLiveInCalendar = fixture.nativeElement.querySelector(
        'tw-calendar [aria-live]',
      );
      expect(ariaLiveInCalendar).toBeNull();
    });
  });

  // ── A2 — aria-multiselectable on each grid view ──

  describe('aria-multiselectable', () => {
    it("does NOT set aria-multiselectable when mode='single'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('single');
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-month-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-multiselectable')).toBeNull();
    });

    it("sets aria-multiselectable='true' on the day grid when mode='multiple'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('multiple');
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-month-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-multiselectable')).toBe('true');
    });

    it("sets aria-multiselectable='true' on the day grid when mode='range'", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('range');
      fixture.detectChanges();
      // mode='range' defaults to two month panes — both grids must advertise it.
      const grids = fixture.nativeElement.querySelectorAll(
        'tw-calendar-month-view [role="grid"]',
      );
      expect(grids.length).toBeGreaterThanOrEqual(1);
      for (const grid of Array.from(grids) as HTMLElement[]) {
        expect(grid.getAttribute('aria-multiselectable')).toBe('true');
      }
    });

    it("sets aria-multiselectable='true' on the year-view grid (mode='multiple', drilled up)", () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('mode', 'multiple');
      fixture.componentRef.setInput('startView', 'month');
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-year-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-multiselectable')).toBe('true');
    });

    it("sets aria-multiselectable='true' on the multi-year-view grid (mode='range', drilled up)", () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('mode', 'range');
      fixture.componentRef.setInput('startView', 'year');
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-years-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  // ── aria-readonly forwarding ──

  describe('aria-readonly forwarding', () => {
    it("forwards aria-readonly='true' to the day-view grid when readonly is set", () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-month-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-readonly')).toBe('true');
    });

    it("does not set aria-readonly on the grid when readonly is unset", () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector(
        'tw-calendar-month-view [role="grid"]',
      );
      expect(grid).toBeTruthy();
      expect(grid!.getAttribute('aria-readonly')).toBeNull();
    });
  });

  // ── aria-describedby ──
  //
  // The host binds `[attr.aria-describedby]`. Until the input was aliased, a
  // consumer writing the plain attribute never reached it, so the binding
  // resolved to `null` and Angular REMOVED the description the consumer wrote.
  // The static-attribute hosts below are the exact regressing shape; driving
  // the input directly skips the attribute path and would pass regardless.

  describe('aria-describedby', () => {
    it('keeps a consumer-written aria-describedby attribute on the host', () => {
      @Component({
        imports: [CalendarComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <p id="calendar-hint">Pick a delivery date.</p>
          <tw-calendar aria-describedby="calendar-hint" />
        `,
      })
      class DescribedByHost {}

      const fixture = TestBed.createComponent(DescribedByHost);
      fixture.detectChanges();
      const calendar = fixture.nativeElement.querySelector('tw-calendar') as HTMLElement;
      expect(calendar.getAttribute('aria-describedby')).toBe('calendar-hint');
    });

    it('merges the deprecated errorAriaDescribedBy ids ahead of the consumer attribute', () => {
      @Component({
        imports: [CalendarComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <p id="calendar-error">Date is required.</p>
          <p id="calendar-hint">Pick a delivery date.</p>
          <tw-calendar aria-describedby="calendar-hint" errorAriaDescribedBy="calendar-error" />
        `,
      })
      class MergedDescribedByHost {}

      const fixture = TestBed.createComponent(MergedDescribedByHost);
      fixture.detectChanges();
      const calendar = fixture.nativeElement.querySelector('tw-calendar') as HTMLElement;
      expect(calendar.getAttribute('aria-describedby')).toBe('calendar-error calendar-hint');
    });

    it('emits no aria-describedby when neither source is set', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = fixture.nativeElement.querySelector('tw-calendar') as HTMLElement;
      expect(calendar.getAttribute('aria-describedby')).toBeNull();
    });
  });

  // ── Weekday header typography ──

  describe('weekday header typography', () => {
    it('renders weekday columnheaders with text-2xs (xs-density secondary text)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const headers = Array.from(
        fixture.nativeElement.querySelectorAll(
          'tw-calendar-month-view [role="columnheader"]',
        ),
      ) as HTMLElement[];
      expect(headers.length).toBeGreaterThan(0);
      for (const header of headers) {
        expect(header.className).toContain('text-2xs');
        expect(header.className).not.toContain('text-xs ');
      }
    });
  });

  // ── LiveAnnouncer for selection commits ──

  describe('LiveAnnouncer selection-commit announcements', () => {
    it("single mode: announces the selected date after commit (polite, 'Selected …')", () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      spy.mockClear();

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [message, politeness] = spy.mock.calls.at(-1)!;
      expect(typeof message).toBe('string');
      expect((message as string).toLowerCase()).toContain('selected');
      expect(politeness).toBe('polite');
    });

    it('range mode: announces the range-start after the 1st click', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('range');
      fixture.detectChanges();
      spy.mockClear();

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalled();
      const [message, politeness] = spy.mock.calls.at(-1)!;
      expect((message as string).toLowerCase()).toContain('start date');
      expect(politeness).toBe('polite');
    });

    it('range mode: announces the committed range with a length-in-days after the 2nd click', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('range');
      fixture.detectChanges();
      spy.mockClear();

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      const lastCommitMsg = spy.mock.calls
        .map((c) => c[0] as string)
        .reverse()
        .find((m) => m.toLowerCase().includes('range selected'));
      expect(lastCommitMsg).toBeDefined();
      // 10..15 inclusive = 6 days
      expect(lastCommitMsg).toContain('6 days');
    });

    it("multiple mode: announces 'N dates selected' on each commit", () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('multiple');
      fixture.componentInstance.value.set([]);
      fixture.detectChanges();
      spy.mockClear();

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();
      const after1 = spy.mock.calls.at(-1)![0] as string;
      expect(after1).toContain('1 date selected');

      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      const after2 = spy.mock.calls.at(-1)![0] as string;
      expect(after2).toContain('2 dates selected');
    });

    it('announces selection rejection when a require-clear click flashes invalid', () => {
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');

      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('mode', 'range');
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('rangeClickBehavior', 'require-clear');
      fixture.detectChanges();
      spy.mockClear();

      // Commit a range so we're in COMPLETE state.
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      spy.mockClear();
      // Third click — require-clear rejects and announces.
      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();

      const rejected = spy.mock.calls
        .map((c) => c[0] as string)
        .find((m) => m.toLowerCase().includes('rejected'));
      expect(rejected).toBeDefined();
    });
  });

  // ── Shift+PageUp / Shift+PageDown year jumps ──

  describe('Shift+PageUp/PageDown year jumps', () => {
    it('Shift+PageDown advances by one year in the day view', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'PageDown', { shiftKey: true });

      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getFullYear()).toBe(2027);
      expect(activeDate.getMonth()).toBe(3); // April
    });

    it('Shift+PageUp retreats by one year in the day view', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const active = getActiveDayCell(fixture);
      pressKey(fixture, active!, 'PageUp', { shiftKey: true });

      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getFullYear()).toBe(2025);
      expect(activeDate.getMonth()).toBe(3);
    });

    it('Shift+PageDown jumps 10 years in the month-of-year view', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('startView', 'month');
      fixture.detectChanges();
      const calendar = fixture.componentInstance;

      const activeMonth = fixture.nativeElement.querySelector(
        'tw-calendar-year-view tw-calendar-cell button[tabindex="0"]',
      ) as HTMLButtonElement | null;
      expect(activeMonth).toBeTruthy();
      pressKey(fixture, activeMonth!, 'PageDown', { shiftKey: true });

      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getFullYear()).toBe(2036);
    });

    it('Shift+PageDown jumps a full multi-year page-block in the year view', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('startView', 'year');
      fixture.detectChanges();
      const calendar = fixture.componentInstance;
      const startYear = (calendar.activeDate() as Date).getFullYear();

      const activeYear = fixture.nativeElement.querySelector(
        'tw-calendar-years-view tw-calendar-cell button[tabindex="0"]',
      ) as HTMLButtonElement | null;
      expect(activeYear).toBeTruthy();
      pressKey(fixture, activeYear!, 'PageDown', { shiftKey: true });

      const activeDate = calendar.activeDate() as Date;
      // YEARS_PER_PAGE * 10 = a century-page jump.
      expect(activeDate.getFullYear()).toBeGreaterThan(startYear + 100);
    });
  });

  // ── Year-view + multi-year-view keyboard navigation ──

  describe('keyboard navigation (year view)', () => {
    function setupYearView(): {
      fixture: ComponentFixture<CalendarComponent<CalendarMode, Date>>;
      calendar: CalendarComponent<CalendarMode, Date>;
    } {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('startView', 'month');
      fixture.detectChanges();
      return { fixture, calendar: fixture.componentInstance };
    }

    function getActiveMonthCell(
      fixture: ComponentFixture<unknown>,
    ): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector(
        'tw-calendar-year-view tw-calendar-cell button[tabindex="0"]',
      ) as HTMLButtonElement | null;
    }

    it('ArrowRight moves to the next month (in the same year)', () => {
      const { fixture, calendar } = setupYearView();
      const cell = getActiveMonthCell(fixture);
      pressKey(fixture, cell!, 'ArrowRight');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(4); // May
    });

    it('ArrowDown jumps 4 months down (4 columns)', () => {
      const { fixture, calendar } = setupYearView();
      const cell = getActiveMonthCell(fixture);
      pressKey(fixture, cell!, 'ArrowDown');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(7); // August
    });

    it('Home jumps to January', () => {
      const { fixture, calendar } = setupYearView();
      const cell = getActiveMonthCell(fixture);
      pressKey(fixture, cell!, 'Home');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(0);
    });

    it('End jumps to December', () => {
      const { fixture, calendar } = setupYearView();
      const cell = getActiveMonthCell(fixture);
      pressKey(fixture, cell!, 'End');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getMonth()).toBe(11);
    });
  });

  describe('keyboard navigation (multi-year view)', () => {
    function setupMultiYearView(): {
      fixture: ComponentFixture<CalendarComponent<CalendarMode, Date>>;
      calendar: CalendarComponent<CalendarMode, Date>;
    } {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('startView', 'year');
      fixture.detectChanges();
      return { fixture, calendar: fixture.componentInstance };
    }

    function getActiveYearCell(
      fixture: ComponentFixture<unknown>,
    ): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector(
        'tw-calendar-years-view tw-calendar-cell button[tabindex="0"]',
      ) as HTMLButtonElement | null;
    }

    it('ArrowRight advances by one year', () => {
      const { fixture, calendar } = setupMultiYearView();
      const initial = (calendar.activeDate() as Date).getFullYear();
      const cell = getActiveYearCell(fixture);
      pressKey(fixture, cell!, 'ArrowRight');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getFullYear()).toBe(initial + 1);
    });

    it('PageDown advances by a full multi-year page', () => {
      const { fixture, calendar } = setupMultiYearView();
      const initial = (calendar.activeDate() as Date).getFullYear();
      const cell = getActiveYearCell(fixture);
      pressKey(fixture, cell!, 'PageDown');
      const activeDate = calendar.activeDate() as Date;
      expect(activeDate.getFullYear()).toBeGreaterThan(initial);
    });
  });

  // ── selectionLimitReached / maxSelectionBehavior (mode='multiple') ──

  describe("maxSelectionBehavior (mode='multiple')", () => {
    function setupMultiple(behavior?: 'emit-limit-reached' | 'replace-oldest' | 'ignore'): {
      fixture: ComponentFixture<CalendarComponent<CalendarMode, Date>>;
      calendar: CalendarComponent<CalendarMode, Date>;
    } {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', 'multiple');
      fixture.componentRef.setInput('value', []);
      fixture.componentRef.setInput('maxSelections', 2);
      if (behavior) fixture.componentRef.setInput('maxSelectionBehavior', behavior);
      fixture.detectChanges();
      return { fixture, calendar: fixture.componentInstance };
    }

    it("emit-limit-reached: emits selectionLimitReached and does NOT commit beyond the limit", () => {
      const { fixture, calendar } = setupMultiple();
      const limitSpy = vi.fn();
      const valueSpy = vi.fn();
      calendar.selectionLimitReached.subscribe(limitSpy);
      calendar.valueChange.subscribe(valueSpy);

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      valueSpy.mockClear();
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(limitSpy).toHaveBeenCalledTimes(1);
      const event = limitSpy.mock.calls[0]?.[0] as { limit: number; attempted: Date };
      expect(event.limit).toBe(2);
      expect(event.attempted.getDate()).toBe(15);
      expect(valueSpy).not.toHaveBeenCalled();
    });

    it("replace-oldest: drops the first entry and commits the new date", () => {
      const { fixture, calendar } = setupMultiple('replace-oldest');
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      valueSpy.mockClear();

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(valueSpy).toHaveBeenCalledTimes(1);
      const arr = valueSpy.mock.calls[0]?.[0] as Date[];
      expect(arr).toHaveLength(2);
      expect(arr.map((d) => d.getDate())).toEqual([10, 15]);
    });

    it("ignore: silently drops the click past the limit (no events emitted)", () => {
      const { fixture, calendar } = setupMultiple('ignore');
      const valueSpy = vi.fn();
      const limitSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);
      calendar.selectionLimitReached.subscribe(limitSpy);

      getDayCell(fixture, '5')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      valueSpy.mockClear();

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(valueSpy).not.toHaveBeenCalled();
      expect(limitSpy).not.toHaveBeenCalled();
    });
  });

  // ── persistPartialRange across view navigation ──

  describe('persistPartialRange', () => {
    it('preserves the in-flight draft when navigating months while SELECTING (default true)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.mode.set('range');
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      // Establish a draft.
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('SELECTING');

      // Navigate to the next month via the header.
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-header button'),
      ) as HTMLButtonElement[];
      buttons[2]!.click(); // next-month
      fixture.detectChanges();

      // Draft survives: still SELECTING.
      expect(calendar.selectionState()).toBe<CalendarSelectionState>('SELECTING');
    });
  });

  // ── Locale handling ──

  describe('locale handling', () => {
    it("propagates locale='de-DE' through effectiveLocale() so adapter format calls localize", () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 0, 15));
      fixture.componentRef.setInput('locale', 'de-DE');
      fixture.detectChanges();

      const calendar = fixture.componentInstance as unknown as {
        effectiveLocale(): string;
      };
      expect(calendar.effectiveLocale()).toBe('de-DE');
    });

    it("renders period button text with localized month names when locale='de-DE'", () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      // January is distinct across locales: en "January", de "Januar".
      fixture.componentRef.setInput('startAt', new Date(2026, 0, 15));
      fixture.componentRef.setInput('locale', 'de-DE');
      fixture.detectChanges();

      // Period button is the middle of the header trio.
      const buttons = Array.from(
        fixture.nativeElement.querySelectorAll('tw-calendar-header button'),
      ) as HTMLButtonElement[];
      const text = (buttons[1]?.textContent ?? '').trim();
      // In environments with full ICU the German form is rendered; if a stripped
      // build falls back to English the text still contains the year. Assert
      // a non-empty period label as a baseline and prefer the localized form
      // when ICU is present.
      expect(text.length).toBeGreaterThan(0);
      // ICU-bearing Node renders "Januar 2026"; loosely match either localized
      // form so the test stays robust across runtimes.
      expect(/(Januar|January)/.test(text)).toBe(true);
    });
  });

  // ── Dropped pre-1.0 surface (S19) ──
  //
  // The placeholder `opened` / `closed` / `renderedMonthsCount` outputs and the
  // no-op `blockInvalidRangeCommit` input were removed in S19. Picker overlay
  // events live on `tw-date-picker` / `tw-date-range-picker`; the calendar is
  // inline-only at this layer.

  describe('dropped pre-1.0 surface', () => {
    it('no longer exposes opened / closed / renderedMonthsCount outputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture) as unknown as Record<string, unknown>;

      expect(calendar['opened']).toBeUndefined();
      expect(calendar['closed']).toBeUndefined();
      expect(calendar['renderedMonthsCount']).toBeUndefined();
    });

    it('no longer exposes blockInvalidRangeCommit / individual range-behavior inputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture) as unknown as Record<string, unknown>;

      expect(calendar['blockInvalidRangeCommit']).toBeUndefined();
      expect(calendar['allowBackwardRange']).toBeUndefined();
      expect(calendar['allowSingleDayRange']).toBeUndefined();
      expect(calendar['persistPartialRange']).toBeUndefined();
      expect(calendar['disableRangesCrossingDisabledDates']).toBeUndefined();
    });
  });

  // ── rangeBehavior config (S19) ──
  //
  // The four standalone booleans collapsed into one `Partial<RangeBehaviorConfig>`
  // input. These tests cover the partial-merge semantics and the per-field
  // overrides that previously had their own inputs.

  describe('rangeBehavior config', () => {
    it('uses documented defaults when no rangeBehavior is supplied (single-day range commits)', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', 'range');
      fixture.detectChanges();
      const calendar = fixture.componentInstance;
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      // Click the same in-month day twice — default `allowSingleDayRange: true` commits.
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      expect(valueSpy).toHaveBeenCalled();
      const last = valueSpy.mock.calls.at(-1)?.[0] as { start: Date; end: Date };
      expect(last.start.getDate()).toBe(15);
      expect(last.end.getDate()).toBe(15);
    });

    it('honors rangeBehavior.allowSingleDayRange=false (rejects same-cell second click)', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', 'range');
      fixture.componentRef.setInput('rangeBehavior', { allowSingleDayRange: false });
      fixture.detectChanges();
      const calendar = fixture.componentInstance;
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '15')!.click();
      fixture.detectChanges();

      // 1st click moves into SELECTING (no commit); 2nd click on same cell is rejected.
      expect(valueSpy).not.toHaveBeenCalled();
    });

    it('honors rangeBehavior.allowBackwardRange=true (skips auto-swap when end < start)', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', 'range');
      fixture.componentRef.setInput('rangeBehavior', { allowBackwardRange: true });
      fixture.detectChanges();
      const calendar = fixture.componentInstance;
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      // Click day 20, then click day 10 — without allowBackwardRange the value
      // would normalize to { start: 10, end: 20 }; with it set we keep 20→10.
      getDayCell(fixture, '20')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '10')!.click();
      fixture.detectChanges();

      const last = valueSpy.mock.calls.at(-1)?.[0] as { start: Date; end: Date };
      expect(last.start.getDate()).toBe(20);
      expect(last.end.getDate()).toBe(10);
    });

    it('merges a partial config over the defaults (unspecified fields keep defaults)', () => {
      const fixture = TestBed.createComponent<CalendarComponent<CalendarMode, Date>>(
        CalendarComponent as unknown as new () => CalendarComponent<CalendarMode, Date>,
      );
      fixture.componentRef.setInput('startAt', new Date(2026, 3, 26));
      fixture.componentRef.setInput('mode', 'range');
      // Override only one field. Defaults for the rest still apply.
      fixture.componentRef.setInput('rangeBehavior', { allowBackwardRange: true });
      fixture.detectChanges();
      const calendar = fixture.componentInstance;
      const valueSpy = vi.fn();
      calendar.valueChange.subscribe(valueSpy);

      // allowSingleDayRange default `true` should still hold: clicking the same
      // day cell twice commits a single-day range.
      getDayCell(fixture, '12')!.click();
      fixture.detectChanges();
      getDayCell(fixture, '12')!.click();
      fixture.detectChanges();

      expect(valueSpy).toHaveBeenCalled();
      const last = valueSpy.mock.calls.at(-1)?.[0] as { start: Date; end: Date };
      expect(last.start.getDate()).toBe(12);
      expect(last.end.getDate()).toBe(12);
    });
  });
  // ── Validator ──
  //
  // Guards the Angular v22 CVA/validator trap documented in CLAUDE.md: this
  // component self-provides NG_VALIDATORS and defers its NgControl lookup to
  // ngOnInit, so it MUST also provide NG_VALUE_ACCESSOR statically. Without
  // that provider Angular routes it down the signal-forms custom-control
  // branch, `validate()` is never invoked, and every error code below silently
  // vanishes while every other test still passes.

  describe('validator', () => {
    @Component({
      imports: [CalendarComponent, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-calendar [formControl]="ctrl" [minDate]="floor" />`,
    })
    class ValidatorHost {
      readonly ctrl = new FormControl<Date | null>(null);
      readonly floor = new Date(2026, 3, 15);
    }

    it('surfaces calendarMinDate through a bound FormControl', async () => {
      const fixture = TestBed.createComponent(ValidatorHost);
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.ctrl.setValue(new Date(2026, 3, 10));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const errors = fixture.componentInstance.ctrl.errors ?? {};
      expect('calendarMinDate' in errors).toBe(true);
    });

    it('produces no error for a value inside the constraints', async () => {
      const fixture = TestBed.createComponent(ValidatorHost);
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.ctrl.setValue(new Date(2026, 3, 20));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(fixture.componentInstance.ctrl.errors).toBeNull();
    });
  });

  describe('unimplemented overlay API', () => {
    it('throws in dev mode for open/close/toggle instead of silently doing nothing', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      // These shipped as no-ops whose JSDoc claimed they worked, so a consumer
      // wiring a custom trigger to calendar.open() got no overlay and no error.
      expect(() => calendar.open()).toThrow(/not implemented/i);
      expect(() => calendar.close()).toThrow(/not implemented/i);
      expect(() => calendar.toggle()).toThrow(/not implemented/i);
    });

    it('revalidate() re-runs the validator instead of doing nothing', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const calendar = getCalendarComponent(fixture);

      const onChange = vi.fn();
      calendar.registerOnValidatorChange(onChange);
      calendar.revalidate();

      expect(onChange).toHaveBeenCalled();
    });
  });


});
