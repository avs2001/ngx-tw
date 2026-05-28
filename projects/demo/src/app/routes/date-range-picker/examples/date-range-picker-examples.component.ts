import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  DateRangePickerComponent,
  type DateRangePreset,
} from 'ngx-tw/date-range-picker';
import { ButtonDirective } from 'ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  ErrorDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import { TwDateRange } from 'ngx-tw/calendar';
import type { TimePickerFormat, TwColor, TwSize } from 'ngx-tw/core';

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
const MONTH_LAYOUTS: (1 | 2)[] = [1, 2];

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

function fmtRange(v: TwDateRange<Date> | null): string {
  if (!v) return 'null';
  const s = v.start ? v.start.toDateString() : 'null';
  const e = v.end ? v.end.toDateString() : 'null';
  return `{ start: ${s}, end: ${e} }`;
}

function fmtRangeWithTime(v: TwDateRange<Date> | null): string {
  if (!v) return 'null';
  const s = v.start ? v.start.toString() : 'null';
  const e = v.end ? v.end.toString() : 'null';
  return `{ start: ${s}, end: ${e} }`;
}

@Component({
  selector: 'app-date-range-picker-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DateRangePickerComponent,
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
        for dense dashboards or toolbar contexts,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for form fields, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for touch-first layouts where the dual-calendar overlay deserves more room.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3 max-w-md">
          @for (size of sizes; track size) {
            <tw-date-range-picker
              [size]="size"
              [(value)]="sizeValues[size]"
              [emptyStartLabel]="'Size: ' + size"
              emptyEndLabel="End date"
              [aria-label]="'Date range picker ' + size"
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
        input tints the focused border and the calendar's selected-range fill. Use
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
            <tw-date-range-picker
              [color]="color"
              [(value)]="colorValues[color]"
              [emptyStartLabel]="color"
              emptyEndLabel="end"
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
        blocks opening the overlay and dims the trigger — use it when the range is not
        applicable in the current context.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        surfaces
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        on the trigger and participates in Angular's validation pipeline.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3 max-w-md">
          <tw-date-range-picker
            [(value)]="disabledValue"
            [disabled]="true"
            aria-label="Disabled"
          />
          <tw-date-range-picker
            [(value)]="requiredValue"
            [required]="true"
            aria-label="Required"
          />
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Month layout -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Month layout</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numberOfMonths</code>
        controls how many months the overlay shows side by side. The default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">2</code>
        makes multi-month ranges easy to pick without pagination; set to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1</code>
        for compact contexts or narrow layouts where a single month is plenty.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4 max-w-md">
          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Two months (default)</p>
            <tw-date-range-picker
              [(value)]="twoMonthValue"
              [numberOfMonths]="2"
              aria-label="Two-month layout"
            />
          </div>
          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">One month (compact)</p>
            <tw-date-range-picker
              [(value)]="oneMonthValue"
              [numberOfMonths]="1"
              aria-label="One-month layout"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="monthLayoutSnippet" language="html" />
    </section>

    <!-- Presets -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Presets</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass an array of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateRangePreset</code>
        entries to render a quick-select sidebar before the calendars. Each preset's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">range()</code>
        factory is called fresh on every click so "today"-relative presets stay current.
        Clicking a preset commits the range and closes — unless
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showActions</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showTime</code>
        is on, in which case it stages for review.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2 max-w-md">
          <tw-date-range-picker
            [(value)]="reportRange"
            [presets]="reportPresets"
            aria-label="Report period"
          />
          <p data-testid="output-presets" class="text-xs text-fg-muted mt-3 font-mono">
            reportRange = {{ reportRangeLabel() }}
          </p>
        </div>
      </div>
      <tw-code-block [code]="presetsTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="presetsHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Min, max & filter -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min, max &amp; filter</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Range and filter constraints cascade to both calendars (cells render disabled) and to
        preset validation — a preset that falls outside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[minDate, maxDate]</code>
        or on a filtered day is skipped with a live-region announcement. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>
        for rules the min/max pair cannot express (weekdays only, blocked holidays).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2 max-w-md">
          <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">
            Next 60 days, weekdays only
          </p>
          <tw-date-range-picker
            [(value)]="vacation"
            [minDate]="today"
            [maxDate]="sixtyDaysOut"
            [dateFilter]="weekdayFilter"
            aria-label="Vacation"
          />
          <p data-testid="output-constraints" class="text-xs text-fg-muted mt-2 font-mono">
            vacation = {{ vacationLabel() }}
          </p>
        </div>
      </div>
      <tw-code-block [code]="constraintsSnippet" language="html" />
    </section>

    <!-- With time -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With time</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Turning on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showTime</code>
        renders two
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-time-picker&gt;</code>
        instances below the calendars — one for the start endpoint, one for the end — and
        folds hour and minute into the default display format. Combine with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">timeFormat="12h"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showSeconds</code>
        when you need richer time precision. The time row only renders once both endpoints
        are set — the user picks the range first, then the times.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6 max-w-md">
          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">24h — minute precision</p>
            <tw-date-range-picker
              [(value)]="meetingWindow"
              [showTime]="true"
              aria-label="Meeting window"
            />
            <p data-testid="output-with-time-24h" class="text-xs text-fg-muted mt-2 font-mono">
              meetingWindow = {{ meetingWindowLabel() }}
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">12h + seconds + action bar</p>
            <tw-date-range-picker
              [(value)]="bookingWindow"
              [showTime]="true"
              timeFormat="12h"
              [showSeconds]="true"
              [showActions]="true"
              color="accent"
              aria-label="Booking window"
            />
            <p data-testid="output-with-time-12h" class="text-xs text-fg-muted mt-2 font-mono">
              bookingWindow = {{ bookingWindowLabel() }}
            </p>
          </div>
        </div>
      </div>
      <tw-code-block [code]="withTimeSnippet" language="html" />
    </section>

    <!-- Length constraints -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Length &amp; click behavior</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Forward the calendar's range-mode knobs straight from the picker. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minRangeLength</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxRangeLength</code>
        to enforce stays inside <em>[N, M]</em> days — commits outside the window surface the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">calendarRangeTooShort</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">calendarRangeTooLong</code>
        validator codes on the bound control.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rangeClickBehavior</code>
        controls what happens when the user clicks again after completing a range —
        <em>restart</em> (default) drops a fresh draft, <em>nearest-edge</em> nudges the
        closer endpoint, and <em>require-clear</em> blocks the click until the range is cleared.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Stay (3 – 14 nights)</label>
            <tw-date-range-picker
              [formControl]="stayCtrl"
              [minDate]="today"
              [minRangeLength]="3"
              [maxRangeLength]="14"
              rangeClickBehavior="nearest-edge"
              aria-label="Stay window"
            />
            <span twHint>Pick a window between 3 and 14 nights.</span>
            <span twError>{{ stayErrorMessage() }}</span>
          </tw-form-field>
          <pre data-testid="output-length-constraints" class="text-xs font-mono mt-4 text-fg-muted">{{
            { value: stayLabel(), errors: stayCtrl.errors } | json
          }}</pre>
        </div>
      </div>
      <tw-code-block [code]="lengthConstraintsSnippet" language="html" />
    </section>

    <!-- Action bar -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Action bar</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        By default, clicking the second endpoint commits immediately and closes the overlay.
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showActions</code>,
        range completion only stages a pending value — the change commits on
        <em>Apply</em> and <em>Cancel</em> restores the previous range. Reach for it on
        touch surfaces where accidental taps are more likely, or whenever the calendar
        doubles as a review step (<em>Today</em> / <em>Clear</em> shortcuts included).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2 max-w-md">
          <tw-date-range-picker
            [(value)]="eventRange"
            [showActions]="true"
            color="accent"
            size="lg"
            aria-label="Event range"
          />
          <p data-testid="output-action-bar" class="text-xs text-fg-muted mt-3 font-mono">
            eventRange = {{ eventRangeLabel() }}
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
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDateRange&lt;Date&gt;</code>
        or a plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#123; start, end &#125;</code>
        object; both round-trip through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">writeValue</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Holiday</label>
            <tw-date-range-picker
              name="holiday"
              [(ngModel)]="holiday"
              required
            />
            <span twHint>Pick a start and end day.</span>
          </tw-form-field>
          <p data-testid="output-td-forms" class="text-xs text-fg-muted mt-3 font-mono">
            holiday = {{ holidayLabel() }}
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
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl&lt;TwDateRange&lt;Date&gt; | null&gt;</code>
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>.
        Validators run on every commit, and the picker flips into its error state once the
        control is invalid and touched — matching the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ErrorStateMatcher</code>
        used across the library.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Report period</label>
            <tw-date-range-picker
              [formControl]="reportCtrl"
              [minDate]="ninetyDaysAgo"
              [maxDate]="today"
              [presets]="reportPresets"
            />
            <span twHint>Any 90-day window ending today.</span>
            <span twError>Please pick a valid range.</span>
          </tw-form-field>
          <div class="flex items-center gap-2 mt-4">
            <button twButton variant="outline" size="sm" type="button" (click)="markReportTouched()">
              Mark touched
            </button>
            <button twButton variant="outline" size="sm" type="button" (click)="setReportLast7()">
              Set to last 7 days
            </button>
            <button twButton variant="ghost" size="sm" type="button" (click)="clearReport()">
              Clear
            </button>
          </div>
          <pre data-testid="output-reactive-forms" class="text-xs font-mono mt-4 text-fg-muted">{{
            { value: reportSnapshot(), status: reportCtrl.status, touched: reportCtrl.touched } | json
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
            <label twLabel>Campaign window</label>
            <tw-date-range-picker
              [formField]="campaignForm.window"
              [minDate]="today"
            />
            <span twHint>Start no earlier than today.</span>
            <span twError>Campaign window is required.</span>
          </tw-form-field>
          <p data-testid="output-signal-forms" class="text-xs font-mono mt-3 text-fg-muted">
            window = {{ campaignLabel() }} · valid = {{ campaignForm().valid() }}
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
        is the preferred shape whenever the range picker sits alongside labelled inputs.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6 max-w-sm">
          <tw-form-field>
            <label twLabel>Trip window</label>
            <tw-date-range-picker
              [(value)]="tripRange"
              [minDate]="today"
              aria-label="Trip window"
            />
            <span twHint>When you'll be away.</span>
          </tw-form-field>

          <tw-form-field appearance="filled" color="success">
            <label twLabel>Launch window</label>
            <tw-date-range-picker
              [(value)]="launchRange"
              aria-label="Launch window"
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
        wiring it into a form. Good starting points:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showTime</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showActions</code>
        to see the two overlay-heavy features interact, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numberOfMonths=1</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">presets</code>
        for a compact dashboard filter.
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Months</label>
            <div class="flex gap-1">
              @for (n of monthLayouts; track n) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playMonths() === n"
                        [class.!text-primary-700]="playMonths() === n"
                        (click)="playMonths.set(n)">{{ n }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Time</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playShowTime()"
                      [class.!text-primary-700]="playShowTime()"
                      (click)="playShowTime.update(v => !v)">showTime</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [disabled]="!playShowTime()"
                      [class.!bg-primary-100]="playTimeFormat() === '12h'"
                      [class.!text-primary-700]="playTimeFormat() === '12h'"
                      (click)="toggleTimeFormat()">12h</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [disabled]="!playShowTime()"
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
                      [class.!bg-primary-100]="playWithPresets()"
                      [class.!text-primary-700]="playWithPresets()"
                      (click)="playWithPresets.update(v => !v)">presets</button>
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
                      [class.!bg-primary-100]="playRequired()"
                      [class.!text-primary-700]="playRequired()"
                      (click)="playRequired.update(v => !v)">required</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-date-range-picker
            [(value)]="playValue"
            [color]="playColor()"
            [size]="playSize()"
            [numberOfMonths]="playMonths()"
            [showTime]="playShowTime()"
            [timeFormat]="playTimeFormat()"
            [showSeconds]="playShowSeconds()"
            [showActions]="playShowActions()"
            [presets]="playWithPresets() ? reportPresets : noPresets"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            aria-label="Playground"
            class="w-96"
          />
          <p data-testid="output-playground" class="text-xs text-fg-muted mt-3 font-mono">
            value = {{ playLabel() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class DateRangePickerExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly monthLayouts = MONTH_LAYOUTS;

  protected readonly today = startOfToday();
  protected readonly sixtyDaysOut = addDays(this.today, 60);
  protected readonly ninetyDaysAgo = addDays(this.today, -90);
  protected readonly weekdayFilter = isWeekday;

  // ── Presets shared by several demos ──
  protected readonly reportPresets: readonly DateRangePreset<Date>[] = [
    {
      id: 'today',
      label: 'Today',
      range: () => new TwDateRange(startOfToday(), startOfToday()),
    },
    {
      id: 'last-7',
      label: 'Last 7 days',
      range: () => new TwDateRange(addDays(startOfToday(), -6), startOfToday()),
    },
    {
      id: 'last-30',
      label: 'Last 30 days',
      range: () => new TwDateRange(addDays(startOfToday(), -29), startOfToday()),
    },
    {
      id: 'this-month',
      label: 'This month',
      range: () => {
        const t = startOfToday();
        return new TwDateRange(
          new Date(t.getFullYear(), t.getMonth(), 1),
          t,
        );
      },
    },
    {
      id: 'ytd',
      label: 'Year to date',
      range: () => new TwDateRange(new Date(startOfToday().getFullYear(), 0, 1), startOfToday()),
    },
  ];

  protected readonly noPresets: readonly DateRangePreset<Date>[] = [];

  // ── Sizes / colors demo state ──
  protected readonly sizeValues: Record<TwSize, TwDateRange<Date> | null> = {
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
  };
  protected readonly colorValues: Record<TwColor, TwDateRange<Date> | null> = {
    primary: null,
    secondary: null,
    accent: null,
    neutral: null,
    info: null,
    success: null,
    warning: null,
    error: null,
  };

  // ── States demo ──
  protected readonly disabledValue = signal<TwDateRange<Date> | null>(
    new TwDateRange(this.today, addDays(this.today, 5)),
  );
  protected readonly requiredValue = signal<TwDateRange<Date> | null>(null);

  // ── Month layout demo ──
  protected readonly twoMonthValue = signal<TwDateRange<Date> | null>(null);
  protected readonly oneMonthValue = signal<TwDateRange<Date> | null>(null);

  // ── Preset demo ──
  protected readonly reportRange = signal<TwDateRange<Date> | null>(null);
  protected readonly reportRangeLabel = computed(() => fmtRange(this.reportRange()));

  // ── Constraints demo ──
  protected readonly vacation = signal<TwDateRange<Date> | null>(null);
  protected readonly vacationLabel = computed(() => fmtRange(this.vacation()));

  // ── With time ──
  protected readonly meetingWindow = signal<TwDateRange<Date> | null>(null);
  protected readonly meetingWindowLabel = computed(() =>
    fmtRangeWithTime(this.meetingWindow()),
  );
  protected readonly bookingWindow = signal<TwDateRange<Date> | null>(null);
  protected readonly bookingWindowLabel = computed(() =>
    fmtRangeWithTime(this.bookingWindow()),
  );

  // ── Length-constraint demo ──
  protected readonly stayCtrl = new FormControl<TwDateRange<Date> | null>(null);
  protected readonly stayLabel = computed(() => {
    // Track the picker's value via valueChanges → snapshot signal below.
    return fmtRange(this.staySnapshot());
  });
  protected readonly staySnapshot = signal<TwDateRange<Date> | null>(null);
  protected stayErrorMessage(): string {
    const errs = this.stayCtrl.errors;
    if (!errs) return '';
    if ('calendarRangeTooShort' in errs) {
      const { length, min } = errs['calendarRangeTooShort'] as { length: number; min: number };
      return `Range is ${length} day(s); minimum is ${min}.`;
    }
    if ('calendarRangeTooLong' in errs) {
      const { length, max } = errs['calendarRangeTooLong'] as { length: number; max: number };
      return `Range is ${length} day(s); maximum is ${max}.`;
    }
    return 'Range is invalid.';
  }

  // ── Action-bar demo ──
  protected readonly eventRange = signal<TwDateRange<Date> | null>(null);
  protected readonly eventRangeLabel = computed(() => fmtRange(this.eventRange()));

  // ── Template-driven ──
  protected holiday: TwDateRange<Date> | null = null;
  protected holidayLabel(): string {
    return fmtRange(this.holiday);
  }

  // ── Reactive forms ──
  protected readonly reportCtrl = new FormControl<TwDateRange<Date> | null>(null, [
    Validators.required,
  ]);
  protected readonly reportSnapshot = signal<unknown>(null);

  constructor() {
    this.reportCtrl.valueChanges.subscribe((v) => {
      this.reportSnapshot.set(
        v === null
          ? null
          : {
              start: v.start?.toDateString() ?? null,
              end: v.end?.toDateString() ?? null,
            },
      );
    });
    this.stayCtrl.valueChanges.subscribe((v) => this.staySnapshot.set(v ?? null));
  }

  protected markReportTouched(): void {
    this.reportCtrl.markAsTouched();
  }
  protected setReportLast7(): void {
    this.reportCtrl.setValue(
      new TwDateRange(addDays(this.today, -6), this.today),
    );
  }
  protected clearReport(): void {
    this.reportCtrl.reset(null);
  }

  // ── Signal forms ──
  protected readonly campaignModel = signal<{ window: TwDateRange<Date> | null }>({
    window: null,
  });
  protected readonly campaignForm = form(this.campaignModel, (path) => {
    required(path.window, { message: 'Campaign window is required.' });
  });
  protected campaignLabel(): string {
    return fmtRange(this.campaignModel().window);
  }

  // ── Inside form-field ──
  protected readonly tripRange = signal<TwDateRange<Date> | null>(null);
  protected readonly launchRange = signal<TwDateRange<Date> | null>(null);

  // ── Playground ──
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playMonths = signal<1 | 2>(2);
  protected readonly playShowTime = signal(false);
  protected readonly playTimeFormat = signal<TimePickerFormat>('24h');
  protected readonly playShowSeconds = signal(false);
  protected readonly playShowActions = signal(false);
  protected readonly playWithPresets = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playValue = signal<TwDateRange<Date> | null>(null);
  protected readonly playLabel = computed(() => {
    const v = this.playValue();
    if (!v) return 'null';
    return this.playShowTime() ? fmtRangeWithTime(v) : fmtRange(v);
  });
  protected toggleTimeFormat(): void {
    this.playTimeFormat.update((f) => (f === '12h' ? '24h' : '12h'));
  }

  // ── Code snippets ──

  protected readonly sizesSnippet = `
@for (size of sizes; track size) {
  <tw-date-range-picker
    [size]="size"
    [(value)]="sizeValues[size]"
    [emptyStartLabel]="'Size: ' + size"
    emptyEndLabel="End date"
    [aria-label]="'Date range picker ' + size"
  />
}`.trim();

  protected readonly colorsSnippet = `
@for (color of colors; track color) {
  <tw-date-range-picker
    [color]="color"
    [(value)]="colorValues[color]"
    [emptyStartLabel]="color"
    emptyEndLabel="end"
    [aria-label]="color"
  />
}`.trim();

  protected readonly statesSnippet = `<!-- Disabled: blocks opening the overlay -->
<tw-date-range-picker [(value)]="disabledValue" [disabled]="true" aria-label="Disabled" />

<!-- Required: surfaces aria-required="true" and participates in form validation -->
<tw-date-range-picker [(value)]="requiredValue" [required]="true" aria-label="Required" />`;

  protected readonly monthLayoutSnippet = `<!-- Two months (default) -->
<tw-date-range-picker [(value)]="twoMonthValue" [numberOfMonths]="2" />

<!-- One month (compact) -->
<tw-date-range-picker [(value)]="oneMonthValue" [numberOfMonths]="1" />`;

  protected readonly presetsTsSnippet = `protected readonly reportPresets: readonly DateRangePreset<Date>[] = [
  { id: 'today',      label: 'Today',        range: () => new TwDateRange(today, today) },
  { id: 'last-7',     label: 'Last 7 days',  range: () => new TwDateRange(addDays(today, -6), today) },
  { id: 'last-30',    label: 'Last 30 days', range: () => new TwDateRange(addDays(today, -29), today) },
  { id: 'this-month', label: 'This month',   range: () => new TwDateRange(firstOfMonth(today), today) },
  { id: 'ytd',        label: 'Year to date', range: () => new TwDateRange(firstOfYear(today), today) },
];`;

  protected readonly presetsHtmlSnippet = `<tw-date-range-picker
  [(value)]="reportRange"
  [presets]="reportPresets"
  aria-label="Report period"
/>`;

  protected readonly constraintsSnippet = `<tw-date-range-picker
  [(value)]="vacation"
  [minDate]="today"
  [maxDate]="sixtyDaysOut"
  [dateFilter]="weekdayFilter"
  aria-label="Vacation"
/>`;

  protected readonly withTimeSnippet = `<!-- 24h, minute precision -->
<tw-date-range-picker
  [(value)]="meetingWindow"
  [showTime]="true"
  aria-label="Meeting window"
/>

<!-- 12h + seconds + action bar -->
<tw-date-range-picker
  [(value)]="bookingWindow"
  [showTime]="true"
  timeFormat="12h"
  [showSeconds]="true"
  [showActions]="true"
  color="accent"
  aria-label="Booking window"
/>`;

  protected readonly actionBarSnippet = `<tw-date-range-picker
  [(value)]="eventRange"
  [showActions]="true"
  color="accent"
  size="lg"
  aria-label="Event range"
/>`;

  protected readonly lengthConstraintsSnippet = `<tw-form-field>
  <label twLabel>Stay (3 – 14 nights)</label>
  <tw-date-range-picker
    [formControl]="stayCtrl"
    [minDate]="today"
    [minRangeLength]="3"
    [maxRangeLength]="14"
    rangeClickBehavior="nearest-edge"
    aria-label="Stay window"
  />
  <span twHint>Pick a window between 3 and 14 nights.</span>
  <span twError>Range is too short or too long.</span>
</tw-form-field>`;

  protected readonly tdTsSnippet = `protected holiday: TwDateRange<Date> | null = null;`;

  protected readonly tdHtmlSnippet = `<tw-form-field>
  <label twLabel>Holiday</label>
  <tw-date-range-picker name="holiday" [(ngModel)]="holiday" required />
  <span twHint>Pick a start and end day.</span>
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly reportCtrl = new FormControl<TwDateRange<Date> | null>(null, [
  Validators.required,
]);`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Report period</label>
  <tw-date-range-picker
    [formControl]="reportCtrl"
    [minDate]="ninetyDaysAgo"
    [maxDate]="today"
    [presets]="reportPresets"
  />
  <span twHint>Any 90-day window ending today.</span>
  <span twError>Please pick a valid range.</span>
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly campaignModel = signal<{ window: TwDateRange<Date> | null }>({ window: null });
protected readonly campaignForm = form(this.campaignModel, (path) => {
  required(path.window, { message: 'Campaign window is required.' });
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Campaign window</label>
  <tw-date-range-picker
    [formField]="campaignForm.window"
    [minDate]="today"
  />
  <span twHint>Start no earlier than today.</span>
  <span twError>Campaign window is required.</span>
</tw-form-field>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Trip window</label>
  <tw-date-range-picker [(value)]="tripRange" [minDate]="today" aria-label="Trip window" />
  <span twHint>When you'll be away.</span>
</tw-form-field>

<tw-form-field appearance="filled" color="success">
  <label twLabel>Launch window</label>
  <tw-date-range-picker [(value)]="launchRange" aria-label="Launch window" />
</tw-form-field>`;
}
