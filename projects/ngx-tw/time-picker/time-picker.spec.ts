import { describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import type { TwColor } from '@cdevhub/ngx-tw/core';
import { TimePickerComponent } from './time-picker';
import { provideTimePickerIntl, TimePickerIntl } from './time-picker-intl';
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
      [referenceDate]="referenceDate()"
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
  referenceDate = signal<Date | null>(null);
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

@Component({
  imports: [TimePickerComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-time-picker
    aria-label="Signal"
    [formField]="model.time"
    [minuteStep]="15"
  />`,
})
class SignalHost {
  protected readonly state = signal<{ time: Date | null }>({ time: null });
  protected readonly model = form(this.state, (path) => {
    required(path.time, { message: 'Time is required.' });
  });
}

@Component({
  imports: [TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-time-picker
    aria-label="Color"
    format="12h"
    [color]="color()"
    [value]="value()"
  />`,
})
class ColorHost {
  color = signal<TwColor>('primary');
  value = signal<Date | null>(new Date(2026, 0, 1, 14, 30, 0));
}

// ── Helpers ───────────────────────────────────────────────────────

function setup<T>(host: Type<T>, extraProviders: unknown[] = []): ComponentFixture<T> {
  TestBed.configureTestingModule({
    providers: [provideNativeDateAdapter(), ...(extraProviders as never[])],
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

    it('preserves seconds when toggling showSeconds after a value is set', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.showSeconds.set(true);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 20, 30));
      fixture.detectChanges();
      expect(queryField(fixture, 'Seconds').value).toBe('30');

      fixture.componentInstance.showSeconds.set(false);
      fixture.detectChanges();
      const hidden = (fixture.nativeElement as HTMLElement).querySelector(
        'input[aria-label="Seconds"]',
      );
      expect(hidden).toBeNull();

      fixture.componentInstance.showSeconds.set(true);
      fixture.detectChanges();
      expect(queryField(fixture, 'Seconds').value).toBe('30');
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

    it('shift+ArrowUp multiplies the step by 2', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 0, 0));
      fixture.componentInstance.minuteStep.set(5);
      fixture.detectChanges();

      const minute = queryField(fixture, 'Minutes');
      minute.focus();
      keydown(minute, 'ArrowUp', { shiftKey: true });
      fixture.detectChanges();

      expect(fixture.componentInstance.value()?.getMinutes()).toBe(10);
    });

    it('hourStep larger than 1 steps by the configured amount', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 9, 0, 0));
      fixture.componentInstance.hourStep.set(3);
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      hour.focus();
      keydown(hour, 'ArrowUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()?.getHours()).toBe(12);
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

  describe('keyboard navigation', () => {
    it('ArrowLeft at caret-start moves focus to the previous field', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 30, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      const minute = queryField(fixture, 'Minutes');
      minute.focus();
      minute.setSelectionRange(0, 0);
      keydown(minute, 'ArrowLeft');
      fixture.detectChanges();

      expect(document.activeElement).toBe(hour);
    });

    it('ArrowRight at caret-end moves focus to the next field', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 30, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      const minute = queryField(fixture, 'Minutes');
      hour.focus();
      hour.setSelectionRange(hour.value.length, hour.value.length);
      keydown(hour, 'ArrowRight');
      fixture.detectChanges();

      expect(document.activeElement).toBe(minute);
    });

    it('Home/End clamp the focused field to min/max', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 10, 30, 0));
      fixture.detectChanges();

      const minute = queryField(fixture, 'Minutes');
      minute.focus();
      keydown(minute, 'End');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()?.getMinutes()).toBe(59);

      keydown(minute, 'Home');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()?.getMinutes()).toBe(0);
    });

    it('terminal-digit auto-advances to the next field', () => {
      const fixture = setup(BasicHost);
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      const minute = queryField(fixture, 'Minutes');
      // Typing "3" in a 24h hour field cannot grow into a two-digit value (max 23 → 3X is invalid).
      // The buffer should auto-advance to the minute field after the single digit.
      typeDigit(hour, '3');
      fixture.detectChanges();
      expect(document.activeElement).toBe(minute);
    });
  });

  describe('referenceDate', () => {
    it('uses today as the date portion when value is null and no reference is set', () => {
      const fixture = setup(BasicHost);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '1');
      typeDigit(hour, '0');
      fixture.detectChanges();
      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '0');
      typeDigit(minute, '0');
      fixture.detectChanges();

      const v = fixture.componentInstance.value();
      expect(v).not.toBeNull();
      expect(v?.getFullYear()).toBe(today.getFullYear());
      expect(v?.getMonth()).toBe(today.getMonth());
      expect(v?.getDate()).toBe(today.getDate());
    });

    it('uses referenceDate as the date portion when value is null', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.referenceDate.set(new Date(2030, 5, 15, 0, 0, 0));
      fixture.detectChanges();

      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '0');
      typeDigit(hour, '7');
      fixture.detectChanges();
      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '4');
      typeDigit(minute, '5');
      fixture.detectChanges();

      const v = fixture.componentInstance.value();
      expect(v?.getFullYear()).toBe(2030);
      expect(v?.getMonth()).toBe(5);
      expect(v?.getDate()).toBe(15);
      expect(v?.getHours()).toBe(7);
      expect(v?.getMinutes()).toBe(45);
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

    it('meridiem buttons expose role="radio" with aria-checked', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.detectChanges();

      const am = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="AM"]',
      ) as HTMLButtonElement;
      const pm = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="PM"]',
      ) as HTMLButtonElement;
      expect(am.getAttribute('role')).toBe('radio');
      expect(pm.getAttribute('role')).toBe('radio');
      expect(pm.getAttribute('aria-checked')).toBe('true');
      expect(am.getAttribute('aria-checked')).toBe('false');
      expect(am.getAttribute('aria-pressed')).toBeNull();
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

    it('field uses the canonical focus-visible outline ring class', () => {
      const fixture = setup(BasicHost);
      fixture.detectChanges();
      const hour = queryField(fixture, 'Hours');
      expect(hour.className).toContain('focus-visible:outline-2');
      expect(hour.className).toContain('focus-visible:outline-primary-500');
      expect(hour.className).not.toContain('focus-visible:bg-surface-muted');
    });

    it('active meridiem button uses the text-on-primary semantic token', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.detectChanges();

      const pm = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="PM"]',
      ) as HTMLButtonElement;
      expect(pm.className).toContain('text-on-primary');
      expect(pm.className).not.toContain('text-primary-50');
    });

    it('active meridiem button routes through the color input across every semantic color', () => {
      const fixture = setup(ColorHost);
      const colors: readonly { color: TwColor; bg: string; text: string }[] = [
        { color: 'primary', bg: 'bg-primary-500', text: 'text-on-primary' },
        { color: 'secondary', bg: 'bg-secondary-500', text: 'text-on-secondary' },
        { color: 'accent', bg: 'bg-accent-500', text: 'text-on-accent' },
        { color: 'neutral', bg: 'bg-fg', text: 'text-on-neutral' },
        { color: 'info', bg: 'bg-info-500', text: 'text-on-info' },
        { color: 'success', bg: 'bg-success-500', text: 'text-on-success' },
        { color: 'warning', bg: 'bg-warning-500', text: 'text-on-warning' },
        { color: 'error', bg: 'bg-error-500', text: 'text-on-error' },
      ];
      for (const { color, bg, text } of colors) {
        fixture.componentInstance.color.set(color);
        fixture.detectChanges();
        const pm = (fixture.nativeElement as HTMLElement).querySelector(
          'button[aria-label="PM"]',
        ) as HTMLButtonElement;
        expect(pm.className, `active background for ${color}`).toContain(bg);
        expect(pm.className, `active foreground for ${color}`).toContain(text);
      }
    });
  });

  describe('intl', () => {
    it('uses provided TimePickerIntl labels in the DOM', () => {
      const fixture = setup(BasicHost, [
        provideTimePickerIntl({
          hoursLabel: 'Heures',
          minutesLabel: 'Min',
          groupLabel: 'Heure',
          meridiemGroupLabel: 'AM ou PM',
          amLabel: 'Matin',
          pmLabel: 'Soir',
        }),
      ]);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.componentInstance.ariaLabel.set(undefined);
      fixture.detectChanges();

      const hostEl = fixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('input[aria-label="Heures"]')).toBeTruthy();
      expect(hostEl.querySelector('input[aria-label="Min"]')).toBeTruthy();
      expect(
        hostEl.querySelector('[role="group"]')?.getAttribute('aria-label'),
      ).toBe('Heure');
      expect(
        hostEl.querySelector('[role="radiogroup"]')?.getAttribute('aria-label'),
      ).toBe('AM ou PM');
      expect(hostEl.querySelector('button[aria-label="Soir"]')).toBeTruthy();
      // The displayed button text should also use the override.
      const pm = hostEl.querySelector(
        'button[aria-label="Soir"]',
      ) as HTMLButtonElement;
      expect(pm.textContent?.trim()).toBe('Soir');
    });

    it('defaults preserve the English labels when no intl is provided', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.detectChanges();

      const intl = TestBed.runInInjectionContext(() => new TimePickerIntl());
      expect(intl.hoursLabel).toBe('Hours');
      expect(intl.minutesLabel).toBe('Minutes');
      expect(intl.amLabel).toBe('AM');
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

    it('reactive form: writeValue("not-a-date") clears fields and flips aria-invalid', () => {
      const fixture = setup(ReactiveHost);
      // FormControl coerces strings to the value as-is — adapter rejects.
      fixture.componentInstance.control.setValue('not-a-date' as unknown as Date);
      fixture.detectChanges();
      const hour = queryField(fixture, 'Hours');
      expect(hour.value).toBe('');
      // rangeError forces errorState → aria-invalid.
      expect(hour.getAttribute('aria-invalid')).toBe('true');
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

    it('signal forms: typing into the field updates the bound state', () => {
      const fixture = setup(SignalHost);
      const hour = queryField(fixture, 'Hours');
      typeDigit(hour, '0');
      typeDigit(hour, '9');
      fixture.detectChanges();
      const minute = queryField(fixture, 'Minutes');
      typeDigit(minute, '4');
      typeDigit(minute, '5');
      fixture.detectChanges();

      // The host's `state` signal should receive the value via the form-field
      // binding. We assert through the DOM since `state` is private.
      expect(queryField(fixture, 'Hours').value).toBe('09');
      expect(queryField(fixture, 'Minutes').value).toBe('45');
    });
  });
});
