import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import { DatePickerComponent } from '../date-picker';
import { DatePickerHarness } from './date-picker-harness';

/** April 2026 — a fixed month so cell texts are deterministic whatever "today" is. */
const START_AT = new Date(2026, 3, 26);

@Component({
  imports: [DatePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-picker
      [(value)]="value"
      [startAt]="startAt()"
      [disabled]="disabled()"
      [required]="required()"
      [showActions]="showActions()"
      [placeholder]="'Pick a date'"
      aria-label="Birthday"
    />
  `,
})
class HarnessHost {
  readonly value = signal<Date | null>(null);
  readonly startAt = signal<Date | null>(START_AT);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly showActions = signal(false);
}

@Component({
  imports: [DatePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-picker [formControl]="ctrl" aria-label="Birthday" />`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<Date | null>(null, Validators.required);
}

describe('DatePickerHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost, OverlayModule],
      providers: [provideNativeDateAdapter()],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // The ORDINARY fixture loader, deliberately. The calendar renders into the
    // overlay container outside `tw-date-picker`, but the harness resolves it
    // via `documentRootLocatorFactory()`, so a consumer never needs
    // `TestbedHarnessEnvironment.documentRootLoader`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('reads the label, placeholder and empty value off the text input', async () => {
    const picker = await loader.getHarness(DatePickerHarness);

    expect(await picker.getLabel()).toBe('Birthday');
    expect(await picker.getPlaceholder()).toBe('Pick a date');
    expect(await picker.getValue()).toBe('');
    expect(await picker.isOpen()).toBe(false);
  });

  it('opens and closes through the trigger button', async () => {
    const picker = await loader.getHarness(DatePickerHarness);

    expect(await picker.getCalendar()).toBeNull();

    await picker.open();
    expect(await picker.isOpen()).toBe(true);
    expect(await picker.getCalendar()).not.toBeNull();

    await picker.close();
    expect(await picker.isOpen()).toBe(false);
  });

  it('exposes the overlay calendar as a CalendarHarness anchored at startAt', async () => {
    const picker = await loader.getHarness(DatePickerHarness);
    await picker.open();

    const calendar = await picker.getCalendar();
    expect(await calendar!.getPeriodLabel()).toMatch(/April\s+2026/i);
    expect(await calendar!.getCurrentView()).toBe('day');
  });

  it('selects a day and commits it to the bound value', async () => {
    const picker = await loader.getHarness(DatePickerHarness);

    await picker.selectDay('15');
    fixture.detectChanges();
    await fixture.whenStable();

    const committed = fixture.componentInstance.value();
    expect(committed).toBeInstanceOf(Date);
    expect(committed!.getFullYear()).toBe(2026);
    expect(committed!.getMonth()).toBe(3);
    expect(committed!.getDate()).toBe(15);
    // The displayed text CHANGED across the interaction — a harness returning a
    // hardcoded value would have failed the empty-value assertion above or this.
    expect(await picker.getValue()).toContain('15');
  });

  it('throws rather than failing silently when the requested day is not visible', async () => {
    const picker = await loader.getHarness(DatePickerHarness);
    await expect(picker.selectDay('99')).rejects.toThrow();
  });

  it('typing a date and blurring commits it', async () => {
    const picker = await loader.getHarness(DatePickerHarness);

    await picker.setValue('April 15, 2026');
    fixture.detectChanges();
    await fixture.whenStable();

    const committed = fixture.componentInstance.value();
    expect(committed).toBeInstanceOf(Date);
    expect(committed!.getMonth()).toBe(3);
    expect(committed!.getDate()).toBe(15);
  });

  it('clears a committed value through the inline clear control', async () => {
    const picker = await loader.getHarness(DatePickerHarness);

    expect(await picker.hasClearButton()).toBe(false);
    await expect(picker.clear()).rejects.toThrow(/no clear control/i);

    await picker.selectDay('15');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.hasClearButton()).toBe(true);

    await picker.clear();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(await picker.getValue()).toBe('');
  });

  it('holds the pick pending until the Apply action confirms it', async () => {
    fixture.componentInstance.showActions.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(DatePickerHarness);
    await picker.selectDay('15');
    fixture.detectChanges();
    await fixture.whenStable();

    // With an action bar the overlay stays up and nothing has committed yet.
    expect(fixture.componentInstance.value()).toBeNull();
    expect(await picker.isOpen()).toBe(true);

    await picker.clickAction('Apply');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()?.getDate()).toBe(15);
  });

  it('throws from clickAction when no overlay action matches', async () => {
    const picker = await loader.getHarness(DatePickerHarness);
    await picker.open();
    await expect(picker.clickAction('Nope')).rejects.toThrow(/no overlay action button/i);
  });

  it('reports the disabled state and refuses to open', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(DatePickerHarness);
    expect(await picker.isDisabled()).toBe(true);

    await picker.open();
    expect(await picker.isOpen()).toBe(false);
  });

  it('reports the required state', async () => {
    const picker = await loader.getHarness(DatePickerHarness);
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
      DatePickerHarness,
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

    reactive.componentInstance.ctrl.setValue(new Date(2026, 3, 15));
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await picker.isInvalid()).toBe(false);
  });

  it('finds a picker by its label through the predicate', async () => {
    const picker = await loader.getHarness(DatePickerHarness.with({ label: 'Birthday' }));
    expect(await picker.getLabel()).toBe('Birthday');
  });
});
