import { describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideNativeDateAdapter } from 'ngx-tw/calendar';
import { TimePickerComponent } from './time-picker';
import type {
  TimePickerChangeEvent,
  TimePickerFormat,
} from './time-picker';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-time-picker
      [(value)]="value"
      [format]="format()"
      [showSeconds]="showSeconds()"
      [disabled]="disabled()"
      [required]="required()"
      [readonly]="readonly()"
      [minTime]="minTime()"
      [maxTime]="maxTime()"
      [hourStep]="hourStep()"
      [minuteStep]="minuteStep()"
      [secondStep]="secondStep()"
      [aria-label]="ariaLabel()"
      (timeChange)="changeSpy($event)"
      (timeInput)="inputSpy($event)"
    />
  `,
})
class BasicHost {
  value = signal<Date | null>(null);
  format = signal<TimePickerFormat>('24h');
  showSeconds = signal(false);
  disabled = signal(false);
  required = signal(false);
  readonly = signal(false);
  minTime = signal<Date | null>(null);
  maxTime = signal<Date | null>(null);
  hourStep = signal(1);
  minuteStep = signal(1);
  secondStep = signal(1);
  ariaLabel = signal<string | undefined>('Test time');
  changeSpy = vi.fn();
  inputSpy = vi.fn();
}

@Component({
  imports: [TimePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-time-picker aria-label="Reactive" [formControl]="control" />`,
})
class ReactiveHost {
  control = new FormControl<Date | null>(null, Validators.required);
}

@Component({
  imports: [TimePickerComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-time-picker aria-label="TD" [(ngModel)]="value" />`,
})
class TemplateHost {
  value: Date | null = null;
}

// ── Helpers ───────────────────────────────────────────────────────

function setup<T>(host: Type<T>): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [provideNativeDateAdapter()],
  });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture;
}

function queryField(
  fixture: ComponentFixture<unknown>,
  label: 'Hours' | 'Minutes' | 'Seconds',
): HTMLInputElement {
  const input = (fixture.nativeElement as HTMLElement).querySelector(
    `input[aria-label="${label}"]`,
  );
  if (!input) throw new Error(`Field ${label} not found`);
  return input as HTMLInputElement;
}

function typeDigit(el: HTMLInputElement, digit: string): void {
  el.focus();
  const before = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: digit,
    cancelable: true,
    bubbles: true,
  });
  el.dispatchEvent(before);
}

function keydown(el: HTMLElement, key: string, opts: KeyboardEventInit = {}): KeyboardEvent {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  el.dispatchEvent(ev);
  return ev;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('TimePickerComponent', () => {
  describe('rendering', () => {
    it('renders without errors when no value is provided', () => {
      const fixture = setup(BasicHost);
      expect(fixture.nativeElement.querySelector('tw-time-picker')).toBeTruthy();
      expect(queryField(fixture, 'Hours')).toBeTruthy();
      expect(queryField(fixture, 'Minutes')).toBeTruthy();
    });

    it('does not render the seconds field by default', () => {
      const fixture = setup(BasicHost);
      const second = (fixture.nativeElement as HTMLElement).querySelector(
        'input[aria-label="Seconds"]',
      );
      expect(second).toBeNull();
    });

    it('renders the seconds field when showSeconds is true', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.showSeconds.set(true);
      fixture.detectChanges();
      expect(queryField(fixture, 'Seconds')).toBeTruthy();
    });

    it('renders the AM/PM toggle only when format is 12h', () => {
      const fixture = setup(BasicHost);
      const hostEl = fixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('[role="radiogroup"]')).toBeNull();
      fixture.componentInstance.format.set('12h');
      fixture.detectChanges();
      expect(hostEl.querySelector('[role="radiogroup"]')).toBeTruthy();
    });

    it('shows initial value as zero-padded text', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 3, 21, 9, 5, 0));
      fixture.detectChanges();
      expect(queryField(fixture, 'Hours').value).toBe('09');
      expect(queryField(fixture, 'Minutes').value).toBe('05');
    });
  });

  describe('inputs & outputs', () => {
    it('typing two digits commits and emits timeChange', async () => {
      const fixture = setup(BasicHost);
      const host = fixture.componentInstance;

      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '1');
      typeDigit(hour, '4');
      fixture.detectChanges();

      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '3');
      typeDigit(minute, '0');
      fixture.detectChanges();

      expect(host.value()?.getHours()).toBe(14);
      expect(host.value()?.getMinutes()).toBe(30);
      expect(host.changeSpy).toHaveBeenCalled();
      const lastEvent: TimePickerChangeEvent<Date> =
        host.changeSpy.mock.calls[host.changeSpy.mock.calls.length - 1][0];
      expect(lastEvent.source).toBe('input');
    });

    it('arrow up on minutes increments by minuteStep and wraps', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 45, 0));
      fixture.componentInstance.minuteStep.set(15);
      fixture.detectChanges();

      const minute = queryField(fixture, 'Minutes');
      minute.focus();
      keydown(minute, 'ArrowUp');
      fixture.detectChanges();

      expect(fixture.componentInstance.value()?.getMinutes()).toBe(0);
    });

    it('arrow down on hours decrements in 24h mode', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 0, 0, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      hour.focus();
      keydown(hour, 'ArrowDown');
      fixture.detectChanges();

      expect(fixture.componentInstance.value()?.getHours()).toBe(23);
    });

    it('AM/PM toggle flips the stored hour by 12', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 9, 15, 0));
      fixture.detectChanges();

      const pm = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="PM"]',
      ) as HTMLButtonElement;
      pm.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.value()?.getHours()).toBe(21);
    });

    it('clear button resets value and emits with source "clear"', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 9, 15, 0));
      fixture.detectChanges();

      const clearBtn = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="Clear time"]',
      ) as HTMLButtonElement;
      expect(clearBtn).toBeTruthy();
      clearBtn.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.value()).toBeNull();
      const ev: TimePickerChangeEvent<Date> =
        fixture.componentInstance.changeSpy.mock.calls.at(-1)?.[0];
      expect(ev?.source).toBe('clear');
    });

    it('renders hour in 12h format after switching from 24h', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 15, 0, 0));
      fixture.detectChanges();
      expect(queryField(fixture, 'Hours').value).toBe('15');

      fixture.componentInstance.format.set('12h');
      fixture.detectChanges();
      expect(queryField(fixture, 'Hours').value).toBe('03');
    });
  });

  describe('range validation', () => {
    it('sets aria-invalid when value is outside [minTime, maxTime]', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.minTime.set(new Date(2026, 0, 1, 9, 0, 0));
      fixture.componentInstance.maxTime.set(new Date(2026, 0, 1, 17, 0, 0));
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 7, 0, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      expect(hour.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('disabled & readonly', () => {
    it('disabled blocks stepping and does not emit', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 0, 0));
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      fixture.componentInstance.changeSpy.mockClear();
      const hour = queryField(fixture, 'Hours');
      hour.focus();
      keydown(hour, 'ArrowUp');
      fixture.detectChanges();

      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.value()?.getHours()).toBe(10);
    });

    it('readonly blocks typing', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 0, 0));
      fixture.componentInstance.readonly.set(true);
      fixture.detectChanges();

      fixture.componentInstance.changeSpy.mockClear();
      const hour = queryField(fixture, 'Hours');
      hour.focus();
      keydown(hour, 'ArrowUp');
      fixture.detectChanges();

      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('each field has spinbutton role and aria-value attrs', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      expect(hour.getAttribute('role')).toBe('spinbutton');
      expect(hour.getAttribute('aria-valuenow')).toBe('14');
      expect(hour.getAttribute('aria-valuetext')).toBe('14');
      expect(hour.getAttribute('aria-valuemin')).toBe('0');
      expect(hour.getAttribute('aria-valuemax')).toBe('23');
    });

    it('aria-valuetext includes AM/PM in 12h mode', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      expect(hour.getAttribute('aria-valuetext')).toBe('02 PM');
    });

    it('host exposes aria-disabled when disabled', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      const host = (fixture.nativeElement as HTMLElement).querySelector(
        'tw-time-picker',
      ) as HTMLElement;
      expect(host.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('forms integration', () => {
    it('reactive form: writeValue populates fields', () => {
      const fixture = setup(ReactiveHost);
      fixture.componentInstance.control.setValue(new Date(2026, 0, 1, 8, 45, 0));
      fixture.detectChanges();
      expect(queryField(fixture, 'Hours').value).toBe('08');
      expect(queryField(fixture, 'Minutes').value).toBe('45');
    });

    it('reactive form: typing updates the control value', () => {
      const fixture = setup(ReactiveHost);
      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '1');
      typeDigit(hour, '7');
      fixture.detectChanges();
      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '0');
      typeDigit(minute, '0');
      fixture.detectChanges();
      expect(fixture.componentInstance.control.value?.getHours()).toBe(17);
    });

    it('reactive form: setDisabledState disables interaction', () => {
      const fixture = setup(ReactiveHost);
      fixture.componentInstance.control.disable();
      fixture.detectChanges();
      const hour = queryField(fixture, 'Hours');
      expect(hour.disabled).toBe(true);
    });

    it('template-driven form: ngModel round-trips', async () => {
      const fixture = setup(TemplateHost);
      // Typing into the control should push through ngModel to the host value.
      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '1');
      typeDigit(hour, '1');
      fixture.detectChanges();
      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '1');
      typeDigit(minute, '5');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.value?.getHours()).toBe(11);
      expect(fixture.componentInstance.value?.getMinutes()).toBe(15);
    });
  });
});
