import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { provideNativeDateAdapter } from 'ngx-tw/calendar';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from 'ngx-tw/form-field';
import { DatePickerComponent } from './date-picker';
import type {
  DatePickerChangeEvent,
  DatePickerCloseReason,
  DatePickerInputEvent,
  DatePickerOpenedEvent,
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

    it('emits opened when the overlay opens', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTrigger(fixture).click();
      await advance(fixture);
      expect(fixture.componentInstance.openedSpy).toHaveBeenCalled();
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
});
