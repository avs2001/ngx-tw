import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  CalendarComponent,
  CalendarSingleDirective,
  TwCalendarPresets,
  type CalendarRangeValue,
  type DateFilterFn,
} from 'ngx-tw/calendar';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function fmt(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString() : '—';
}

@Component({
  selector: 'app-calendar-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarComponent,
    CalendarSingleDirective,
    TwCalendarPresets,
    ButtonDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Single selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default mode. The calendar commits the clicked date immediately.
        Bind with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
        or subscribe to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(valueChange)</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Single date"
          [startAt]="fixedDate"
          [value]="singleValue()"
          (valueChange)="onSingleSelected($event)"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">value = {{ singleLabel() }}</p>
      </div>
      <tw-code-block [code]="singleSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Range selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mode="range"</code>
        to commit a start and end date. The calendar automatically shows two months
        side by side and previews the hovered range after the first click.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Date range"
          mode="range"
          [startAt]="fixedDate"
          [value]="rangeValue()"
          (valueChange)="onRangeSelected($event)"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">
          start = {{ rangeLabel().start }}, end = {{ rangeLabel().end }} · {{ nightsLabel() }}
        </p>
      </div>
      <tw-code-block [code]="rangeSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multiple selection</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mode="multiple"</code>
        to toggle an array of dates. Each click adds or removes a date; the bound
        value is always an array ordered by click recency.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Multiple dates"
          mode="multiple"
          [startAt]="fixedDate"
          [value]="multipleValue()"
          (valueChange)="onMultipleSelected($event)"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">picked = {{ multipleValue().length }}</p>
      </div>
      <tw-code-block [code]="multipleSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Constraints (min / max / disabled dates / disabled weekdays)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Phase 4 ships the full §10.1 constraint surface. All sources OR-combine — a date is
        disabled if any of <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minDate</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxDate</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabledDates</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabledDaysOfWeek</code> flags it.
        Cells emit <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-state-disabled</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-state-weekend</code> for styling.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Constrained calendar"
          [startAt]="fixedDate"
          [minDate]="minDate"
          [maxDate]="maxDate"
          [disabledDates]="blockedDates"
          [disabledDaysOfWeek]="weekendDays"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">
          min = {{ minDate.toLocaleDateString() }}, max = {{ maxDate.toLocaleDateString() }},
          blocked = {{ blockedDates.length }}, weekendDays = [0, 6]
        </p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Range length + max selections</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minRangeLength</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxRangeLength</code>
        flag a tentative range as invalid via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rangePreview.invalidPreview</code>
        flag and the form-level <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">calendarRangeTooShort</code>
        / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">calendarRangeTooLong</code> codes.
        For <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">mode="multiple"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxSelections</code> +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxSelectionBehavior</code>
        decide whether a 4th click emits <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selectionLimitReached</code>,
        replaces the oldest entry, or is ignored.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Range with length cap"
          mode="range"
          [startAt]="fixedDate"
          [minRangeLength]="2"
          [maxRangeLength]="14"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">minRangeLength = 2, maxRangeLength = 14</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Range click behavior (§21.2)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        After a complete range, the third click branches on <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rangeClickBehavior</code>:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'restart'</code> (default) starts over,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'nearest-edge'</code> drags the closer endpoint to the click,
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'require-clear'</code> rejects the click and
        flashes the cell as invalid (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">data-state-invalid-flash</code>).
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">allowBackwardRange</code> skips the auto-swap;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">allowSingleDayRange</code> rejects same-day clicks.
        Keyboard arrow-key moves during SELECTING drive the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rangePreview</code> output,
        same as hover.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Nearest-edge range click"
          mode="range"
          rangeClickBehavior="nearest-edge"
          [startAt]="fixedDate"
        />
        <p class="text-xs text-fg-muted mt-2 font-mono">rangeClickBehavior = 'nearest-edge'</p>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Presets slot</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Attach <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCalendarPresets</code>
        to any container projected inside the calendar to render a presets rail above
        the grid. Phase 12 will add a first-class <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">presets</code>
        input with a11y semantics and revalidation per §25; today it is a manual slot.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Presets range"
          mode="range"
          [startAt]="presetStartAt()"
          [value]="presetRange()"
          (valueChange)="onPresetRangeSelected($event)"
        >
          <div twCalendarPresets>
            <button twButton size="xs" variant="outline" type="button" (click)="applyPresetToday()">Today</button>
            <button twButton size="xs" variant="outline" type="button" (click)="applyPresetLast7()">Last 7 days</button>
            <button twButton size="xs" variant="outline" type="button" (click)="applyPresetThisMonth()">This month</button>
          </div>
        </tw-calendar>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The calendar implements <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validator</code>,
        so a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        drives the value directly. The required validator surfaces
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">calendarRequired</code>
        whenever the control is empty, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormGroup.reset()</code>
        restores the displayed month per §6.5.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col gap-3" [formGroup]="reactiveForm">
        <tw-calendar aria-label="Reactive" formControlName="date" [startAt]="fixedDate" />
        <div class="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span class="text-fg-muted">value = {{ reactiveValueLabel() }}</span>
          <span class="text-fg-muted">errors = {{ reactiveErrorsLabel() }}</span>
          <span class="text-fg-muted">touched = {{ reactiveTouchedLabel() }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button twButton size="sm" variant="outline" type="button" (click)="toggleReactiveDisabled()">
            Toggle disabled
          </button>
          <button twButton size="sm" variant="outline" type="button" (click)="resetReactive()">
            Reset form
          </button>
          <button twButton size="sm" variant="outline" type="button" (click)="setReactiveToday()">
            Write today
          </button>
          <button twButton size="sm" variant="outline" type="button" (click)="writeWrongShape()">
            Write wrong shape
          </button>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Binding <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code> to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form(signal&lt;Date | null&gt;).date</code>
        drives the calendar through the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CalendarSingleDirective</code>
        — a typed <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormValueControl&lt;Date | null&gt;</code>
        per §7.3. Disabled / readonly / required flags propagate from the field to the calendar automatically.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col gap-3">
        <tw-calendar
          aria-label="Signal Forms"
          mode="single"
          [startAt]="fixedDate"
          [formField]="signalForm.date"
        />
        <div class="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span class="text-fg-muted">value = {{ signalValueLabel() }}</span>
          <span class="text-fg-muted">valid = {{ signalValidLabel() }}</span>
        </div>
      </div>
    </section>
  `,
})
export class CalendarExamples {
  protected readonly today = new Date();
  protected readonly fixedDate = new Date(this.today.getFullYear(), this.today.getMonth(), 15);

  protected readonly minDate = new Date(this.today.getFullYear(), this.today.getMonth(), 5);
  protected readonly maxDate = new Date(this.today.getFullYear(), this.today.getMonth(), 25);

  protected readonly weekdayOnly: DateFilterFn<Date> = (d: Date): boolean =>
    d.getDay() !== 0 && d.getDay() !== 6;

  // Phase 4 — explicit blocked dates and weekend days for the constraints demo.
  protected readonly blockedDates: readonly Date[] = [
    new Date(this.today.getFullYear(), this.today.getMonth(), 11),
    new Date(this.today.getFullYear(), this.today.getMonth(), 18),
  ];
  protected readonly weekendDays: readonly number[] = [0, 6];

  // Single
  protected readonly singleValue = signal<Date | null>(null);
  protected onSingleSelected(v: Date | null): void {
    this.singleValue.set(v);
  }
  protected readonly singleLabel = computed(() => fmt(this.singleValue()));

  // Range
  protected readonly rangeValue = signal<CalendarRangeValue<Date>>({ start: null, end: null });
  protected onRangeSelected(v: CalendarRangeValue<Date>): void {
    this.rangeValue.set(v);
  }
  protected readonly rangeLabel = computed(() => {
    const r = this.rangeValue();
    return { start: fmt(r.start), end: fmt(r.end) };
  });
  protected readonly nightsLabel = computed(() => {
    const r = this.rangeValue();
    if (!r.start || !r.end) return 'No dates';
    const diff = Math.round((r.end.getTime() - r.start.getTime()) / MS_PER_DAY);
    if (diff <= 0) return 'Same day';
    return `${diff} ${diff === 1 ? 'night' : 'nights'}`;
  });

  // Multiple
  protected readonly multipleValue = signal<Date[]>([]);
  protected onMultipleSelected(v: Date[]): void {
    this.multipleValue.set(v);
  }

  // Presets
  protected readonly presetStartAt = signal<Date>(this.fixedDate);
  protected readonly presetRange = signal<CalendarRangeValue<Date>>({ start: null, end: null });
  protected onPresetRangeSelected(v: CalendarRangeValue<Date>): void {
    this.presetRange.set(v);
  }
  protected applyPresetToday(): void {
    const t = new Date();
    const day = new Date(t.getFullYear(), t.getMonth(), t.getDate());
    this.presetStartAt.set(day);
    this.presetRange.set({ start: day, end: day });
  }
  protected applyPresetLast7(): void {
    const end = new Date();
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const start = new Date(endDay.getTime() - 6 * MS_PER_DAY);
    this.presetStartAt.set(start);
    this.presetRange.set({ start, end: endDay });
  }
  protected applyPresetThisMonth(): void {
    const t = new Date();
    const start = new Date(t.getFullYear(), t.getMonth(), 1);
    const end = new Date(t.getFullYear(), t.getMonth() + 1, 0);
    this.presetStartAt.set(start);
    this.presetRange.set({ start, end });
  }

  // Reactive
  protected readonly reactiveForm = new FormGroup({
    date: new FormControl<Date | null>(null, { validators: [Validators.required] }),
  });
  private readonly reactiveRev = signal(0);
  protected readonly reactiveValueLabel = computed(() => {
    this.reactiveRev();
    return fmt(this.reactiveForm.controls.date.value);
  });
  protected readonly reactiveErrorsLabel = computed(() => {
    this.reactiveRev();
    const errs = this.reactiveForm.controls.date.errors;
    if (!errs) return 'none';
    return Object.keys(errs).join(', ');
  });
  protected readonly reactiveTouchedLabel = computed(() => {
    this.reactiveRev();
    return this.reactiveForm.controls.date.touched ? 'true' : 'false';
  });
  constructor() {
    this.reactiveForm.controls.date.events.subscribe(() => this.reactiveRev.update((n) => n + 1));
  }
  protected toggleReactiveDisabled(): void {
    const ctrl = this.reactiveForm.controls.date;
    if (ctrl.disabled) ctrl.enable();
    else ctrl.disable();
  }
  protected resetReactive(): void {
    this.reactiveForm.reset();
  }
  protected setReactiveToday(): void {
    this.reactiveForm.controls.date.setValue(new Date());
  }
  protected writeWrongShape(): void {
    // Deliberately violate the mode shape — single mode expects `Date | null`,
    // not an array. Phase 3 defensive `writeValue` preserves the prior value
    // and marks the control with `calendarInvalidValue` instead of throwing.
    this.reactiveForm.controls.date.setValue([new Date()] as unknown as Date);
  }

  // Signal Forms
  protected readonly signalModel = signal<{ date: Date | null }>({ date: null });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.date);
  });
  protected readonly signalValueLabel = computed(() => fmt(this.signalModel().date));
  protected readonly signalValidLabel = computed(() =>
    this.signalForm().valid() ? 'true' : 'false',
  );

  // Snippets
  protected readonly singleSnippet = `<tw-calendar aria-label="Pick a date" [(value)]="value" />`;
  protected readonly rangeSnippet = `<tw-calendar
  aria-label="Pick a range"
  mode="range"
  [(value)]="range"
/>`;
  protected readonly multipleSnippet = `<tw-calendar
  aria-label="Pick multiple dates"
  mode="multiple"
  [(value)]="dates"
/>`;
}
