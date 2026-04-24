import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  TimePickerComponent,
  type TimePickerFormat,
  type TimePickerVariant,
} from 'ngx-tw/time-picker';
import { ButtonDirective } from 'ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  ErrorDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const VARIANTS: TimePickerVariant[] = ['default', 'naked'];
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
const FORMATS: TimePickerFormat[] = ['24h', '12h'];

function atTime(h: number, m: number, s = 0): Date {
  const d = new Date();
  d.setHours(h, m, s, 0);
  return d;
}

function fmt(d: Date | null | undefined): string {
  if (!d) return 'null';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

@Component({
  selector: 'app-time-picker-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TimePickerComponent,
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
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants control the chrome around the fields.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>
        draws its own rounded border, padding, and focused border color — use it when the
        picker stands alone.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">naked</code>
        strips every piece of chrome so a parent can own the border. The picker resolves
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">naked</code>
        automatically when nested inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>,
        so you rarely set it by hand.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div class="flex items-center gap-4">
          <span class="font-mono text-xs text-fg-muted w-14">default</span>
          <tw-time-picker variant="default" [(value)]="variantValues.default" aria-label="Default variant" />
        </div>
        <div class="flex items-center gap-4">
          <span class="font-mono text-xs text-fg-muted w-14">naked</span>
          <tw-time-picker variant="naked" [(value)]="variantValues.naked" aria-label="Naked variant" />
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Prefer letting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        trigger the naked variant rather than forcing it explicitly — see
        <em>Inside form-field</em> below.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the focused border and the active AM/PM button. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main surface and the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the picker drives a themed form region. Focus a field to see each tint.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (color of colors; track color) {
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs text-fg-muted w-20">{{ color }}</span>
              <tw-time-picker
                [color]="color"
                [(value)]="colorValues[color]"
                [attr.aria-label]="color"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the field width, font size, and stepper density. Match the
        surrounding controls — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        picker fits inline toolbars, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        suits a prominent scheduler input on a form page.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        @for (size of sizes; track size) {
          <div class="flex items-center gap-4">
            <span class="font-mono text-xs text-fg-muted w-6">{{ size }}</span>
            <tw-time-picker
              [size]="size"
              [(value)]="sizeValues[size]"
              [attr.aria-label]="'Size ' + size"
            />
          </div>
        }
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Format & seconds -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Format &amp; seconds</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">format</code>
        between
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'24h'</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'12h'</code>
        to change the display — the stored
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Date</code>
        stays canonical, so swapping formats never loses the time.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showSeconds</code>
        renders a third field for second-level precision.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">24h</p>
          <tw-time-picker format="24h" [(value)]="formatDemoValue" aria-label="24-hour time" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">12h with AM/PM</p>
          <tw-time-picker format="12h" [(value)]="formatDemoValue" aria-label="12-hour time" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">With seconds</p>
          <tw-time-picker format="24h" [showSeconds]="true" [(value)]="formatDemoValue" aria-label="Time with seconds" />
        </div>
        <p class="text-xs text-fg-muted pt-2 border-t border-border-muted font-mono">
          value = {{ fmt(formatDemoValue()) }}
        </p>
      </div>
      <tw-code-block [code]="formatSnippet" language="html" />
    </section>

    <!-- Stepping intervals -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Stepping intervals</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each unit has its own step. Scheduler UX almost always uses
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minuteStep: 15</code>
        to align with quarter-hour slots. ArrowUp/Down steps by the configured amount and
        wraps inside the unit's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[min, max]</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-fg-muted w-56">minuteStep = 15</span>
          <tw-time-picker [(value)]="stepDemoValue" [minuteStep]="15" aria-label="Quarter-hour time" />
        </div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-fg-muted w-56">minuteStep = 5, hourStep = 2</span>
          <tw-time-picker [(value)]="stepDemoValue" [hourStep]="2" [minuteStep]="5" aria-label="Five-minute time" />
        </div>
      </div>
      <tw-code-block [code]="stepsSnippet" language="html" />
    </section>

    <!-- Min / Max -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min / max time</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Out-of-range values flip the picker into the standard
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>
        — the focused border turns
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        and any wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        shows its error region. Only the time-of-day portion is compared; the date part is
        ignored.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        <p class="text-xs font-medium text-fg-muted uppercase tracking-wide">
          Business hours · 09:00 – 17:00
        </p>
        <tw-time-picker
          [(value)]="businessHours"
          [minTime]="businessOpen"
          [maxTime]="businessClose"
          aria-label="Meeting time"
        />
        <p class="text-xs text-fg-muted font-mono">meeting = {{ fmt(businessHours()) }}</p>
      </div>
      <tw-code-block [code]="minMaxSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        dims the picker and blocks every interaction.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code>
        keeps the value fully visible and focusable but refuses typing, stepping, and the
        AM/PM toggle — useful when showing a value the user cannot yet edit (e.g. pending
        approval).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
          <tw-time-picker [(value)]="disabledValue" [disabled]="true" aria-label="Disabled time picker" />
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Readonly</p>
          <tw-time-picker [(value)]="readonlyValue" [readonly]="true" aria-label="Readonly time picker" />
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The picker implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works without any extra wiring. Inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        the picker collapses to its naked variant so the form-field owns the border and
        chrome.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 max-w-md">
        <tw-form-field>
          <label twLabel>Preferred call time</label>
          <tw-time-picker name="callTime" [(ngModel)]="callTime" format="12h" />
          <span twHint>When we can reach you.</span>
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-3 font-mono">callTime = {{ fmt(callTime) }}</p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        and the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>
        flags stay synchronised. Adding
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.required</code>
        also surfaces through the picker's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 max-w-md">
        <tw-form-field>
          <label twLabel>Alarm</label>
          <tw-time-picker [formControl]="alarmCtrl" [showSeconds]="true" />
          <span twHint>Required. Pick a time.</span>
          <span twError>Alarm is required.</span>
        </tw-form-field>
        <div class="flex items-center gap-2 mt-4">
          <button twButton variant="outline" size="sm" type="button" (click)="markAlarmTouched()">
            Mark touched
          </button>
          <button twButton variant="outline" size="sm" type="button" (click)="setAlarm()">
            Set 06:30
          </button>
          <button twButton variant="ghost" size="sm" type="button" (click)="clearAlarm()">
            Clear
          </button>
        </div>
        <pre class="text-xs font-mono mt-4 text-fg-muted">{{
          { value: alarmCtrl.value, status: alarmCtrl.status, touched: alarmCtrl.touched } | json
        }}</pre>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21's signal forms API builds the form from a signal model via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        — bind a field with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>
        and the picker participates automatically. Error state fires the standard visual
        feedback when the control is invalid after interaction.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 max-w-md">
        <tw-form-field>
          <label twLabel>Standup time</label>
          <tw-time-picker [formField]="standupForm.standupAt" [minuteStep]="15" />
          <span twHint>Quarter-hour increments.</span>
          <span twError>Standup time is required.</span>
        </tw-form-field>
        <p class="text-xs font-mono mt-3 text-fg-muted">
          standupAt = {{ fmt(standupModel().standupAt) }} · valid =
          {{ standupForm().valid() }}
        </p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">format: '12h'</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">seconds</code>
        enabled for a full clock, or disable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">steppers</code>
        and rely purely on keyboard editing.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Format</label>
            <div class="flex gap-1">
              @for (f of formats; track f) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playFormat() === f"
                  [class.!text-primary-700]="playFormat() === f"
                  (click)="playFormat.set(f)"
                >{{ f }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playColor() === c"
                  [class.!text-primary-700]="playColor() === c"
                  (click)="playColor.set(c)"
                >{{ c }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
            <div class="flex flex-wrap gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playSeconds()"
                [class.!text-primary-700]="playSeconds()"
                (click)="playSeconds.update(v => !v)"
              >seconds</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playSteppers()"
                [class.!text-primary-700]="playSteppers()"
                (click)="playSteppers.update(v => !v)"
              >steppers</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playReadonly()"
                [class.!text-primary-700]="playReadonly()"
                (click)="playReadonly.update(v => !v)"
              >readonly</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken flex justify-center">
          <tw-time-picker
            aria-label="Playground time picker"
            [format]="playFormat()"
            [size]="playSize()"
            [color]="playColor()"
            [showSeconds]="playSeconds()"
            [showSteppers]="playSteppers()"
            [disabled]="playDisabled()"
            [readonly]="playReadonly()"
            [(value)]="playValue"
          />
        </div>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ fmt(playValue()) }}</p>
      </div>
    </section>
  `,
})
export class TimePickerExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly formats = FORMATS;
  protected readonly fmt = fmt;

  // ── Variants / sizes / colors ──
  protected readonly variantValues: Record<TimePickerVariant, Date | null> = {
    default: atTime(9, 30),
    naked: atTime(9, 30),
  };
  protected readonly sizeValues: Record<TwSize, Date | null> = {
    xs: null,
    sm: null,
    md: atTime(9, 0),
    lg: null,
    xl: null,
  };
  protected readonly colorValues: Record<TwColor, Date | null> = {
    primary: atTime(9, 0),
    secondary: atTime(9, 0),
    accent: atTime(9, 0),
    neutral: atTime(9, 0),
    info: atTime(9, 0),
    success: atTime(9, 0),
    warning: atTime(9, 0),
    error: atTime(9, 0),
  };

  // ── Format & seconds ──
  protected readonly formatDemoValue = signal<Date | null>(atTime(14, 30, 45));

  // ── Step demo ──
  protected readonly stepDemoValue = signal<Date | null>(atTime(10, 0));

  // ── Min/max demo ──
  protected readonly businessOpen = atTime(9, 0);
  protected readonly businessClose = atTime(17, 0);
  protected readonly businessHours = signal<Date | null>(atTime(10, 30));

  // ── Disabled / readonly ──
  protected readonly disabledValue = signal<Date | null>(atTime(12, 0));
  protected readonly readonlyValue = signal<Date | null>(atTime(12, 0));

  // ── Template-driven ──
  protected callTime: Date | null = atTime(14, 0);

  // ── Reactive forms ──
  protected readonly alarmCtrl = new FormControl<Date | null>(null, [Validators.required]);
  protected markAlarmTouched(): void {
    this.alarmCtrl.markAsTouched();
  }
  protected setAlarm(): void {
    this.alarmCtrl.setValue(atTime(6, 30));
  }
  protected clearAlarm(): void {
    this.alarmCtrl.reset(null);
  }

  // ── Signal forms ──
  protected readonly standupModel = signal<{ standupAt: Date | null }>({ standupAt: null });
  protected readonly standupForm = form(this.standupModel, (path) => {
    required(path.standupAt, { message: 'Standup time is required.' });
  });

  // ── Playground ──
  protected readonly playFormat = signal<TimePickerFormat>('24h');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSeconds = signal(false);
  protected readonly playSteppers = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playReadonly = signal(false);
  protected readonly playValue = signal<Date | null>(atTime(14, 30, 0));

  // ── Code snippets ──

  protected readonly variantsSnippet = `<tw-time-picker variant="default" [(value)]="time" aria-label="Default" />
<tw-time-picker variant="naked" [(value)]="time" aria-label="Naked" />

<!-- Auto-resolves to naked inside tw-form-field -->
<tw-form-field>
  <label twLabel>Time</label>
  <tw-time-picker [(value)]="time" />
</tw-form-field>`;

  protected readonly colorsSnippet = `
@for (color of colors; track color) {
  <tw-time-picker
    [color]="color"
    [(value)]="colorValues[color]"
    [attr.aria-label]="color"
  />
}`.trim();

  protected readonly sizesSnippet = `
@for (size of sizes; track size) {
  <tw-time-picker
    [size]="size"
    [(value)]="sizeValues[size]"
    [attr.aria-label]="'Size ' + size"
  />
}`.trim();

  protected readonly formatSnippet = `<tw-time-picker format="24h" [(value)]="time" aria-label="24-hour time" />
<tw-time-picker format="12h" [(value)]="time" aria-label="12-hour time" />
<tw-time-picker format="24h" [showSeconds]="true" [(value)]="time" aria-label="Time with seconds" />`;

  protected readonly stepsSnippet = `<tw-time-picker [(value)]="time" [minuteStep]="15" aria-label="Quarter-hour time" />

<tw-time-picker
  [(value)]="time"
  [hourStep]="2"
  [minuteStep]="5"
  aria-label="Five-minute time"
/>`;

  protected readonly minMaxSnippet = `<tw-time-picker
  [(value)]="meeting"
  [minTime]="businessOpen"
  [maxTime]="businessClose"
  aria-label="Meeting time"
/>`;

  protected readonly statesSnippet = `<!-- Disabled — dimmed, no interactions -->
<tw-time-picker [(value)]="value" [disabled]="true" aria-label="Disabled time picker" />

<!-- Readonly — visible and focusable, but refuses edits -->
<tw-time-picker [(value)]="value" [readonly]="true" aria-label="Readonly time picker" />`;

  protected readonly tdTsSnippet = `protected callTime: Date | null = new Date();`;

  protected readonly tdHtmlSnippet = `<tw-form-field>
  <label twLabel>Preferred call time</label>
  <tw-time-picker name="callTime" [(ngModel)]="callTime" format="12h" />
  <span twHint>When we can reach you.</span>
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly alarmCtrl = new FormControl<Date | null>(
  null,
  [Validators.required],
);`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Alarm</label>
  <tw-time-picker [formControl]="alarmCtrl" [showSeconds]="true" />
  <span twHint>Required. Pick a time.</span>
  <span twError>Alarm is required.</span>
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly standupModel = signal<{ standupAt: Date | null }>({ standupAt: null });
protected readonly standupForm = form(this.standupModel, (path) => {
  required(path.standupAt, { message: 'Standup time is required.' });
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Standup time</label>
  <tw-time-picker [formField]="standupForm.standupAt" [minuteStep]="15" />
  <span twHint>Quarter-hour increments.</span>
  <span twError>Standup time is required.</span>
</tw-form-field>`;
}
