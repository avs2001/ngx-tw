import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { DatePickerComponent } from 'ngx-tw/date-picker';
import { ButtonDirective } from 'ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  ErrorDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TimePickerFormat } from 'ngx-tw/core';
import type { TwColor, TwSize } from 'ngx-tw/core';

const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

@Component({
  selector: 'app-date-picker-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePickerComponent,
    ButtonDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
    JsonPipe,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Five sizes scale trigger padding, font size, icon dimensions, and calendar cell density
        together. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for dense tables or toolbar contexts,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for form fields, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for touch-first layouts where the calendar itself deserves more room.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3 max-w-sm">
          @for (size of sizes; track size) {
            <tw-date-picker
              [size]="size"
              [(value)]="sizeValues[size]"
              [placeholder]="'Size: ' + size"
              [aria-label]="'Date picker ' + size"
            />
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the focused border and the calendar's selected-cell background. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main form surface,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        when the picker drives a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not draw attention.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (color of colors; track color) {
            <tw-date-picker
              [color]="color"
              [(value)]="colorValues[color]"
              [placeholder]="color"
              [aria-label]="color"
            />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        blocks both typing and opening the calendar, and dims the trigger — use it when the
        value is not applicable in the current context.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code>
        blocks typing but still lets the user open the calendar and pick a date; reach for it
        when you want to constrain editing to the calendar path (for example to enforce business
        rules the parser cannot).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3 max-w-md">
          <tw-date-picker
            [(value)]="disabledValue"
            [disabled]="true"
            aria-label="Disabled"
            placeholder="Disabled picker"
          />
          <tw-date-picker
            [(value)]="readonlyValue"
            [readonly]="true"
            aria-label="Readonly"
            placeholder="Readonly picker (still openable)"
          />
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Constraints -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min, max &amp; filter</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Range and filter constraints cascade to both the calendar (cells render disabled) and
        the input parser (out-of-range typed values surface through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>).
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>
        predicate for rules the min/max pair cannot express, such as weekdays-only or
        excluding a holiday list.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2 max-w-md">
          <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">
            Next 30 days, weekdays only
          </p>
          <tw-date-picker
            [(value)]="appointment"
            [minDate]="today"
            [maxDate]="thirtyDaysOut"
            [dateFilter]="weekdayFilter"
            placeholder="Select a weekday"
            aria-label="Appointment"
          />
          <p class="text-xs text-fg-muted mt-2 font-mono">
            appointment = {{ appointmentLabel() }}
          </p>
        </div>
      </div>
      <tw-code-block [code]="constraintsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>
        runs per-cell while the calendar is open, so keep it O(1) — looking up a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Set&lt;string&gt;</code>
        of disabled ISO dates scales better than re-parsing a list on every call.
      </p>
    </section>

    <!-- With time -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With time</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Turning on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
        renders a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-time-picker&gt;</code>
        inside the overlay and folds hour and minute into the default display format. Picking
        a day preserves the current time-of-day, and editing the time updates the pending value
        without closing. Combine with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">timeFormat="12h"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showSeconds</code>
        when you need richer time precision.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6 max-w-md">
          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">24h — minute precision</p>
            <tw-date-picker
              [(value)]="meeting"
              [withTime]="true"
              placeholder="Pick a date and time"
              aria-label="Meeting"
            />
            <p class="text-xs text-fg-muted mt-2 font-mono">
              meeting = {{ meetingLabel() }}
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">12h + seconds + action bar</p>
            <tw-date-picker
              [(value)]="deadline"
              [withTime]="true"
              timeFormat="12h"
              [showSeconds]="true"
              [showActions]="true"
              color="accent"
              placeholder="Pick a deadline"
              aria-label="Deadline"
            />
            <p class="text-xs text-fg-muted mt-2 font-mono">
              deadline = {{ deadlineLabel() }}
            </p>
          </div>
        </div>
      </div>
      <tw-code-block [code]="withTimeSnippet" language="html" />
    </section>

    <!-- Action bar -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Action bar</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        By default, clicking a cell commits immediately and closes the overlay. With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showActions</code>,
        picking a cell only updates a pending value — the change commits on
        <em>Apply</em> and the <em>Cancel</em> button restores the previous value. Reach for it on
        touch surfaces where an accidental tap is more likely, or whenever the calendar doubles
        as a review step (Today / Clear shortcuts included).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2 max-w-md">
          <tw-date-picker
            [(value)]="eventDate"
            [showActions]="true"
            color="accent"
            size="lg"
            placeholder="Pick event date"
            aria-label="Event date"
          />
          <p class="text-xs text-fg-muted mt-3 font-mono">
            event = {{ eventLabel() }}
          </p>
        </div>
      </div>
      <tw-code-block [code]="actionBarSnippet" language="html" />
    </section>

    <!-- Template-driven forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-driven forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The picker is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so it drops straight into template-driven forms via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>.
        The native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        attribute is surfaced through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>
        and participates in Angular's validation pipeline without any extra wiring.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Birthday</label>
            <tw-date-picker
              name="birthday"
              [(ngModel)]="birthday"
              required
            />
            <span twHint>Used for age-based offers.</span>
          </tw-form-field>
          <p class="text-xs text-fg-muted mt-3 font-mono">
            birthday = {{ birthdayLabel() }}
          </p>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl&lt;Date | null&gt;</code>
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>.
        Validators run on every commit, and the picker flips into its error state once the
        control is both invalid and touched — matching the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ErrorStateMatcher</code>
        used across the library.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Delivery date</label>
            <tw-date-picker
              [formControl]="deliveryCtrl"
              [minDate]="today"
              [maxDate]="thirtyDaysOut"
            />
            <span twHint>Within the next 30 days.</span>
            <span twError>Please pick a valid date.</span>
          </tw-form-field>
          <div class="flex items-center gap-2 mt-4">
            <button twButton variant="outline" size="sm" type="button" (click)="markTouched()">
              Mark touched
            </button>
            <button twButton variant="outline" size="sm" type="button" (click)="setDelivery()">
              Set to today
            </button>
            <button twButton variant="ghost" size="sm" type="button" (click)="clearDelivery()">
              Clear
            </button>
          </div>
          <pre class="text-xs font-mono mt-4 text-fg-muted">{{
            { value: deliveryCtrl.value, status: deliveryCtrl.status, touched: deliveryCtrl.touched } | json
          }}</pre>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21's signal-forms API exposes the field through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        Validation runs off the underlying signal, and template consumers can read
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        directly — no subscriptions needed to drive UI.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Ship date</label>
            <tw-date-picker
              [formField]="shipForm.shipDate"
              [minDate]="today"
              placeholder="Pick ship date"
            />
            <span twHint>Must be today or later.</span>
            <span twError>Ship date is required.</span>
          </tw-form-field>
          <p class="text-xs font-mono mt-3 text-fg-muted">
            shipDate = {{ shipLabel() }} · valid = {{ shipForm().valid() }}
          </p>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Inside form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside form-field (auto-naked)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When nested inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>,
        the picker detects its parent and switches to a chrome-less naked trigger — the
        form-field owns the border, focus ring, floating label, and hint/error regions. This
        is the preferred shape whenever the date picker sits alongside labelled inputs.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6 max-w-sm">
          <tw-form-field>
            <label twLabel>Start date</label>
            <tw-date-picker
              [(value)]="startValue"
              [minDate]="today"
              aria-label="Start date"
            />
            <span twHint>When the project kicks off.</span>
          </tw-form-field>

          <tw-form-field appearance="filled" color="success">
            <label twLabel>Launch date</label>
            <tw-date-picker
              [(value)]="launchValue"
              aria-label="Launch date"
            />
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once to sanity-check your configuration before
        wiring it into a form. A good starting point is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showActions</code>
        to see the two overlay-heavy features interact, or pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">openOnFocus</code>
        for a calendar-only picker.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playColor() === c"
                        [class.!text-primary-700]="playColor() === c"
                        (click)="playColor.set(c)">{{ c }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playSize() === s"
                        [class.!text-primary-700]="playSize() === s"
                        (click)="playSize.set(s)">{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Time</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playWithTime()"
                      [class.!text-primary-700]="playWithTime()"
                      (click)="playWithTime.update(v => !v)">withTime</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [disabled]="!playWithTime()"
                      [class.!bg-primary-100]="playTimeFormat() === '12h'"
                      [class.!text-primary-700]="playTimeFormat() === '12h'"
                      (click)="toggleTimeFormat()">12h</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [disabled]="!playWithTime()"
                      [class.!bg-primary-100]="playShowSeconds()"
                      [class.!text-primary-700]="playShowSeconds()"
                      (click)="playShowSeconds.update(v => !v)">seconds</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Behavior</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playShowActions()"
                      [class.!text-primary-700]="playShowActions()"
                      (click)="playShowActions.update(v => !v)">actions</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playOpenOnFocus()"
                      [class.!text-primary-700]="playOpenOnFocus()"
                      (click)="playOpenOnFocus.update(v => !v)">openOnFocus</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">State</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playReadonly()"
                      [class.!text-primary-700]="playReadonly()"
                      (click)="playReadonly.update(v => !v)">readonly</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playRequired()"
                      [class.!text-primary-700]="playRequired()"
                      (click)="playRequired.update(v => !v)">required</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-date-picker
            [(value)]="playValue"
            [color]="playColor()"
            [size]="playSize()"
            [withTime]="playWithTime()"
            [timeFormat]="playTimeFormat()"
            [showSeconds]="playShowSeconds()"
            [showActions]="playShowActions()"
            [openOnFocus]="playOpenOnFocus()"
            [disabled]="playDisabled()"
            [readonly]="playReadonly()"
            [required]="playRequired()"
            placeholder="Pick a date…"
            aria-label="Playground"
            class="w-80"
          />
          <p class="text-xs text-fg-muted mt-3 font-mono">
            value = {{ playLabel() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class DatePickerExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly today = startOfToday();
  protected readonly thirtyDaysOut = addDays(this.today, 30);
  protected readonly weekdayFilter = isWeekday;

  // ── Sizes / colors demo state ──
  protected readonly sizeValues: Record<TwSize, Date | null> = {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  };
  protected readonly colorValues: Record<TwColor, Date | null> = {
    primary: this.today,
    secondary: this.today,
    accent: this.today,
    neutral: this.today,
    info: this.today,
    success: this.today,
    warning: this.today,
    error: this.today,
  };

  // ── States demo ──
  protected readonly disabledValue = signal<Date | null>(this.today);
  protected readonly readonlyValue = signal<Date | null>(this.today);

  // ── Constraints demo ──
  protected readonly appointment = signal<Date | null>(null);
  protected readonly appointmentLabel = computed(
    () => this.appointment()?.toDateString() ?? 'null',
  );

  // ── With time ──
  protected readonly meeting = signal<Date | null>(null);
  protected readonly meetingLabel = computed(() => this.meeting()?.toString() ?? 'null');

  protected readonly deadline = signal<Date | null>(null);
  protected readonly deadlineLabel = computed(() => this.deadline()?.toString() ?? 'null');

  // ── Action-bar demo ──
  protected readonly eventDate = signal<Date | null>(null);
  protected readonly eventLabel = computed(
    () => this.eventDate()?.toDateString() ?? 'null',
  );

  // ── Template-driven ──
  protected birthday: Date | null = null;
  protected birthdayLabel(): string {
    return this.birthday ? this.birthday.toDateString() : 'null';
  }

  // ── Reactive forms ──
  protected readonly deliveryCtrl = new FormControl<Date | null>(null, [
    Validators.required,
  ]);
  protected markTouched(): void {
    this.deliveryCtrl.markAsTouched();
  }
  protected setDelivery(): void {
    this.deliveryCtrl.setValue(this.today);
  }
  protected clearDelivery(): void {
    this.deliveryCtrl.reset(null);
  }

  // ── Signal forms ──
  protected readonly shipModel = signal<{ shipDate: Date | null }>({ shipDate: null });
  protected readonly shipForm = form(this.shipModel, (path) => {
    required(path.shipDate, { message: 'Ship date is required.' });
  });
  protected shipLabel(): string {
    return this.shipModel().shipDate?.toDateString() ?? 'null';
  }

  // ── Inside form-field ──
  protected readonly startValue = signal<Date | null>(null);
  protected readonly launchValue = signal<Date | null>(null);

  // ── Playground ──
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playWithTime = signal(false);
  protected readonly playTimeFormat = signal<TimePickerFormat>('24h');
  protected readonly playShowSeconds = signal(false);
  protected readonly playShowActions = signal(false);
  protected readonly playOpenOnFocus = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playReadonly = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playValue = signal<Date | null>(null);
  protected readonly playLabel = computed(() => {
    const v = this.playValue();
    if (!v) return 'null';
    return this.playWithTime() ? v.toString() : v.toDateString();
  });
  protected toggleTimeFormat(): void {
    this.playTimeFormat.update((f) => (f === '12h' ? '24h' : '12h'));
  }

  // ── Code snippets ──

  protected readonly sizesSnippet = `
@for (size of sizes; track size) {
  <tw-date-picker
    [size]="size"
    [(value)]="sizeValues[size]"
    [placeholder]="'Size: ' + size"
    [aria-label]="'Date picker ' + size"
  />
}`.trim();

  protected readonly colorsSnippet = `
@for (color of colors; track color) {
  <tw-date-picker
    [color]="color"
    [(value)]="colorValues[color]"
    [placeholder]="color"
    [aria-label]="color"
  />
}`.trim();

  protected readonly statesSnippet = `<!-- Disabled: blocks typing and opening -->
<tw-date-picker [value]="today" [disabled]="true" aria-label="Disabled" />

<!-- Readonly: blocks typing, calendar still opens -->
<tw-date-picker [value]="today" [readonly]="true" aria-label="Readonly" />`;

  protected readonly constraintsSnippet = `<tw-date-picker
  [(value)]="appointment"
  [minDate]="today"
  [maxDate]="thirtyDaysOut"
  [dateFilter]="weekdayFilter"
  placeholder="Select a weekday"
  aria-label="Appointment"
/>`;

  protected readonly withTimeSnippet = `<!-- 24h, minute precision -->
<tw-date-picker
  [(value)]="meeting"
  [withTime]="true"
  placeholder="Pick a date and time"
  aria-label="Meeting"
/>

<!-- 12h + seconds + action bar -->
<tw-date-picker
  [(value)]="deadline"
  [withTime]="true"
  timeFormat="12h"
  [showSeconds]="true"
  [showActions]="true"
  color="accent"
  placeholder="Pick a deadline"
  aria-label="Deadline"
/>`;

  protected readonly actionBarSnippet = `<tw-date-picker
  [(value)]="eventDate"
  [showActions]="true"
  color="accent"
  size="lg"
  placeholder="Pick event date"
  aria-label="Event date"
/>`;

  protected readonly tdTsSnippet = `protected birthday: Date | null = null;`;

  protected readonly tdHtmlSnippet = `<tw-form-field>
  <label twLabel>Birthday</label>
  <tw-date-picker name="birthday" [(ngModel)]="birthday" required />
  <span twHint>Used for age-based offers.</span>
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly deliveryCtrl = new FormControl<Date | null>(null, [
  Validators.required,
]);`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Delivery date</label>
  <tw-date-picker
    [formControl]="deliveryCtrl"
    [minDate]="today"
    [maxDate]="thirtyDaysOut"
  />
  <span twHint>Within the next 30 days.</span>
  <span twError>Please pick a valid date.</span>
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly shipModel = signal<{ shipDate: Date | null }>({ shipDate: null });
protected readonly shipForm = form(this.shipModel, (path) => {
  required(path.shipDate, { message: 'Ship date is required.' });
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Ship date</label>
  <tw-date-picker
    [formField]="shipForm.shipDate"
    [minDate]="today"
    placeholder="Pick ship date"
  />
  <span twHint>Must be today or later.</span>
  <span twError>Ship date is required.</span>
</tw-form-field>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Start date</label>
  <tw-date-picker [(value)]="startValue" [minDate]="today" aria-label="Start date" />
  <span twHint>When the project kicks off.</span>
</tw-form-field>

<tw-form-field appearance="filled" color="success">
  <label twLabel>Launch date</label>
  <tw-date-picker [(value)]="launchValue" aria-label="Launch date" />
</tw-form-field>`;
}
