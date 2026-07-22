import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, LOCALE_ID, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from '@cdevhub/ngx-tw/form-field';
import { DatePickerComponent } from './date-picker';
import type {
  DatePickerChangeEvent,
  DatePickerCloseReason,
  DatePickerInputEvent,
  DatePickerOpenedEvent,
  DatePickerPreset,
  DatePickerTimeConfig,
} from './date-picker';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-picker
      [(value)]="value"
      [(open)]="open"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [dateFilter]="dateFilter()"
      [disabled]="disabled()"
      [required]="required()"
      [showActions]="showActions()"
      [showClear]="showClear()"
      [size]="size()"
      [color]="color()"
      [placeholder]="placeholder()"
      [aria-label]="ariaLabel()"
      (opened)="onOpened($event)"
      (closed)="onClosed($event)"
      (dateInput)="onDateInput($event)"
      (dateChange)="onDateChange($event)"
    />
  `,
})
class BasicHost {
  value = signal<Date | null>(null);
  open = signal(false);
  minDate = signal<Date | null>(null);
  maxDate = signal<Date | null>(null);
  dateFilter = signal<((d: Date) => boolean) | null>(null);
  disabled = signal(false);
  required = signal(false);
  showActions = signal(false);
  showClear = signal(true);
  size = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  color = signal<
    'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error'
  >('primary');
  placeholder = signal<string | undefined>('Pick a date');
  ariaLabel = signal<string | undefined>('Birthday');

  openedSpy = vi.fn();
  closedSpy = vi.fn();
  dateInputSpy = vi.fn();
  dateChangeSpy = vi.fn();

  onOpened(ev: DatePickerOpenedEvent): void {
    this.openedSpy(ev);
  }
  onClosed(ev: DatePickerCloseReason): void {
    this.closedSpy(ev);
  }
  onDateInput(ev: DatePickerInputEvent<Date>): void {
    this.dateInputSpy(ev);
  }
  onDateChange(ev: DatePickerChangeEvent<Date>): void {
    this.dateChangeSpy(ev);
  }
}

@Component({
  imports: [DatePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-picker
      [formControl]="ctrl"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      aria-label="Validated"
    />
  `,
})
class ValidatedReactiveHost {
  readonly ctrl = new FormControl<Date | null>(null);
  readonly minDate = signal<Date | null>(new Date(2026, 3, 1));
  readonly maxDate = signal<Date | null>(new Date(2026, 3, 30));
}

@Component({
  imports: [DatePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-picker [formControl]="ctrl" aria-label="Reactive" />`,
})
class ReactiveHost {
  ctrl = new FormControl<Date | null>(null, Validators.required);
}

@Component({
  imports: [DatePickerComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-picker [(ngModel)]="value" aria-label="Template" />`,
})
class TemplateDrivenHost {
  value: Date | null = null;
}

@Component({
  imports: [
    DatePickerComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Delivery date</label>
      <tw-date-picker [formControl]="ctrl" />
      <span twHint>Pick a weekday.</span>
      <span twError>Required.</span>
    </tw-form-field>
  `,
})
class FormFieldHost {
  ctrl = new FormControl<Date | null>(null, Validators.required);
}

// ── Helpers ───────────────────────────────────────────────────────

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-date-picker') as HTMLElement;
}

function getInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector(
    'tw-date-picker input[type="text"]',
  ) as HTMLInputElement;
}

function getTrigger(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector(
    'tw-date-picker button[aria-haspopup="dialog"]',
  ) as HTMLButtonElement;
}

function getClearButton(fixture: ComponentFixture<unknown>): HTMLButtonElement | null {
  return fixture.nativeElement.querySelector(
    'tw-date-picker button[aria-label="Clear date"]',
  ) as HTMLButtonElement | null;
}

function getOverlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane tw-date-picker-overlay');
}

function getDialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function dispatchKeyOn(el: HTMLElement, key: string, opts: KeyboardEventInit = {}): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts }));
}

async function advance(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

// ── Tests ─────────────────────────────────────────────────────────

describe('DatePickerComponent', () => {
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
      expect(getInput(fixture)).toBeTruthy();
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

    it('reports data-variant="default" when standalone', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('data-variant')).toBe('default');
    });

    it('shows placeholder on the input', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getInput(fixture).placeholder).toBe('Pick a date');
    });

    it('sets role="combobox" and aria-haspopup="dialog" on the input', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const input = getInput(fixture);
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-haspopup')).toBe('dialog');
      expect(input.getAttribute('aria-expanded')).toBe('false');
    });

    it('reflects aria-label on the input', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('aria-label')).toBe('Birthday');
    });

    it('formats the value in the input when set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21));
      await advance(fixture);
      expect(getInput(fixture).value).not.toBe('');
    });
  });

  // ── Inputs / attributes ──

  describe('inputs', () => {
    it('reflects aria-required when required=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('disables the input when disabled=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getInput(fixture).disabled).toBe(true);
      expect(getTrigger(fixture).disabled).toBe(true);
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

  // ── Clear button ──

  describe('clear button', () => {
    it('hides when no value is set', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getClearButton(fixture)).toBeNull();
    });

    it('shows when value is set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21));
      await advance(fixture);
      expect(getClearButton(fixture)).toBeTruthy();
    });

    it('clears the value and emits dateChange with source="clear"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21));
      await advance(fixture);
      getClearButton(fixture)!.click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
      const calls = fixture.componentInstance.dateChangeSpy.mock.calls;
      const clearCall = calls.find((c) => c[0].source === 'clear');
      expect(clearCall).toBeTruthy();
    });

    it('is hidden when showClear=false', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21));
      fixture.componentInstance.showClear.set(false);
      await advance(fixture);
      expect(getClearButton(fixture)).toBeNull();
    });
  });

  // ── Typed input ──

  describe('typed input', () => {
    it('emits dateInput on every keystroke', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const input = getInput(fixture);
      typeInto(input, '2026');
      typeInto(input, '2026-04');
      expect(fixture.componentInstance.dateInputSpy).toHaveBeenCalledTimes(2);
    });

    it('parses on blur and commits a valid date', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const input = getInput(fixture);
      typeInto(input, '2026-04-21');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeInstanceOf(Date);
      const calls = fixture.componentInstance.dateChangeSpy.mock.calls;
      expect(calls.some((c) => c[0].source === 'input')).toBe(true);
    });

    it('sets aria-invalid on unparseable input', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const input = getInput(fixture);
      typeInto(input, 'not a date');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('sets aria-invalid on out-of-range input', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.minDate.set(new Date(2026, 3, 1));
      fixture.componentInstance.maxDate.set(new Date(2026, 3, 30));
      fixture.detectChanges();
      const input = getInput(fixture);
      typeInto(input, '2025-01-01');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(input.getAttribute('aria-invalid')).toBe('true');
    });

    it('commits null when input is cleared and blurred', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21));
      await advance(fixture);
      const input = getInput(fixture);
      typeInto(input, '');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('commits on Enter', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const input = getInput(fixture);
      typeInto(input, '2026-05-15');
      dispatchKeyOn(input, 'Enter');
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeInstanceOf(Date);
    });
  });

  // ── Open / close ──

  describe('open / close lifecycle', () => {
    it('opens the overlay on trigger click', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
      expect(getInput(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('renders the dialog with role="dialog" and aria-modal="true"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const dialog = getDialog();
      expect(dialog).toBeTruthy();
      expect(dialog!.getAttribute('aria-modal')).toBe('true');
      expect(dialog!.getAttribute('aria-label')).toBe('Birthday');
    });

    it('emits opened after the enter animation completes', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        // opened$ fires after PICKER_ENTER_DURATION (140ms) — synchronous
        // emission was the audit's Medium-finding bug; we now defer.
        expect(fixture.componentInstance.openedSpy).not.toHaveBeenCalled();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(fixture.componentInstance.openedSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('reopens cleanly after a full close cycle', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        expect(getOverlayPanel()).toBeTruthy();
        // First close — wait for leave-animation timer.
        dispatchKeyOn(getInput(fixture), 'Escape');
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(getOverlayPanel()).toBeFalsy();
        // Re-open — coordinator must build a fresh OverlayRef.
        getTrigger(fixture).click();
        fixture.detectChanges();
        expect(getOverlayPanel()).toBeTruthy();
      } finally {
        vi.useRealTimers();
      }
    });

    it('closes on Escape and restores previous value', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.componentInstance.value.set(new Date(2026, 3, 21));
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        dispatchKeyOn(getInput(fixture), 'Escape');
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(getInput(fixture).getAttribute('aria-expanded')).toBe('false');
        const calls = fixture.componentInstance.closedSpy.mock.calls;
        expect(calls.some((c) => c[0] === 'escape')).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('closes on backdrop click', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        const backdrop = document.querySelector(
          '.cdk-overlay-backdrop',
        ) as HTMLElement | null;
        expect(backdrop).toBeTruthy();
        backdrop!.click();
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        const calls = fixture.componentInstance.closedSpy.mock.calls;
        expect(calls.some((c) => c[0] === 'backdrop')).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('opens via Alt+ArrowDown on the input', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getInput(fixture), 'ArrowDown', { altKey: true });
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });

    it('opens via Enter on the trigger', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTrigger(fixture), 'Enter');
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });
  });

  // ── Calendar picking ──

  describe('calendar picking', () => {
    it('commits a date picked in the calendar and closes the overlay', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        // Find an enabled cell button in the calendar's month view and click it.
        const cell = document.querySelector(
          'tw-calendar [role="gridcell"] button:not([disabled])',
        ) as HTMLButtonElement | null;
        expect(cell).toBeTruthy();
        cell!.click();
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBeInstanceOf(Date);
        const calls = fixture.componentInstance.dateChangeSpy.mock.calls;
        expect(calls.some((c) => c[0].source === 'calendar')).toBe(true);
        expect(
          fixture.componentInstance.closedSpy.mock.calls.some((c) => c[0] === 'select'),
        ).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ── Action bar ──

  describe('action bar', () => {
    it('does not commit on calendar click when showActions=true', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.showActions.set(true);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      const cell = document.querySelector(
        'tw-calendar [role="gridcell"] button:not([disabled])',
      ) as HTMLButtonElement | null;
      cell!.click();
      await advance(fixture);
      // Overlay still open, value not committed.
      expect(getOverlayPanel()).toBeTruthy();
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('commits on Apply click', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.componentInstance.showActions.set(true);
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        const cell = document.querySelector(
          'tw-calendar [role="gridcell"] button:not([disabled])',
        ) as HTMLButtonElement | null;
        cell!.click();
        fixture.detectChanges();
        const applyButton = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Apply',
        ) as HTMLButtonElement | undefined;
        expect(applyButton).toBeTruthy();
        applyButton!.click();
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()).toBeInstanceOf(Date);
        expect(
          fixture.componentInstance.closedSpy.mock.calls.some((c) => c[0] === 'apply'),
        ).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });

    it('restores previous value on Cancel', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.componentInstance.showActions.set(true);
        fixture.componentInstance.value.set(new Date(2026, 3, 21));
        fixture.detectChanges();
        getTrigger(fixture).click();
        fixture.detectChanges();
        const cell = document.querySelector(
          'tw-calendar [role="gridcell"] button:not([disabled])',
        ) as HTMLButtonElement | null;
        cell!.click();
        fixture.detectChanges();
        const cancelButton = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Cancel',
        ) as HTMLButtonElement | undefined;
        cancelButton!.click();
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        const v = fixture.componentInstance.value();
        expect(v).toBeInstanceOf(Date);
        expect((v as Date).getDate()).toBe(21);
        expect(
          fixture.componentInstance.closedSpy.mock.calls.some((c) => c[0] === 'cancel'),
        ).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ── ControlValueAccessor ──

  describe('ControlValueAccessor', () => {
    it('reactive forms: setValue updates the input display', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.setValue(new Date(2026, 3, 21));
      await advance(fixture);
      expect(getInput(fixture).value).not.toBe('');
    });

    it('reactive forms: disable() blocks interaction', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.disable();
      await advance(fixture);
      expect(getInput(fixture).disabled).toBe(true);
    });

    it('template-driven: [(ngModel)] round-trips via typed input', async () => {
      const fixture = TestBed.createComponent(TemplateDrivenHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = getInput(fixture);
      typeInto(input, '2026-04-21');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(fixture.componentInstance.value).toBeInstanceOf(Date);
    });
  });

  // ── Validator (NG_VALIDATORS) ──
  //
  // These are the guard tests CLAUDE.md calls "the only thing standing between
  // this trap and a silent regression". Under Angular v22 a component exposing
  // a `value` model() is compiled as a signal-forms custom control, and the
  // classic CVA path — the one that runs setUpValidators and composes a
  // self-provided NG_VALIDATORS onto the control — is taken ONLY if a value
  // accessor is visible at directive-creation time. Without the static
  // NG_VALUE_ACCESSOR provider, validate() is never called, every assertion
  // below fails, and nothing else in this file notices.
  //
  // They assert `form.valid`, not just the presence of an error key, because
  // reaching the control's error map is the entire point of the fix.

  describe('validator', () => {
    it('surfaces calendarMinDate on a bound FormControl for a date before minDate', async () => {
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;

      const input = getInput(fixture);
      typeInto(input, '2025-01-01');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect(ctrl.errors).not.toBeNull();
      expect('calendarMinDate' in (ctrl.errors ?? {})).toBe(true);
      expect(ctrl.valid).toBe(false);
    });

    it('surfaces calendarMaxDate for a date after maxDate', async () => {
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;

      const input = getInput(fixture);
      typeInto(input, '2026-12-31');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect('calendarMaxDate' in (ctrl.errors ?? {})).toBe(true);
      expect(ctrl.valid).toBe(false);
    });

    it('commits the out-of-range value to the form rather than dropping it', async () => {
      // The stale-value half of the bug: the control must not silently keep a
      // previous value while the UI shows an error.
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;
      ctrl.setValue(new Date(2026, 3, 15));
      await advance(fixture);

      const input = getInput(fixture);
      typeInto(input, '2025-01-01');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect(ctrl.value?.getFullYear()).toBe(2025);
      expect(ctrl.valid).toBe(false);
    });

    it('surfaces an error and clears the stale value on unparseable text', async () => {
      // Unparseable input must not leave the previously committed date in the
      // form while the field renders an error — and because `null` is valid for
      // a non-required control, the parse failure has to be carried into
      // validate() explicitly rather than inferred from the value.
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;
      ctrl.setValue(new Date(2026, 3, 15));
      await advance(fixture);

      const input = getInput(fixture);
      typeInto(input, 'not a date');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect(ctrl.value).toBeNull();
      expect(ctrl.errors).not.toBeNull();
      expect(ctrl.valid).toBe(false);
      // The text the user typed must stay on screen to be corrected. Clearing
      // the *form value* must not also empty the *input* — an error border over
      // a blank box tells the user nothing about what was rejected.
      expect(getInput(fixture).value).toBe('not a date');
    });

    it('keeps unparseable text visible when there was no prior value', async () => {
      // The null -> null case does not notify the value-sync effect, so it takes
      // a different path than the stale-value case above. Both must behave the
      // same from the user's point of view.
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();

      const input = getInput(fixture);
      typeInto(input, 'nonsense');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect(getInput(fixture).value).toBe('nonsense');
      expect(fixture.componentInstance.ctrl.valid).toBe(false);
    });

    it('clears the error once a valid in-range date is entered', async () => {
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;

      const input = getInput(fixture);
      typeInto(input, 'not a date');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(ctrl.valid).toBe(false);

      typeInto(input, '2026-04-15');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);

      expect(ctrl.errors).toBeNull();
      expect(ctrl.valid).toBe(true);
    });

    it('re-validates when minDate changes after the value was committed', async () => {
      // validate() is inert unless registerOnValidatorChange's callback fires.
      // Without that plumbing the verdict goes stale: right on first blur,
      // wrong the moment the consumer moves the constraint.
      const fixture = TestBed.createComponent(ValidatedReactiveHost);
      fixture.detectChanges();
      const ctrl = fixture.componentInstance.ctrl;

      const input = getInput(fixture);
      typeInto(input, '2026-04-15');
      input.dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(ctrl.valid).toBe(true);

      fixture.componentInstance.minDate.set(new Date(2026, 5, 1));
      await advance(fixture);

      expect(ctrl.valid).toBe(false);
      expect('calendarMinDate' in (ctrl.errors ?? {})).toBe(true);
    });
  });

  // ── Form-field integration ──

  describe('form-field integration', () => {
    it('auto-resolves to naked variant when wrapped', () => {
      const fixture = TestBed.createComponent(FormFieldHost);
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('data-variant')).toBe('naked');
    });

    it('form-field reads the date-picker as its control', () => {
      const fixture = TestBed.createComponent(FormFieldHost);
      fixture.detectChanges();
      const wrapperClass = fixture.nativeElement
        .querySelector('tw-form-field')
        .getAttribute('class');
      expect(wrapperClass).toContain('tw-form-field-type-date-picker');
    });

    it('merges hint id into the input aria-describedby', () => {
      const fixture = TestBed.createComponent(FormFieldHost);
      fixture.detectChanges();
      const described = getInput(fixture).getAttribute('aria-describedby');
      expect(described).toBeTruthy();
      expect(described!.startsWith('tw-form-field-hint-')).toBe(true);
    });
  });

  // ── Dev-mode warning ──

  describe('dev-mode warning', () => {
    it('warns when no accessible name is provided', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      @Component({
        imports: [DatePickerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-date-picker />`,
      })
      class NoLabelHost {}
      const fixture = TestBed.createComponent(NoLabelHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  // ── dateInput parsed payload ──

  describe('dateInput parsed payload', () => {
    it('emits parsed=null while the input is unparseable', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      typeInto(getInput(fixture), 'not a date');
      const ev = fixture.componentInstance.dateInputSpy.mock.calls[0][0] as DatePickerInputEvent<Date>;
      expect(ev.parsed).toBeNull();
    });

    it('emits parsed=<Date> as soon as the input parses cleanly', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      typeInto(getInput(fixture), '2026-04-21');
      const calls = fixture.componentInstance.dateInputSpy.mock.calls;
      const last = calls[calls.length - 1][0] as DatePickerInputEvent<Date>;
      expect(last.parsed).toBeInstanceOf(Date);
    });

    it('rejects out-of-range typed values with parsed=null', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.minDate.set(new Date(2026, 0, 1));
      fixture.componentInstance.maxDate.set(new Date(2026, 11, 31));
      fixture.detectChanges();
      typeInto(getInput(fixture), '2020-01-01');
      const last = fixture.componentInstance.dateInputSpy.mock.calls.at(-1)![0] as DatePickerInputEvent<Date>;
      expect(last.parsed).toBeNull();
    });
  });

  // ── Time config (timeConfig + back-compat) ──

  describe('timeConfig', () => {
    @Component({
      imports: [DatePickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-date-picker
          [(value)]="value"
          [(open)]="open"
          [timeConfig]="cfg()"
          aria-label="Time-mode"
        />
      `,
    })
    class TimeConfigHost {
      value = signal<Date | null>(null);
      open = signal(false);
      cfg = signal<DatePickerTimeConfig<Date> | null>(null);
    }

    it('renders the time-picker inside the overlay when timeConfig is non-null', async () => {
      const fixture = TestBed.createComponent(TimeConfigHost);
      fixture.componentInstance.cfg.set({});
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      expect(document.querySelector('tw-time-picker')).toBeTruthy();
    });

    it('hides the time-picker when timeConfig is null', async () => {
      const fixture = TestBed.createComponent(TimeConfigHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      expect(document.querySelector('tw-time-picker')).toBeNull();
    });

    it('no longer exposes the deprecated standalone time inputs (S19 removal)', () => {
      @Component({
        imports: [DatePickerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-date-picker aria-label="Plain" />`,
      })
      class PlainHost {}
      const fixture = TestBed.createComponent(PlainHost);
      fixture.detectChanges();
      const picker = fixture.debugElement
        .query((el) => el.componentInstance instanceof DatePickerComponent)
        ?.componentInstance as unknown as Record<string, unknown>;
      expect(picker).toBeTruthy();
      // All 8 deprecated inputs are gone in v1; only `timeConfig` remains.
      for (const name of [
        'withTimeInput',
        'timeFormat',
        'showSeconds',
        'hourStep',
        'minuteStep',
        'secondStep',
        'minTime',
        'maxTime',
      ]) {
        expect(picker[name]).toBeUndefined();
      }
    });
  });

  // ── Locale propagation ──

  describe('locale', () => {
    it('forwards a per-instance locale to the embedded calendar', async () => {
      @Component({
        imports: [DatePickerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-date-picker [(open)]="open" locale="de-DE" aria-label="Locale" />`,
      })
      class LocaleHost {
        open = signal(false);
      }
      const fixture = TestBed.createComponent(LocaleHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      // The calendar's header renders the month name through the adapter's locale.
      // For May in de-DE, expect "mai" (German). English would render "may".
      const headerText = (document.querySelector('tw-calendar')?.textContent ?? '').toLowerCase();
      expect(headerText).toMatch(/(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)/);
    });

    it('falls back to LOCALE_ID when locale input is null', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [OverlayModule],
        providers: [provideNativeDateAdapter(), { provide: LOCALE_ID, useValue: 'en-US' }],
      });
      @Component({
        imports: [DatePickerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-date-picker [(open)]="open" aria-label="No-locale" />`,
      })
      class NoLocaleHost {
        open = signal(false);
      }
      const fixture = TestBed.createComponent(NoLocaleHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      expect(document.querySelector('tw-calendar')).toBeTruthy();
    });
  });

  // ── Presets ──

  describe('presets', () => {
    @Component({
      imports: [DatePickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-date-picker
          [(value)]="value"
          [(open)]="open"
          [presets]="presets"
          aria-label="With presets"
          (presetSelected)="presetSpy($event)"
        />
      `,
    })
    class PresetsHost {
      value = signal<Date | null>(null);
      open = signal(false);
      presets: DatePickerPreset<Date>[] = [
        { id: 'today', label: 'Today', date: () => new Date(2026, 3, 21) },
        { id: 'tomorrow', label: 'Tomorrow', date: () => new Date(2026, 3, 22) },
      ];
      presetSpy = vi.fn();
    }

    it('renders the preset list inside the overlay', async () => {
      const fixture = TestBed.createComponent(PresetsHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      const listbox = document.querySelector('[role="listbox"][aria-label="Preset dates"]');
      expect(listbox).toBeTruthy();
      expect(listbox?.querySelectorAll('button').length).toBe(2);
    });

    it('commits the preset value and emits presetSelected when clicked', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(PresetsHost);
        fixture.detectChanges();
        fixture.componentInstance.open.set(true);
        fixture.detectChanges();
        const todayBtn = Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent?.trim() === 'Today',
        ) as HTMLButtonElement | undefined;
        expect(todayBtn).toBeTruthy();
        todayBtn!.click();
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(fixture.componentInstance.value()?.getDate()).toBe(21);
        expect(fixture.componentInstance.presetSpy).toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('hides the preset list when presets is empty', async () => {
      @Component({
        imports: [DatePickerComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-date-picker [(open)]="open" [presets]="[]" aria-label="No presets" />`,
      })
      class EmptyPresetsHost {
        open = signal(false);
      }
      const fixture = TestBed.createComponent(EmptyPresetsHost);
      fixture.detectChanges();
      fixture.componentInstance.open.set(true);
      await advance(fixture);
      expect(document.querySelector('[role="listbox"][aria-label="Preset dates"]')).toBeNull();
    });
  });

  // ── Custom trigger projection ──

  describe('custom trigger projection', () => {
    @Component({
      imports: [DatePickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-date-picker [(value)]="value" [(open)]="open" aria-label="Custom">
          <button slot="trigger" type="button" data-testid="rich-trigger">
            Pick a date please
          </button>
        </tw-date-picker>
      `,
    })
    class CustomTriggerHost {
      value = signal<Date | null>(null);
      open = signal(false);
    }

    it('renders the projected trigger and hides the default input chrome', async () => {
      const fixture = TestBed.createComponent(CustomTriggerHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const rich = fixture.nativeElement.querySelector('[data-testid="rich-trigger"]');
      expect(rich).toBeTruthy();
      const input = getInput(fixture);
      // Input must remain in DOM for form integration, but be sr-only.
      expect(input.className).toMatch(/sr-only/);
      // The default trigger button should not render.
      const defaults = fixture.nativeElement.querySelectorAll('button[aria-haspopup="dialog"]');
      expect(defaults.length).toBe(0);
    });

    it('opens the overlay when the projected trigger is clicked', async () => {
      const fixture = TestBed.createComponent(CustomTriggerHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const rich = fixture.nativeElement.querySelector('[data-testid="rich-trigger"]') as HTMLButtonElement;
      rich.click();
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });
  });

  // ── Focus restore ──

  describe('focus restore', () => {
    it('returns focus to the trigger after Escape closes the overlay', async () => {
      vi.useFakeTimers();
      try {
        const fixture = TestBed.createComponent(BasicHost);
        fixture.detectChanges();
        document.body.appendChild(fixture.nativeElement);
        const trigger = getTrigger(fixture);
        trigger.click();
        fixture.detectChanges();
        dispatchKeyOn(getInput(fixture), 'Escape');
        fixture.detectChanges();
        vi.advanceTimersByTime(200);
        await Promise.resolve();
        fixture.detectChanges();
        expect(document.activeElement).toBe(trigger);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  // ── Signal forms ──

  describe('signal forms', () => {
    @Component({
      imports: [DatePickerComponent, FormField],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <tw-date-picker [formField]="shipForm.shipDate" aria-label="Signal" />
      `,
    })
    class SignalHost {
      shipModel = signal<{ shipDate: Date | null }>({ shipDate: null });
      shipForm = form(this.shipModel, (path) => {
        required(path.shipDate, { message: 'required' });
      });
    }

    it('mounts with a signal-form bound field', () => {
      const fixture = TestBed.createComponent(SignalHost);
      fixture.detectChanges();
      expect(getInput(fixture)).toBeTruthy();
    });

    it('typed input flows back into the signal model', async () => {
      const fixture = TestBed.createComponent(SignalHost);
      fixture.detectChanges();
      typeInto(getInput(fixture), '2026-04-21');
      getInput(fixture).dispatchEvent(new Event('blur'));
      await advance(fixture);
      expect(fixture.componentInstance.shipModel().shipDate).toBeInstanceOf(Date);
    });
  });
});
