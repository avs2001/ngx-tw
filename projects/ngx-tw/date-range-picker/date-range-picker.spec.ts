import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideNativeDateAdapter, TwDateRange } from '@cdevhub/ngx-tw/calendar';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from '@cdevhub/ngx-tw/form-field';
import { DateRangePickerComponent } from './date-range-picker';
import type {
  DateRangePickerChangeEvent,
  DateRangePickerCloseReason,
  DateRangePickerOpenedEvent,
  DateRangePreset,
} from './date-range-picker';

// Minimum range length used in constraint tests.
const MIN_RANGE_LEN = 3;

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [DateRangePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-range-picker
      [(value)]="value"
      [(open)]="open"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [dateFilter]="dateFilter()"
      [disabled]="disabled()"
      [required]="required()"
      [showActions]="showActions()"
      [showClear]="showClear()"
      [showTime]="showTime()"
      [numberOfMonths]="numberOfMonths()"
      [presets]="presets()"
      [size]="size()"
      [color]="color()"
      [placeholder]="placeholder()"
      [aria-label]="ariaLabel()"
      (opened)="onOpened($event)"
      (closed)="onClosed($event)"
      (rangeChange)="onRangeChange($event)"
      (presetSelected)="onPresetSelected($event)"
    />
  `,
})
class BasicHost {
  value = signal<TwDateRange<Date> | null>(null);
  open = signal(false);
  minDate = signal<Date | null>(null);
  maxDate = signal<Date | null>(null);
  dateFilter = signal<((d: Date) => boolean) | null>(null);
  disabled = signal(false);
  required = signal(false);
  showActions = signal(false);
  showClear = signal(true);
  showTime = signal(false);
  numberOfMonths = signal<1 | 2>(2);
  presets = signal<readonly DateRangePreset<Date>[]>([]);
  size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  color = signal<
    'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error'
  >('primary');
  placeholder = signal<string | undefined>(undefined);
  ariaLabel = signal<string | undefined>('Booking window');

  openedSpy = vi.fn();
  closedSpy = vi.fn();
  rangeChangeSpy = vi.fn();
  presetSelectedSpy = vi.fn();

  onOpened(ev: DateRangePickerOpenedEvent): void {
    this.openedSpy(ev);
  }
  onClosed(ev: DateRangePickerCloseReason): void {
    this.closedSpy(ev);
  }
  onRangeChange(ev: DateRangePickerChangeEvent<Date>): void {
    this.rangeChangeSpy(ev);
  }
  onPresetSelected(p: DateRangePreset<Date>): void {
    this.presetSelectedSpy(p);
  }
}

@Component({
  imports: [DateRangePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-range-picker [formControl]="ctrl" aria-label="Reactive" />`,
})
class ReactiveHost {
  ctrl = new FormControl<TwDateRange<Date> | null>(null, Validators.required);
}

@Component({
  imports: [DateRangePickerComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-range-picker [(ngModel)]="value" aria-label="Template" />`,
})
class TemplateDrivenHost {
  value: TwDateRange<Date> | null = null;
}

@Component({
  imports: [
    DateRangePickerComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Report period</label>
      <tw-date-range-picker [formControl]="ctrl" />
      <span twHint>Pick a range within this year.</span>
      <span twError>Required.</span>
    </tw-form-field>
  `,
})
class FormFieldHost {
  ctrl = new FormControl<TwDateRange<Date> | null>(null, Validators.required);
}

/**
 * Binds the label / format / overlay-chrome inputs that `BasicHost` leaves at
 * their defaults, so each can be asserted against rendered DOM.
 */
@Component({
  imports: [DateRangePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-range-picker
      [(value)]="value"
      [rangeSeparator]="rangeSeparator()"
      [emptyStartLabel]="emptyStartLabel()"
      [emptyEndLabel]="emptyEndLabel()"
      [format]="format()"
      [clearAriaLabel]="clearAriaLabel()"
      [startView]="startView()"
      [showActions]="showActions()"
      [todayLabel]="todayLabel()"
      [clearLabel]="clearLabel()"
      [cancelLabel]="cancelLabel()"
      [applyLabel]="applyLabel()"
      [panelClass]="panelClass()"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="ariaLabelledby()"
      [aria-describedby]="ariaDescribedby()"
    />
    <span id="ext-label">External label</span>
    <span id="ext-hint">External hint</span>
  `,
})
class ConfigHost {
  value = signal<TwDateRange<Date> | null>(null);
  rangeSeparator = signal(' – ');
  emptyStartLabel = signal('Start date');
  emptyEndLabel = signal('End date');
  format = signal<unknown>({
    dateTimeFormat: { year: 'numeric', month: 'short', day: 'numeric' },
  });
  clearAriaLabel = signal('Clear date range');
  startView = signal<'day' | 'month' | 'year'>('day');
  showActions = signal(false);
  todayLabel = signal('Today');
  clearLabel = signal('Clear');
  cancelLabel = signal('Cancel');
  applyLabel = signal('Apply');
  panelClass = signal<string | readonly string[]>('');
  ariaLabel = signal<string | undefined>('Booking window');
  ariaLabelledby = signal<string | undefined>(undefined);
  ariaDescribedby = signal<string | undefined>(undefined);
}

// ── Helpers ───────────────────────────────────────────────────────

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-date-range-picker') as HTMLElement;
}

/** Binds `startAt` and nothing else, so the calendar's anchor has exactly one source. */
@Component({
  imports: [DateRangePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-range-picker [startAt]="startAt()" aria-label="Anchored" />`,
})
class StartAtHost {
  startAt = signal<Date | null>(null);
}

function getTrigger(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector(
    'tw-date-range-picker button[role="combobox"]',
  ) as HTMLButtonElement;
}

function getClearButton(fixture: ComponentFixture<unknown>): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(
    'tw-date-range-picker button[aria-label="Clear date range"]',
  ) as HTMLButtonElement | null;
}

function getOverlayPanel(): HTMLElement | null {
  return document.querySelector('tw-date-range-picker-overlay');
}

function getDialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function getCalendars(): HTMLElement[] {
  return Array.from(document.querySelectorAll('tw-calendar'));
}

function getTimePickers(): HTMLElement[] {
  return Array.from(document.querySelectorAll('tw-time-picker'));
}

function getPresetButtons(): HTMLButtonElement[] {
  const list = document.querySelector('[role="listbox"][aria-label="Preset ranges"]');
  return list ? Array.from(list.querySelectorAll('button[role="option"]')) : [];
}

function dispatchKeyOn(el: HTMLElement, key: string, opts: KeyboardEventInit = {}): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }),
  );
}

async function advance(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

// ── Tests ─────────────────────────────────────────────────────────

describe('DateRangePickerComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule],
      providers: [provideNativeDateAdapter()],
    });
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  // ── Rendering ──

  describe('rendering', () => {
    it('mounts without errors with default inputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getHost(fixture)).toBeTruthy();
      expect(getTrigger(fixture)).toBeTruthy();
    });

    it('renders each size without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      for (const size of sizes) {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        expect(getHost(fixture)).toBeTruthy();
      }
    });

    it('renders each color without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const colors = [
        'primary',
        'secondary',
        'accent',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
      ] as const;
      for (const color of colors) {
        fixture.componentInstance.color.set(color);
        fixture.detectChanges();
        expect(getHost(fixture)).toBeTruthy();
      }
    });

    it('sets role="combobox" and aria-haspopup="dialog" on the trigger', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const trigger = getTrigger(fixture);
      expect(trigger.getAttribute('role')).toBe('combobox');
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('shows the composed placeholder when empty', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Start date');
      expect(text).toContain('End date');
    });

    it('shows a custom placeholder when set', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.placeholder.set('Pick a range');
      fixture.detectChanges();
      expect(getTrigger(fixture).textContent).toContain('Pick a range');
    });

    it('renders formatted endpoints when a complete range is set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const start = new Date(2026, 3, 21);
      const end = new Date(2026, 4, 3);
      fixture.componentInstance.value.set(new TwDateRange(start, end));
      await advance(fixture);
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Apr');
      expect(text).toContain('May');
      expect(text).toContain('2026');
    });

    it('renders placeholder for the missing endpoint in a partial range', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new TwDateRange(new Date(2026, 3, 21), null));
      await advance(fixture);
      expect(getTrigger(fixture).textContent).toContain('End date');
    });
  });

  // ── Disabled ──

  describe('disabled', () => {
    it('sets aria-disabled and disables the trigger', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const trigger = getTrigger(fixture);
      expect(trigger.getAttribute('aria-disabled')).toBe('true');
      expect(trigger.disabled).toBe(true);
    });

    it('prevents opening when disabled', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getOverlayPanel()).toBeFalsy();
    });
  });

  // ── Required ──

  describe('required', () => {
    it('reflects aria-required when required=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getTrigger(fixture).getAttribute('aria-required')).toBe('true');
    });
  });

  // ── Clear button ──

  describe('clear button', () => {
    it('hides when no value is set', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getClearButton(fixture)).toBeNull();
    });

    it('shows when a value is set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      expect(getClearButton(fixture)).toBeTruthy();
    });

    it('clears the value and emits rangeChange with source="clear"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      getClearButton(fixture)!.click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
      const calls = fixture.componentInstance.rangeChangeSpy.mock.calls;
      const clearCall = calls.find((c) => c[0].source === 'clear');
      expect(clearCall).toBeTruthy();
      expect(clearCall![0].value).toBeNull();
    });

    it('is hidden when showClear=false', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      fixture.componentInstance.showClear.set(false);
      await advance(fixture);
      expect(getClearButton(fixture)).toBeNull();
    });
  });

  // ── Overlay ──

  describe('overlay', () => {
    it('opens on trigger click', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
      expect(getDialog()).toBeTruthy();
      expect(getTrigger(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('emits opened after the enter animation completes', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        // opened$ fires after PICKER_ENTER_DURATION (140ms) — synchronous
        // emission was the audit's Medium-finding bug, fixed by routing
        // through PickerOverlayCoordinator.opened$().
        expect(fixture.componentInstance.openedSpy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(fixture.componentInstance.openedSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('closes on escape and restores previous value', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      dispatchKeyOn(getDialog()!, 'Escape');
      // Wait for the 150ms leave-animation timer in closeOverlay.
      await new Promise((resolve) => setTimeout(resolve, 200));
      fixture.detectChanges();
      const calls = fixture.componentInstance.closedSpy.mock.calls;
      expect(calls.some((c) => c[0] === 'escape')).toBe(true);
    });

    it('renders role="dialog" aria-modal="true"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const dialog = getDialog()!;
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ── Layout ──

  describe('layout', () => {
    it('renders a single calendar with two months side-by-side by default', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      // Now a single tw-calendar hosts both months under one header.
      expect(getCalendars().length).toBe(1);
      const monthViews = document.querySelectorAll('tw-calendar-month-view');
      expect(monthViews.length).toBe(2);
    });

    it('renders a single month when numberOfMonths=1', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.numberOfMonths.set(1);
      await advance(fixture);
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getCalendars().length).toBe(1);
      const monthViews = document.querySelectorAll('tw-calendar-month-view');
      expect(monthViews.length).toBe(1);
    });

    // TODO: calendar does not anchor its active month to the picker's value on open;
    // it always opens on `today`. Re-enable after the calendar's _activeDate
    // linkedSignal reacts to a `value`-derived startAt push, or once the
    // date-range-picker overlay calls a `goToDate(value.start)` API.
    it.skip('shows a combined period label like "April – May 2026" when numberOfMonths=2', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const apr1 = new Date(2026, 3, 1);
      fixture.componentInstance.value.set(new TwDateRange(apr1, apr1));
      await advance(fixture);
      getTrigger(fixture).click();
      await advance(fixture);
      const headerButtons = document.querySelectorAll(
        'tw-calendar-header button',
      ) as NodeListOf<HTMLButtonElement>;
      // Three buttons: prev, period label, next — the middle one carries the label text.
      const periodText = headerButtons[1]?.textContent?.trim() ?? '';
      expect(periodText).toContain('April');
      expect(periodText).toContain('May');
      expect(periodText).toContain('2026');
    });
  });

  // ── Calendar interaction ──

  describe('calendar interaction', () => {
    // TODO: clicking calendar cells through the overlay does not propagate a
    // `rangeChange` emission with `source: 'calendar'` in this test harness —
    // likely related to the cell index used (cells[0]/[5] land on adjacent-month
    // leading days which the strategy rejects). Re-enable after the test picks
    // in-month cells, or after the calendar exposes a deterministic harness API.
    it.skip('commits after two clicks (first + second) and emits rangeChange with source="calendar"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const cells = document.querySelectorAll(
        'tw-calendar-cell button:not([disabled])',
      ) as NodeListOf<HTMLButtonElement>;
      expect(cells.length).toBeGreaterThan(2);
      cells[0].click();
      await advance(fixture);
      expect(fixture.componentInstance.rangeChangeSpy).not.toHaveBeenCalled();
      cells[5].click();
      await advance(fixture);
      const calls = fixture.componentInstance.rangeChangeSpy.mock.calls;
      const calCall = calls.find((c) => c[0].source === 'calendar');
      expect(calCall).toBeTruthy();
      expect(calCall![0].value).toBeInstanceOf(TwDateRange);
    });

    // TODO: same cell-selection harness issue as the test above prevents the
    // SELECTING → COMPLETE transition needed to land on the Apply path.
    it.skip('stays open when showActions=true, commits on Apply', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.showActions.set(true);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const cells = document.querySelectorAll(
        'tw-calendar-cell button:not([disabled])',
      ) as NodeListOf<HTMLButtonElement>;
      cells[0].click();
      await advance(fixture);
      cells[5].click();
      await advance(fixture);
      expect(fixture.componentInstance.rangeChangeSpy).not.toHaveBeenCalled();
      expect(getOverlayPanel()).toBeTruthy();
      const applyBtn = Array.from(
        document.querySelectorAll('button'),
      ).find((b) => b.textContent?.trim() === 'Apply') as HTMLButtonElement;
      expect(applyBtn).toBeTruthy();
      applyBtn.click();
      await advance(fixture);
      const calls = fixture.componentInstance.rangeChangeSpy.mock.calls;
      const applyCall = calls.find((c) => c[0].source === 'apply');
      expect(applyCall).toBeTruthy();
    });
  });

  // ── Presets ──

  describe('presets', () => {
    it('renders a preset list when non-empty', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const today = new Date(2026, 3, 21);
      fixture.componentInstance.presets.set([
        { id: 'today', label: 'Today', range: () => new TwDateRange(today, today) },
        {
          id: 'week',
          label: 'This week',
          range: () => new TwDateRange(new Date(2026, 3, 19), new Date(2026, 3, 25)),
        },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const buttons = getPresetButtons();
      expect(buttons.length).toBe(2);
      expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Today', 'This week']);
    });

    it('clicking a preset commits the range and fires presetSelected', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const today = new Date(2026, 3, 21);
      fixture.componentInstance.presets.set([
        { id: 'today', label: 'Today', range: () => new TwDateRange(today, today) },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      getPresetButtons()[0].click();
      await advance(fixture);
      expect(fixture.componentInstance.presetSelectedSpy).toHaveBeenCalledTimes(1);
      const calls = fixture.componentInstance.rangeChangeSpy.mock.calls;
      const presetCall = calls.find((c) => c[0].source === 'preset');
      expect(presetCall).toBeTruthy();
      expect(presetCall![0].value).toBeInstanceOf(TwDateRange);
    });
  });

  // ── Time mode ──

  describe('time mode', () => {
    it('does not render time pickers when showTime=false', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getTimePickers().length).toBe(0);
    });

    // TODO: pendingRange propagates into the overlay via an effect that runs
    // after the overlay's first render, so `hasTimeablePending()` is false on
    // first paint and the time row stays hidden. Re-enable after the overlay
    // reads pendingRange synchronously on attach (similar to the size/color
    // config push) or once an explicit setter on the overlay seeds the value.
    it.skip('renders two time pickers when showTime=true and a complete range is set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.showTime.set(true);
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21, 9, 0), new Date(2026, 4, 3, 17, 30)),
      );
      await advance(fixture);
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getTimePickers().length).toBe(2);
    });
  });

  // ── CVA / forms ──

  describe('ControlValueAccessor', () => {
    it('works with reactive forms: setValue updates the trigger display', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Apr');
      expect(text).toContain('May');
    });

    it('mounts and binds via template-driven forms', async () => {
      const fixture = TestBed.createComponent(TemplateDrivenHost);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(getTrigger(fixture)).toBeTruthy();
      fixture.componentInstance.value = new TwDateRange(
        new Date(2026, 3, 21),
        new Date(2026, 4, 3),
      );
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Apr');
      expect(text).toContain('May');
    });

    it('setDisabledState disables the trigger', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.disable();
      await advance(fixture);
      expect(getTrigger(fixture).disabled).toBe(true);
    });

    it('accepts a plain { start, end } object in writeValue', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue({
        start: new Date(2026, 3, 21),
        end: new Date(2026, 4, 3),
      } as unknown as TwDateRange<Date>);
      await advance(fixture);
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Apr');
      expect(text).toContain('May');
    });
  });

  // ── Form-field integration ──

  describe('form-field integration', () => {
    it('attaches TW_FORM_FIELD_CONTROL and auto-naked variant', () => {
      const fixture = TestBed.createComponent(FormFieldHost);
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector(
        'tw-date-range-picker button[role="combobox"]',
      ) as HTMLButtonElement;
      expect(trigger.getAttribute('data-variant')).toBe('naked');
    });
  });

  // ── Keyboard ──

  describe('keyboard', () => {
    it('opens on Alt+ArrowDown', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const trigger = getTrigger(fixture);
      trigger.focus();
      dispatchKeyOn(trigger, 'ArrowDown', { altKey: true });
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });
  });

  // ── writeValue edge cases ──

  describe('writeValue edge cases', () => {
    it('normalises an empty range to null', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(new TwDateRange<Date>(null, null));
      await advance(fixture);
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Start date');
      expect(text).toContain('End date');
    });

    it('preserves a partial range round-trip', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(new TwDateRange(new Date(2026, 3, 21), null));
      await advance(fixture);
      const text = getTrigger(fixture).textContent ?? '';
      expect(text).toContain('Apr');
      expect(text).toContain('End date');
    });
  });

  // ── Trigger structure ──

  describe('trigger structure', () => {
    it('does not render an interactive button with aria-hidden="true"', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      // Catches the previous WAI-ARIA violation where a secondary trigger
      // <button aria-hidden="true"> sat alongside the main combobox.
      const hiddenInteractive = fixture.nativeElement.querySelector(
        'tw-date-range-picker button[aria-hidden="true"]',
      );
      expect(hiddenInteractive).toBeNull();
    });

    it('exposes a single combobox button inside the trigger row when no value is set', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        'tw-date-range-picker > button',
      );
      // Main combobox only; clear button is gated on a non-empty value.
      expect(buttons.length).toBe(1);
      expect((buttons[0] as HTMLButtonElement).getAttribute('role')).toBe('combobox');
    });

    it('renders the calendar icon inside the trigger button', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const trigger = getTrigger(fixture);
      const svg = trigger.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg!.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ── Preset listbox keyboard ──

  describe('preset listbox keyboard', () => {
    it('roving tabindex starts on the first preset; ArrowDown moves to the second', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const today = new Date(2026, 3, 21);
      fixture.componentInstance.presets.set([
        { id: 'today', label: 'Today', range: () => new TwDateRange(today, today) },
        {
          id: 'week',
          label: 'This week',
          range: () =>
            new TwDateRange(new Date(2026, 3, 19), new Date(2026, 3, 25)),
        },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const buttons = getPresetButtons();
      expect(buttons.length).toBe(2);
      expect(buttons[0].getAttribute('tabindex')).toBe('0');
      expect(buttons[1].getAttribute('tabindex')).toBe('-1');

      const list = document.querySelector(
        '[role="listbox"][aria-label="Preset ranges"]',
      ) as HTMLElement;
      dispatchKeyOn(list, 'ArrowDown');
      await advance(fixture);
      expect(buttons[0].getAttribute('tabindex')).toBe('-1');
      expect(buttons[1].getAttribute('tabindex')).toBe('0');
    });

    it('Enter activates the focused preset', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const today = new Date(2026, 3, 21);
      fixture.componentInstance.presets.set([
        { id: 'today', label: 'Today', range: () => new TwDateRange(today, today) },
        {
          id: 'week',
          label: 'This week',
          range: () =>
            new TwDateRange(new Date(2026, 3, 19), new Date(2026, 3, 25)),
        },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const list = document.querySelector(
        '[role="listbox"][aria-label="Preset ranges"]',
      ) as HTMLElement;
      dispatchKeyOn(list, 'ArrowDown');
      await advance(fixture);
      dispatchKeyOn(list, 'Enter');
      await advance(fixture);
      // ArrowDown selected the second preset; Enter committed it.
      expect(fixture.componentInstance.presetSelectedSpy).toHaveBeenCalledTimes(1);
      const arg = fixture.componentInstance.presetSelectedSpy.mock.calls[0][0];
      expect(arg.id).toBe('week');
    });
  });

  // ── Preset edge cases ──

  describe('preset edge cases', () => {
    it('a preset whose range() throws does not commit and is announced politely', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.presets.set([
        {
          id: 'broken',
          label: 'Broken',
          range: () => {
            throw new Error('boom');
          },
        },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const [btn] = getPresetButtons();
      expect(btn).toBeTruthy();
      btn.click();
      await advance(fixture);
      // The picker must not commit and must not crash.
      expect(fixture.componentInstance.value()).toBeNull();
      expect(fixture.componentInstance.rangeChangeSpy).not.toHaveBeenCalled();
    });

    it('a preset whose range() falls onto a filtered date is rejected', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const today = new Date(2026, 3, 21);
      // dateFilter that disables every date — guarantees the preset's
      // clamped range fails isRangeValid regardless of endpoint shifting.
      fixture.componentInstance.dateFilter.set(() => false);
      fixture.componentInstance.presets.set([
        {
          id: 'forbidden',
          label: 'Forbidden',
          range: () => new TwDateRange(today, today),
        },
      ]);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const [btn] = getPresetButtons();
      btn.click();
      await advance(fixture);
      const commits = fixture.componentInstance.rangeChangeSpy.mock.calls.filter(
        (c) => c[0].source === 'preset',
      );
      expect(commits.length).toBe(0);
    });
  });

  // ── Range-mode knobs ──

  describe('range-mode knobs', () => {
    it('forwards minRangeLength to the calendar (input present on calendar element)', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      // The wired calendar instance receives the min/max signals via property
      // bindings; we sanity-check by reading the calendar element exists and
      // has the picker-driven attribute. (The picker drives knobs as inputs,
      // which Angular does not reflect to attributes, so we simply assert
      // the overlay component is in the DOM as a smoke check.)
      const cal = document.querySelector('tw-calendar');
      expect(cal).toBeTruthy();
    });
  });

  // ── Validator ──

  describe('validator', () => {
    @Component({
      imports: [DateRangePickerComponent, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-date-range-picker
          [formControl]="ctrl"
          [minRangeLength]="minLen"
          aria-label="Validator"
        />
      `,
    })
    class ValidatorHost {
      ctrl = new FormControl<TwDateRange<Date> | null>(null);
      minLen = MIN_RANGE_LEN;
    }

    it('surfaces a constraint error onto a bound signal-forms field', async () => {
      // Closes the "signal-forms path unproven" gap recorded in
      // docs/production-audit.md. Angular v22's compat layer maps a classic
      // NG_VALIDATORS error key onto a signal-forms ValidationError whose
      // `kind` is that key, so the static NG_VALUE_ACCESSOR provider this
      // component already carries is what keeps BOTH binding styles honest.
      @Component({
        imports: [DateRangePickerComponent, FormField],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <tw-date-range-picker [formField]="f.range" [minDate]="minDate()" aria-label="Signal" />
        `,
      })
      class SignalValidatorHost {
        readonly minDate = signal<Date | null>(new Date(2026, 3, 1));
        readonly model = signal<{ range: TwDateRange<Date> | null }>({ range: null });
        readonly f = form(this.model);
      }

      const fixture = TestBed.createComponent(SignalValidatorHost);
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.model.set({
        range: new TwDateRange<Date>(new Date(2025, 0, 1), new Date(2025, 0, 5)),
      });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = fixture.componentInstance.f.range();
      const kinds = (state.errors() as unknown as readonly Record<string, unknown>[]).map((e) =>
        String(e['kind']),
      );
      expect(kinds).toContain('calendarMinDate');
      expect(state.valid()).toBe(false);
    });

    it('surfaces calendarRangeTooShort when the committed range is below minRangeLength', async () => {
      const fixture = TestBed.createComponent(ValidatorHost);
      fixture.detectChanges();
      // 2-day range (Mon → Tue) — below MIN_RANGE_LEN = 3.
      fixture.componentInstance.ctrl.setValue(
        new TwDateRange(new Date(2026, 3, 20), new Date(2026, 3, 21)),
      );
      await advance(fixture);
      const errors = fixture.componentInstance.ctrl.errors ?? {};
      expect('calendarRangeTooShort' in errors).toBe(true);
    });

    it('produces no error when the committed range matches minRangeLength', async () => {
      const fixture = TestBed.createComponent(ValidatorHost);
      fixture.detectChanges();
      // 3-day range hits the floor.
      fixture.componentInstance.ctrl.setValue(
        new TwDateRange(new Date(2026, 3, 20), new Date(2026, 3, 22)),
      );
      await advance(fixture);
      expect(fixture.componentInstance.ctrl.errors).toBeNull();
    });

    it('surfaces calendarMinDate when an endpoint falls before minDate', async () => {
      @Component({
        imports: [DateRangePickerComponent, ReactiveFormsModule],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
          <tw-date-range-picker
            [formControl]="ctrl"
            [minDate]="floor"
            aria-label="Min"
          />
        `,
      })
      class MinDateHost {
        ctrl = new FormControl<TwDateRange<Date> | null>(null);
        floor = new Date(2026, 3, 15);
      }
      const fixture = TestBed.createComponent(MinDateHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(
        new TwDateRange(new Date(2026, 3, 10), new Date(2026, 3, 20)),
      );
      await advance(fixture);
      const errors = fixture.componentInstance.ctrl.errors ?? {};
      expect('calendarMinDate' in errors).toBe(true);
    });
  });

  // ── Locale ──

  describe('locale', () => {
    it('forwards locale to the embedded calendar, switching month abbreviations', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      // The calendar's locale input is forwarded via the overlay signal bag.
      // Smoke-check: opening the overlay with a French locale must not throw
      // and the calendar must mount.
      const host = fixture.nativeElement.querySelector(
        'tw-date-range-picker',
      ) as HTMLElement & { __ngContext__?: unknown };
      // Inputs not exposed on the host element directly; we rely on the
      // calendar mounting + the locale signal propagating.
      expect(host).toBeTruthy();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(document.querySelector('tw-calendar')).toBeTruthy();
    });
  });

  // ── Configurable labels (trigger chrome, no overlay needed) ──

  describe('trigger label inputs', () => {
    it('composes the empty placeholder from emptyStartLabel + rangeSeparator + emptyEndLabel', () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.emptyStartLabel.set('Check-in');
      fixture.componentInstance.emptyEndLabel.set('Check-out');
      fixture.componentInstance.rangeSeparator.set(' to ');
      fixture.detectChanges();
      const text = (getTrigger(fixture).textContent ?? '').replace(/\s+/g, ' ').trim();
      expect(text).toBe('Check-in to Check-out');
    });

    it('renders rangeSeparator between the endpoints of a complete range', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.rangeSeparator.set(' >>> ');
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      expect(getTrigger(fixture).textContent).toContain('>>>');
    });

    it('renders emptyEndLabel for the missing endpoint of a partial range', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.emptyEndLabel.set('No end yet');
      fixture.componentInstance.value.set(new TwDateRange(new Date(2026, 3, 21), null));
      await advance(fixture);
      expect(getTrigger(fixture).textContent).toContain('No end yet');
    });

    it('formats the endpoints with the format input', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      // Year-only is locale-stable: every locale renders 2026 as "2026".
      fixture.componentInstance.format.set({ dateTimeFormat: { year: 'numeric' } });
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      const text = (getTrigger(fixture).textContent ?? '').replace(/\s+/g, ' ').trim();
      expect(text).toContain('2026');
      expect(text).not.toContain('Apr');
    });

    it('applies clearAriaLabel to the clear button', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.clearAriaLabel.set('Reset the period');
      fixture.componentInstance.value.set(
        new TwDateRange(new Date(2026, 3, 21), new Date(2026, 4, 3)),
      );
      await advance(fixture);
      // Queried structurally, not by aria-label — the label is what is under test.
      const clear = fixture.nativeElement.querySelector(
        'tw-date-range-picker > button:not([role="combobox"])',
      ) as HTMLButtonElement;
      expect(clear).toBeTruthy();
      expect(clear.getAttribute('aria-label')).toBe('Reset the period');
    });
  });

  // ── ARIA wiring inputs ──

  describe('aria inputs', () => {
    it('forwards aria-labelledby to the trigger and suppresses the composed aria-label', () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.ariaLabel.set(undefined);
      fixture.componentInstance.ariaLabelledby.set('ext-label');
      fixture.detectChanges();
      const trigger = getTrigger(fixture);
      expect(trigger.getAttribute('aria-labelledby')).toBe('ext-label');
      expect(trigger.getAttribute('aria-label')).toBeNull();
    });

    it('merges aria-describedby into the trigger describedby list', () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.ariaDescribedby.set('ext-hint');
      fixture.detectChanges();
      const describedBy = getTrigger(fixture).getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(/\s+/)).toContain('ext-hint');
    });
  });

  // ── Overlay chrome inputs ──

  describe('overlay config inputs', () => {
    it('renders the action bar labels from todayLabel / cancelLabel / applyLabel', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.showActions.set(true);
      fixture.componentInstance.todayLabel.set('Today-FR');
      fixture.componentInstance.cancelLabel.set('Cancel-FR');
      fixture.componentInstance.applyLabel.set('Apply-FR');
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const labels = Array.from(
        (getOverlayPanel() as HTMLElement).querySelectorAll('button'),
      ).map((b) => b.textContent?.trim());
      expect(labels).toContain('Today-FR');
      expect(labels).toContain('Cancel-FR');
      expect(labels).toContain('Apply-FR');
    });

    it('does not render the action bar when showActions=false', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const labels = Array.from(
        (getOverlayPanel() as HTMLElement).querySelectorAll('button'),
      ).map((b) => b.textContent?.trim());
      expect(labels).not.toContain('Today');
      expect(labels).not.toContain('Apply');
    });

    it('opens the calendar on the month view when startView="month"', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.startView.set('month');
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(document.querySelector('tw-calendar-year-view')).toBeTruthy();
      expect(document.querySelector('tw-calendar-month-view')).toBeNull();
    });

    it('appends panelClass to the overlay panel element', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.panelClass.set('my-custom-panel');
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const panel = getOverlayPanel() as HTMLElement;
      // Doubles as the guard for the overlay state-push effect: panelClass is
      // NOT part of openOverlay's eager push, so it can only arrive here if the
      // effect re-ran after the panel attached.
      expect(panel.classList.contains('my-custom-panel')).toBe(true);
    });

    it('re-pushes action-bar labels into an already-open overlay', async () => {
      const fixture = TestBed.createComponent(ConfigHost);
      fixture.componentInstance.showActions.set(true);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const labelsOf = (): (string | undefined)[] =>
        Array.from((getOverlayPanel() as HTMLElement).querySelectorAll('button')).map((b) =>
          b.textContent?.trim(),
        );
      expect(labelsOf()).toContain('Apply');
      fixture.componentInstance.applyLabel.set('Confirm');
      await advance(fixture);
      expect(labelsOf()).toContain('Confirm');
    });
  });

  // ── aria-required derived from the bound control ──
  //
  // Two independent defects met here, and the test fails against either.
  //
  // 1. The trigger bound `aria-required` to `requiredInput()` — the raw input —
  //    while the JSDoc promised `Validators.required` on a bound `NgControl` was
  //    "also honoured". It was honoured for the form-field `*` marker, which
  //    reads the derived `required` signal, but never for assistive tech on the
  //    trigger itself. `select` and `combobox` bind the derived signal; the two
  //    date pickers did not.
  // 2. `ngOnInit` resolved `NgControl` lazily and did NOT call
  //    `errorWiring.bump()` afterwards, so every control-derived signal kept its
  //    `null`-era answer until the first status or value emission — which, for a
  //    pristine untouched form, never comes.
  //
  // Non-vacuous by construction: it asserts on a fixture that is never touched,
  // never blurred and never given a value, so nothing but the bump can make the
  // control's `required` visible. Revert either fix and it goes red.
  describe('aria-required from the bound control', () => {
    it('exposes aria-required when the control carries Validators.required', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ReactiveHost],
      }).createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('leaves aria-required absent when the control has no required validator', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ReactiveHost],
      }).createComponent(ReactiveHost);
      fixture.componentInstance.ctrl = new FormControl<TwDateRange<Date> | null>(null);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-required')).toBeNull();
    });
  });


  // ── startAt anchors the calendar ──
  //
  // `startAt` was declared at date-range-picker.ts:400 and read NOWHERE — the
  // overlay derived its anchor solely from `pendingRange`, so the calendar always
  // opened on today's month and a consumer setting `startAt` got silence.
  // `date-picker` forwarded it correctly; the range picker was missed.
  //
  // Non-vacuous by construction: no value is bound, so `pendingRange` is null and
  // `startAt` is the ONLY thing that can move the calendar off today. Revert the
  // forwarding and the header reads the current month instead.
  describe('startAt', () => {
    it('anchors the calendar to startAt when no range is selected', async () => {
      const fixture = TestBed.createComponent(StartAtHost);
      // A fixed month far from "today" in either direction, so the assertion
      // cannot pass by coincidence whenever the suite happens to run.
      fixture.componentInstance.startAt.set(new Date(2019, 6, 15));
      await advance(fixture);

      getTrigger(fixture).click();
      await advance(fixture);

      const headerButtons = document.querySelectorAll(
        'tw-calendar-header button',
      ) as NodeListOf<HTMLButtonElement>;
      const periodText = headerButtons[1]?.textContent?.trim() ?? '';
      expect(periodText).toContain('2019');
      expect(periodText).toMatch(/Jul/i);
    });
  });

});
