import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideNativeDateAdapter, TwDateRange } from '@cdevhub/ngx-tw/calendar';
import { DateRangePickerComponent } from '../date-range-picker';
import { DateRangePickerHarness } from './date-range-picker-harness';

@Component({
  imports: [DateRangePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-date-range-picker
      [(value)]="value"
      [numberOfMonths]="numberOfMonths()"
      [disabled]="disabled()"
      [required]="required()"
      [showActions]="showActions()"
      aria-label="Report period"
    />
  `,
})
class HarnessHost {
  readonly value = signal<TwDateRange<Date> | null>(null);
  readonly numberOfMonths = signal<1 | 2>(2);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly showActions = signal(false);
}

@Component({
  imports: [DateRangePickerComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-date-range-picker [formControl]="ctrl" aria-label="Report period" />`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<TwDateRange<Date> | null>(null, Validators.required);
}

describe('DateRangePickerHarness', () => {
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
    // overlay container outside `tw-date-range-picker`, but the harness
    // resolves it via `documentRootLocatorFactory()`, so a consumer never needs
    // `TestbedHarnessEnvironment.documentRootLoader`.
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  it('reports an empty range as null start/end text', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);

    expect(await picker.getStartText()).toBeNull();
    expect(await picker.getEndText()).toBeNull();
    expect(await picker.getTriggerText()).toBeTruthy();
    expect(await picker.isOpen()).toBe(false);
  });

  it('opens and closes through the trigger', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);

    expect(await picker.getCalendar()).toBeNull();

    await picker.open();
    expect(await picker.isOpen()).toBe(true);
    expect(await picker.getCalendar()).not.toBeNull();

    await picker.close();
    expect(await picker.isOpen()).toBe(false);
  });

  it('exposes the overlay calendar as a CalendarHarness', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);
    await picker.open();

    const calendar = await picker.getCalendar();
    expect(await calendar!.getCurrentView()).toBe('day');
    expect((await calendar!.getCells()).length).toBeGreaterThan(0);
  });

  // The gap `date-range-picker.spec.ts` documented in two `it.skip`s: driving a
  // range through raw `document.querySelectorAll('tw-calendar-cell button')`
  // indexes landed on adjacent-month leading days that the range strategy
  // rejects. Selecting by cell TEXT never can.
  it('commits a range from two calendar clicks', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);

    await picker.selectRange('10', '15');
    fixture.detectChanges();
    await fixture.whenStable();

    const committed = fixture.componentInstance.value();
    expect(committed).toBeInstanceOf(TwDateRange);
    expect(committed!.start!.getDate()).toBe(10);
    expect(committed!.end!.getDate()).toBe(15);

    // The trigger CHANGED across the interaction — start/end text replaced the
    // single placeholder span, which is what `getStartText` keys off.
    expect(await picker.getStartText()).toBeTruthy();
    expect(await picker.getEndText()).toBeTruthy();
  });

  it('throws rather than failing silently when a requested cell is not visible', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);
    await expect(picker.selectRange('10', '99')).rejects.toThrow();
  });

  it('holds the range pending until the Apply action confirms it', async () => {
    fixture.componentInstance.showActions.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(DateRangePickerHarness);
    await picker.selectRange('10', '15');
    fixture.detectChanges();
    await fixture.whenStable();

    // With an action bar the overlay stays up and nothing has committed yet.
    expect(fixture.componentInstance.value()).toBeNull();
    expect(await picker.isOpen()).toBe(true);

    await picker.clickAction('Apply');
    fixture.detectChanges();
    await fixture.whenStable();

    const committed = fixture.componentInstance.value();
    expect(committed).toBeInstanceOf(TwDateRange);
    expect(committed!.start!.getDate()).toBe(10);
    expect(committed!.end!.getDate()).toBe(15);
  });

  it('throws from clickAction when no overlay action matches', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);
    await picker.open();
    await expect(picker.clickAction('Nope')).rejects.toThrow(/no overlay action button/i);
  });

  it('clears a committed range through the inline clear control', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);

    expect(await picker.hasClearButton()).toBe(false);
    await expect(picker.clear()).rejects.toThrow(/no clear control/i);

    await picker.selectRange('10', '15');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await picker.hasClearButton()).toBe(true);

    await picker.clear();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBeNull();
    expect(await picker.getStartText()).toBeNull();
  });

  it('reports the disabled state and refuses to open', async () => {
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const picker = await loader.getHarness(DateRangePickerHarness);
    expect(await picker.isDisabled()).toBe(true);

    await picker.open();
    expect(await picker.isOpen()).toBe(false);
  });

  it('reports the required state', async () => {
    const picker = await loader.getHarness(DateRangePickerHarness);
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
      DateRangePickerHarness,
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

    reactive.componentInstance.ctrl.setValue(
      new TwDateRange(new Date(2026, 3, 10), new Date(2026, 3, 15)),
    );
    reactive.detectChanges();
    await reactive.whenStable();
    expect(await picker.isInvalid()).toBe(false);
  });

  it('finds a picker by its label through the predicate', async () => {
    const picker = await loader.getHarness(
      DateRangePickerHarness.with({ label: /Report period/ }),
    );
    expect(await picker.getLabel()).toContain('Report period');
  });
});
