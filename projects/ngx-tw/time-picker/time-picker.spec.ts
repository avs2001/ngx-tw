import { describe, expect, it, vi } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import type { TwColor } from '@cdevhub/ngx-tw/core';
import { TimePickerComponent } from './time-picker';
import { provideTimePickerIntl, TimePickerIntl } from './time-picker-intl';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
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
  imports: [TimePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-time-picker
      aria-label="Ranged"
      [formControl]="control"
      [minTime]="minTime()"
      [maxTime]="maxTime()"
    />
  `,
})
class RangedReactiveHost {
  readonly control = new FormControl<Date | null>(null);
  readonly minTime = signal<Date | null>(new Date(2026, 0, 1, 9, 0, 0));
  readonly maxTime = signal<Date | null>(new Date(2026, 0, 1, 17, 0, 0));
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

    // The active meridiem fill takes the theme's AA-checked `-solid` /
    // `-solid-fg` slot pair. It used to take `bg-{role}-500` + `text-on-{role}`:
    // white on blue-500 is 3.76:1 light / 3.92:1 dark against a 4.5:1 bar for
    // this 12px label, which is what put `time-picker` on the a11y backlog.
    it('active meridiem button uses the primary solid slot pair', () => {
      const fixture = setup(BasicHost);
      fixture.componentInstance.format.set('12h');
      fixture.componentInstance.value.set(new Date(2026, 0, 1, 14, 30, 0));
      fixture.detectChanges();

      const pm = (fixture.nativeElement as HTMLElement).querySelector(
        'button[aria-label="PM"]',
      ) as HTMLButtonElement;
      const classes = pm.className.split(/\s+/);
      expect(classes).toContain('bg-primary-solid');
      expect(classes).toContain('text-primary-solid-fg');
      expect(classes).not.toContain('bg-primary-500');
      expect(classes).not.toContain('text-on-primary');
    });

    it('active meridiem button routes through the color input across every semantic color', () => {
      const fixture = setup(ColorHost);
      const colors: readonly TwColor[] = [
        'primary',
        'secondary',
        'accent',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
      ];
      for (const color of colors) {
        fixture.componentInstance.color.set(color);
        fixture.detectChanges();
        const pm = (fixture.nativeElement as HTMLElement).querySelector(
          'button[aria-label="PM"]',
        ) as HTMLButtonElement;
        const classes = pm.className.split(/\s+/);
        expect(classes, `active background for ${color}`).toContain(`bg-${color}-solid`);
        expect(classes, `active foreground for ${color}`).toContain(
          `text-${color}-solid-fg`,
        );
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

    // F-08 — `provideTimePickerIntl` merged with a bare `Object.assign`, which
    // copies own enumerable properties INCLUDING ones whose value is
    // `undefined`. A consumer building the partial from an i18n bundle
    // (`{ hoursLabel: bundle['time.hours'] }`) type-checks on a missing key
    // because the root tsconfig does not set `exactOptionalPropertyTypes`, so
    // the default was silently blanked at bootstrap for every time-picker in
    // the app.
    it('drops explicitly-undefined keys instead of blanking the default label', () => {
      const fixture = setup(BasicHost, [
        provideTimePickerIntl({
          hoursLabel: undefined,
          minutesLabel: 'Min',
        }),
      ]);
      fixture.detectChanges();

      // Before the fix: `Object.assign` copied `hoursLabel: undefined`, so the
      // injected instance reported `undefined` here and this assertion was red.
      const injected = TestBed.inject(TimePickerIntl);
      expect(injected.hoursLabel).toBe('Hours');
      // A defined sibling key in the same object still overrides.
      expect(injected.minutesLabel).toBe('Min');

      // Behavioural half: the stepper aria-label is built by
      // `focusedFieldLabel()`, which calls `.toLowerCase()` on the field label
      // directly. With the default blanked, the FIRST render threw
      // `Cannot read properties of undefined (reading 'toLowerCase')`.
      const hostEl = fixture.nativeElement as HTMLElement;
      expect(hostEl.querySelector('input[aria-label="Hours"]')).toBeTruthy();
      const up = hostEl.querySelector('button[aria-label="Increase hours"]');
      expect(up).toBeTruthy();
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

  // ── Validator (NG_VALIDATORS) ──
  //
  // `minTime` / `maxTime` used to be decorative for form validity: the value
  // committed correctly and the field rendered an error border, but
  // `control.errors` stayed null and `form.valid` stayed true, so a submit guard
  // on `form.invalid` let out-of-range times straight through.
  //
  // These assert `valid === false`, because reaching the control's error map is
  // the whole point. They fail wholesale if the static NG_VALUE_ACCESSOR
  // provider is dropped — under v22 that silently routes the component down the
  // signal-forms custom-control branch, which never calls validate().

  describe('validator', () => {
    it('surfaces timePickerMin on a bound FormControl for a time before minTime', async () => {
      const fixture = setup(RangedReactiveHost);
      const ctrl = fixture.componentInstance.control;

      ctrl.setValue(new Date(2026, 0, 1, 7, 30, 0));
      fixture.detectChanges();
      await fixture.whenStable();

      expect('timePickerMin' in (ctrl.errors ?? {})).toBe(true);
      expect(ctrl.valid).toBe(false);
    });

    it('surfaces timePickerMax for a time after maxTime', async () => {
      const fixture = setup(RangedReactiveHost);
      const ctrl = fixture.componentInstance.control;

      ctrl.setValue(new Date(2026, 0, 1, 19, 0, 0));
      fixture.detectChanges();
      await fixture.whenStable();

      expect('timePickerMax' in (ctrl.errors ?? {})).toBe(true);
      expect(ctrl.valid).toBe(false);
    });

    it('is valid for a time inside the range', async () => {
      const fixture = setup(RangedReactiveHost);
      const ctrl = fixture.componentInstance.control;

      ctrl.setValue(new Date(2026, 0, 1, 12, 0, 0));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(ctrl.errors).toBeNull();
      expect(ctrl.valid).toBe(true);
    });

    it('treats an empty value as valid when the control is not required', async () => {
      const fixture = setup(RangedReactiveHost);
      const ctrl = fixture.componentInstance.control;

      ctrl.setValue(null);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(ctrl.valid).toBe(true);
    });

    it('surfaces a constraint error onto a bound signal-forms field', async () => {
      // The signal-forms binding is not a separate validation world: v22's
      // compat layer maps `timePickerMin` onto a ValidationError whose `kind`
      // is that key, and it relies on the same static NG_VALUE_ACCESSOR
      // provider. Dropping that provider leaves this field `valid()` while the
      // control still renders its error styling.
      @Component({
        imports: [TimePickerComponent, FormField],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-time-picker [formField]="f.at" [minTime]="minTime()" aria-label="Signal" />`,
      })
      class ConstrainedSignalHost {
        readonly minTime = signal<Date | null>(new Date(2026, 0, 1, 9, 0, 0));
        readonly model = signal<{ at: Date | null }>({ at: null });
        readonly f = form(this.model);
      }

      const fixture = setup(ConstrainedSignalHost);
      fixture.componentInstance.model.set({ at: new Date(2026, 0, 1, 7, 30, 0) });
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const state = fixture.componentInstance.f.at();
      const kinds = (state.errors() as unknown as readonly Record<string, unknown>[]).map((e) =>
        String(e['kind']),
      );
      expect(kinds).toContain('timePickerMin');
      expect(state.valid()).toBe(false);
    });

    it('re-validates when minTime moves after the value was committed', async () => {
      // Without registerOnValidatorChange plumbing the verdict goes stale: right
      // on first commit, wrong as soon as the consumer changes the constraint.
      const fixture = setup(RangedReactiveHost);
      const ctrl = fixture.componentInstance.control;

      ctrl.setValue(new Date(2026, 0, 1, 10, 0, 0));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(ctrl.valid).toBe(true);

      fixture.componentInstance.minTime.set(new Date(2026, 0, 1, 11, 0, 0));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(ctrl.valid).toBe(false);
      expect('timePickerMin' in (ctrl.errors ?? {})).toBe(true);
    });
  });


});

// ── form-field interop: accessible name ──────────────────────────

@Component({
  imports: [TimePickerComponent, FormFieldComponent, LabelDirective, HintDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Preferred call time</label>
      <tw-time-picker [(value)]="value" />
      <span twHint>When we can reach you.</span>
    </tw-form-field>
  `,
})
class TimePickerFormFieldHost {
  readonly value = signal<Date | null>(null);
}

@Component({
  imports: [TimePickerComponent, FormFieldComponent, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="tp-external-note">in your local timezone</span>
    <tw-form-field>
      <label twLabel>Preferred call time</label>
      <tw-time-picker aria-labelledby="tp-external-note" />
    </tw-form-field>
  `,
})
class TimePickerFormFieldExternalLabelHost {}

describe('TimePickerComponent inside tw-form-field', () => {
  function group(fixture: ComponentFixture<unknown>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[role="group"]',
    ) as HTMLElement;
  }

  // SC 4.1.2 regression guard. `<tw-time-picker>` is a custom element, so the
  // field's `<label for>` resolves to nothing. Before `setLabelledByIds` was
  // overridden the composite fell back to the generic intl group label ("Time")
  // and the visible label never reached assistive tech at all.
  it('points the group aria-labelledby at the projected form-field label', () => {
    const fixture = setup(TimePickerFormFieldHost);
    const label = (fixture.nativeElement as HTMLElement).querySelector(
      'label[twLabel]',
    ) as HTMLLabelElement;

    const labelledBy = group(fixture).getAttribute('aria-labelledby') ?? '';
    expect(labelledBy.split(' ')).toContain(label.id);
  });

  it('resolves the group aria-labelledby to the visible label text', () => {
    const fixture = setup(TimePickerFormFieldHost);
    const ids = (group(fixture).getAttribute('aria-labelledby') ?? '').split(' ');
    const name = ids
      .map(
        (id) =>
          (fixture.nativeElement as HTMLElement)
            .querySelector(`#${id}`)
            ?.textContent?.trim() ?? '',
      )
      .join(' ')
      .trim();
    expect(name).toBe('Preferred call time');
  });

  it('drops the generic intl group label once a real label names the group', () => {
    const fixture = setup(TimePickerFormFieldHost);
    expect(group(fixture).getAttribute('aria-label')).toBeNull();
  });

  it('keeps both the projected label id and a consumer-supplied aria-labelledby', () => {
    const fixture = setup(TimePickerFormFieldExternalLabelHost);
    const label = (fixture.nativeElement as HTMLElement).querySelector(
      'label[twLabel]',
    ) as HTMLLabelElement;

    const ids = (group(fixture).getAttribute('aria-labelledby') ?? '').split(' ');
    expect(ids).toContain(label.id);
    expect(ids).toContain('tp-external-note');
  });
});

describe('TimePickerComponent standalone accessible name', () => {
  it('applies a consumer aria-labelledby to the group when there is no form-field', () => {
    @Component({
      imports: [TimePickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <span id="tp-standalone-label">Call time</span>
        <tw-time-picker aria-labelledby="tp-standalone-label" />
      `,
    })
    class StandaloneLabelledbyHost {}

    const fixture = setup(StandaloneLabelledbyHost);
    const group = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="group"]',
    ) as HTMLElement;

    expect(group.getAttribute('aria-labelledby')).toBe('tp-standalone-label');
    expect(group.getAttribute('aria-label')).toBeNull();
  });

  it('keeps an explicit aria-label as the group name', () => {
    @Component({
      imports: [TimePickerComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-time-picker aria-label="Explicit name" />`,
    })
    class ExplicitLabelHost {}

    const fixture = setup(ExplicitLabelHost);
    const group = (fixture.nativeElement as HTMLElement).querySelector(
      '[role="group"]',
    ) as HTMLElement;

    expect(group.getAttribute('aria-label')).toBe('Explicit name');
    expect(group.getAttribute('aria-labelledby')).toBeNull();
  });

  // ── aria-required on the spinbutton fields ──
  //
  // `time-picker`'s `required` input JSDoc promised it "exposes
  // aria-required=\"true\"" — and the component had **no `aria-required` binding
  // anywhere**. The input was inert for assistive tech in every strategy, and the
  // control-derived half never surfaced either.
  //
  // The attribute goes on the three `role="spinbutton"` inputs, NOT on the
  // `role="group"` wrapper: `group` does not permit `aria-required`, and putting
  // it there is a critical axe `aria-allowed-attr` violation. That exact mistake
  // shipped once before in `file-upload` and was fixed by moving the attribute to
  // the control that owns the value.
  //
  // Non-vacuous: nothing rendered `aria-required` at all before this change, so
  // every assertion below fails on the previous tree.
  describe('aria-required', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [provideNativeDateAdapter()] });
    });

    it('exposes aria-required on every spinbutton when the control is required', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const spinbuttons: HTMLInputElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('input[role="spinbutton"]'),
      );
      expect(spinbuttons.length).toBeGreaterThan(0);
      for (const el of spinbuttons) {
        expect(el.getAttribute('aria-required')).toBe('true');
      }
    });

    it('never puts aria-required on the role="group" wrapper', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const group: HTMLElement | null =
        fixture.nativeElement.querySelector('[role="group"]');
      expect(group).not.toBeNull();
      expect(group?.getAttribute('aria-required')).toBeNull();
    });
  });

});
