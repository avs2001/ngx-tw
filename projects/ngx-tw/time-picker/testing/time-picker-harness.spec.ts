import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import type { TimePickerFormat } from '../time-picker';
import { TimePickerComponent } from '../time-picker';
import { TimePickerHarness } from './time-picker-harness';

@Component({
  imports: [TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-time-picker
      [(value)]="value"
      [format]="format()"
      [showSeconds]="showSeconds()"
      [minuteStep]="minuteStep()"
      [disabled]="disabled()"
      [required]="required()"
      aria-label="Meeting time"
    />
  `,
})
class HarnessHost {
  readonly value = signal<Date | null>(null);
  readonly format = signal<TimePickerFormat>('24h');
  readonly showSeconds = signal(false);
  readonly minuteStep = signal(1);
  readonly disabled = signal(false);
  readonly required = signal(false);
}

@Component({
  imports: [TimePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-time-picker [formControl]="ctrl" aria-label="Meeting time" />`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<Date | null>(null, Validators.required);
}

describe('TimePickerHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // `tw-time-picker` has no CDK overlay — everything it renders lives inside
    // the host, so the plain fixture loader is all this harness ever needs.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the group label and reports empty fields as null', async () => {
    const picker = await loader.getHarness(TimePickerHarness);

    expect(await picker.getLabel()).toBe('Meeting time');
    expect(await picker.getValue('hour')).toBeNull();
    expect(await picker.getValue('minute')).toBeNull();
    expect(await picker.hasSeconds()).toBe(false);
  });

  it('reads an externally set value out of the fields', async () => {
    fixture.componentInstance.value.set(new Date(2026, 3, 21, 9, 5, 0));
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(TimePickerHarness);
    expect(await picker.getValue('hour')).toBe(9);
    expect(await picker.getValue('minute')).toBe(5);
  });

  it('types hour and minute and commits a complete time', async () => {
    const picker = await loader.getHarness(TimePickerHarness);

    await picker.setValue('hour', 14);
    await picker.setValue('minute', 30);
    fixture.detectChanges();
    await fixture.whenStable();

    // State CHANGED across the interaction — both fields started null.
    expect(await picker.getValue('hour')).toBe(14);
    expect(await picker.getValue('minute')).toBe(30);
    expect(fixture.componentInstance.value()?.getHours()).toBe(14);
    expect(fixture.componentInstance.value()?.getMinutes()).toBe(30);
  });

  it('renders and drives the seconds field only when showSeconds is on', async () => {
    const picker = await loader.getHarness(TimePickerHarness);
    await expect(picker.getValue('second')).rejects.toThrow(/not rendered/i);

    fixture.componentInstance.showSeconds.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.hasSeconds()).toBe(true);
    await picker.setValue('hour', 1);
    await picker.setValue('minute', 2);
    await picker.setValue('second', 45);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.getValue('second')).toBe(45);
    expect(fixture.componentInstance.value()?.getSeconds()).toBe(45);
  });

  it('exposes aria-valuetext, including the meridiem in 12h format', async () => {
    fixture.componentInstance.format.set('12h');
    fixture.componentInstance.value.set(new Date(2026, 3, 21, 14, 30, 0));
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(TimePickerHarness);
    expect(await picker.getValue('hour')).toBe(2);
    expect(await picker.getValueText('hour')).toBe('02 PM');
    expect(await picker.getMeridiem()).toBe('PM');
  });

  it('has no meridiem control in 24h format', async () => {
    const picker = await loader.getHarness(TimePickerHarness);

    expect(await picker.getMeridiem()).toBeNull();
    await expect(picker.setMeridiem('PM')).rejects.toThrow(/no AM\/PM control/i);
  });

  it('switches the meridiem and moves the committed hour by twelve', async () => {
    fixture.componentInstance.format.set('12h');
    fixture.componentInstance.value.set(new Date(2026, 3, 21, 14, 30, 0));
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(TimePickerHarness);
    await picker.setMeridiem('AM');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.getMeridiem()).toBe('AM');
    expect(fixture.componentInstance.value()?.getHours()).toBe(2);
  });

  it('steps the focused field with the stepper buttons', async () => {
    fixture.componentInstance.value.set(new Date(2026, 3, 21, 10, 45, 0));
    fixture.componentInstance.minuteStep.set(15);
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(TimePickerHarness);
    expect(await picker.hasSteppers()).toBe(true);

    await picker.stepUp('hour');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.getValue('hour')).toBe(11);

    // Steps the field that holds focus, by that field's own step — and wraps.
    await picker.stepUp('minute');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.getValue('minute')).toBe(0);

    await picker.stepDown('minute');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.getValue('minute')).toBe(45);
  });

  it('clears a committed time through the clear control', async () => {
    const picker = await loader.getHarness(TimePickerHarness);

    expect(await picker.hasClearButton()).toBe(false);
    await expect(picker.clear()).rejects.toThrow(/no clear control/i);

    fixture.componentInstance.value.set(new Date(2026, 3, 21, 10, 45, 0));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.hasClearButton()).toBe(true);

    await picker.clear();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(await picker.getValue('hour')).toBeNull();
    expect(await picker.getValueText('hour')).toBe('Empty');
  });

  it('clearing a single field drops the committed value back to incomplete', async () => {
    fixture.componentInstance.value.set(new Date(2026, 3, 21, 10, 45, 0));
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(TimePickerHarness);
    await picker.clearValue('minute');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.getValue('minute')).toBeNull();
    expect(await picker.getValue('hour')).toBe(10);
  });

  it('reports the disabled state', async () => {
    const picker = await loader.getHarness(TimePickerHarness);
    expect(await picker.isDisabled()).toBe(false);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.isDisabled()).toBe(true);
  });

  it('reports the required state', async () => {
    const picker = await loader.getHarness(TimePickerHarness);
    expect(await picker.isRequired()).toBe(false);

    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await picker.isRequired()).toBe(true);
  });

  it('reports the invalid state only once the bound control is touched', async () => {
    const reactive = TestBed.createComponent(ReactiveHost);
    reactive.detectChanges();
    await reactive.whenStable();
    const picker = await TestbedHarnessEnvironment.loader(reactive).getHarness(
      TimePickerHarness,
    );

    // `Validators.required` reaches `aria-required` without the consumer also
    // writing `[required]`, but the error state waits for `touched`.
    expect(await picker.isRequired()).toBe(true);
    expect(await picker.isInvalid()).toBe(false);

    reactive.componentInstance.ctrl.markAsTouched();
    reactive.componentInstance.ctrl.updateValueAndValidity();
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await picker.isInvalid()).toBe(true);

    reactive.componentInstance.ctrl.setValue(new Date(2026, 3, 21, 9, 30, 0));
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await picker.isInvalid()).toBe(false);
  });

  it('finds a time picker by its label through the predicate', async () => {
    const picker = await loader.getHarness(
      TimePickerHarness.with({ label: 'Meeting time' }),
    );
    expect(await picker.getLabel()).toBe('Meeting time');
  });
});
