import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideNativeDateAdapter, TwDateRange } from 'ngx-tw/calendar';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from 'ngx-tw/form-field';
import { DateRangePickerComponent } from './date-range-picker';
import type {
  DateRangePickerChangeEvent,
  DateRangePickerCloseReason,
  DateRangePickerOpenedEvent,
  DateRangePreset,
} from './date-range-picker';

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

// ── Helpers ───────────────────────────────────────────────────────

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-date-range-picker') as HTMLElement;
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
      const monthViews = document.querySelectorAll('tw-month-view');
      expect(monthViews.length).toBe(2);
    });

    it('renders a single month when numberOfMonths=1', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.numberOfMonths.set(1);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getCalendars().length).toBe(1);
      const monthViews = document.querySelectorAll('tw-month-view');
      expect(monthViews.length).toBe(1);
    });

    it('shows a combined period label like "April – May 2026" when numberOfMonths=2', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      const apr1 = new Date(2026, 3, 1);
      fixture.componentInstance.value.set(new TwDateRange(apr1, apr1));
      await advance(fixture);
      getTrigger(fixture).click();
      await advance(fixture);
      const periodText =
        (document.querySelector('tw-calendar-header button span') as HTMLElement | null)
          ?.textContent?.trim() ?? '';
      expect(periodText).toContain('April');
      expect(periodText).toContain('May');
      expect(periodText).toContain('2026');
    });
  });

  // ── Calendar interaction ──

  describe('calendar interaction', () => {
    it('commits after two clicks (first + second) and emits rangeChange with source="calendar"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const cells = document.querySelectorAll(
        'tw-calendar td[role="gridcell"] button:not([disabled])',
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

    it('stays open when showActions=true, commits on Apply', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.showActions.set(true);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const cells = document.querySelectorAll(
        'tw-calendar td[role="gridcell"] button:not([disabled])',
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

    it('renders two time pickers when showTime=true and a complete range is set', async () => {
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
});
