import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import type { TimePickerFormat, TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  CalendarComponent,
  provideSingleSelectionStrategy,
  type CalendarCell,
  type CalendarViewState,
  type DateClassFn,
  type DateFilterFn,
} from '@cdevhub/ngx-tw/calendar';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import {
  TimePickerComponent,
  type TimePickerChangeEvent,
} from '@cdevhub/ngx-tw/time-picker';
import type { DatePickerPreset } from './date-picker';

/**
 * Internal overlay panel for `tw-date-picker`. Hosts the calendar and, when
 * the parent enables `showActions`, the action bar. Receives configuration
 * and interaction callbacks via signal-backed fields set from the outer
 * component. Not exported from the public API.
 */
@Component({
  selector: 'tw-date-picker-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent, TimePickerComponent, ButtonDirective],
  providers: [provideSingleSelectionStrategy()],
  host: {
    '[class]': 'panelClasses()',
    '[id]': 'dialogId()',
    '[attr.role]': '"dialog"',
    '[attr.aria-modal]': '"true"',
    '[attr.aria-label]': 'dialogAriaLabel()',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': 'leaving() ? "scale-out" : ""',
  },
  template: `
    @if (presets().length) {
      <div
        class="flex flex-col gap-1 p-2 border-b border-border bg-surface-muted"
        role="listbox"
        aria-label="Preset dates"
      >
        @for (preset of presets(); track presetKey($index, preset)) {
          <button
            twButton
            variant="ghost"
            size="sm"
            type="button"
            role="option"
            class="w-full justify-start"
            [attr.aria-selected]="isActivePreset(preset) ? 'true' : 'false'"
            (click)="handlePreset(preset)"
          >
            {{ preset.label }}
          </button>
        }
      </div>
    }

    <tw-calendar
      #calendar
      class="!block !rounded-none !border-0 !bg-transparent !p-2"
      [bordered]="false"
      [value]="pendingValue()"
      [startAt]="startAt()"
      [startView]="startView()"
      [minDate]="minDate()"
      [maxDate]="maxDate()"
      [dateFilter]="dateFilter()"
      [dateClass]="dateClass()"
      [cellTemplate]="cellTemplate()"
      [locale]="locale()"
      aria-label="Calendar"
      (valueChange)="onCalendarDateSelected($event)"
    />

    @if (withTime()) {
      <div class="border-t border-border px-3 py-2 flex items-center justify-center">
        <tw-time-picker
          variant="naked"
          [value]="pendingValue()"
          [size]="size()"
          [color]="color()"
          [format]="timeFormat()"
          [showSeconds]="showSeconds()"
          [hourStep]="hourStep()"
          [minuteStep]="minuteStep()"
          [secondStep]="secondStep()"
          [minTime]="minTime()"
          [maxTime]="maxTime()"
          [showClear]="false"
          [referenceDate]="pendingValue() ?? startAt() ?? null"
          aria-label="Time"
          (timeChange)="onTimeChange($event)"
        />
      </div>
    }

    @if (showActions()) {
      <div class="border-t border-border flex items-center justify-between gap-2 px-3 py-2">
        <div class="flex items-center gap-2">
          <button twButton variant="ghost" size="sm" type="button" (click)="handleToday()">
            {{ todayLabel() }}
          </button>
          @if (pendingValue() !== null) {
            <button twButton variant="ghost" size="sm" type="button" (click)="handleClear()">
              {{ clearLabel() }}
            </button>
          }
        </div>
        <div class="flex items-center gap-2">
          <button twButton variant="ghost" size="sm" type="button" (click)="handleCancel()">
            {{ cancelLabel() }}
          </button>
          <button twButton variant="solid" size="sm" type="button" (click)="handleApply()">
            {{ applyLabel() }}
          </button>
        </div>
      </div>
    }
  `,
})
export class DatePickerOverlayComponent<D = unknown> {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly calendarRef = viewChild<CalendarComponent<'single', D>>('calendar');

  // ── Config signals set by the parent component ──

  /** @internal */
  readonly size = signal<TwSize>('md');
  /** @internal */
  readonly color = signal<TwColor>('primary');
  /** @internal */
  readonly minDate = signal<D | null>(null);
  /** @internal */
  readonly maxDate = signal<D | null>(null);
  /** @internal */
  readonly dateFilter = signal<DateFilterFn<D> | null>(null);
  /** @internal */
  readonly startView = signal<CalendarViewState>('day');
  /** @internal */
  readonly startAt = signal<D | null>(null);
  /** @internal Current committed-or-pending value shown as selected in the calendar. */
  readonly pendingValue = signal<D | null>(null);
  /** @internal */
  readonly showActions = signal(false);
  /** @internal */
  readonly todayLabel = signal('Today');
  /** @internal */
  readonly clearLabel = signal('Clear');
  /** @internal */
  readonly cancelLabel = signal('Cancel');
  /** @internal */
  readonly applyLabel = signal('Apply');
  /** @internal */
  readonly dialogId = signal<string>('');
  /** @internal */
  readonly dialogAriaLabel = signal<string>('Choose a date');
  /** @internal */
  readonly panelClassValue = signal<string>('');
  /** @internal */
  readonly leaving = signal(false);

  /** @internal Forwarded to the calendar — per-cell CSS classes. */
  readonly dateClass = signal<DateClassFn<D> | null>(null);
  /** @internal Forwarded to the calendar — cell-content template. */
  readonly cellTemplate = signal<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);
  /** @internal Forwarded to the calendar — per-instance locale override. */
  readonly locale = signal<string | null>(null);
  /** @internal Quick-select presets rendered above the calendar. */
  readonly presets = signal<readonly DatePickerPreset<D>[]>([]);

  // ── Time-picker config ──

  /** @internal */
  readonly withTime = signal(false);
  /** @internal */
  readonly timeFormat = signal<TimePickerFormat>('24h');
  /** @internal */
  readonly showSeconds = signal(false);
  /** @internal */
  readonly hourStep = signal(1);
  /** @internal */
  readonly minuteStep = signal(1);
  /** @internal */
  readonly secondStep = signal(1);
  /** @internal */
  readonly minTime = signal<D | null>(null);
  /** @internal */
  readonly maxTime = signal<D | null>(null);

  // ── Callbacks set by the parent component ──

  /** @internal */
  readonly onCalendarSelect = signal<(date: D) => void>(() => {});
  /** @internal Fires whenever the embedded time-picker commits a new time. */
  readonly onTimeInput = signal<(date: D | null) => void>(() => {});
  /** @internal */
  readonly onToday = signal<() => void>(() => {});
  /** @internal */
  readonly onClear = signal<() => void>(() => {});
  /** @internal */
  readonly onCancel = signal<() => void>(() => {});
  /** @internal */
  readonly onApply = signal<() => void>(() => {});
  /** @internal */
  readonly onPresetSelect = signal<(preset: DatePickerPreset<D>) => void>(() => {});

  // ── Classes ──

  /** @internal */
  readonly panelClasses = computed(() => {
    const base =
      'block bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex flex-col';
    const custom = this.panelClassValue();
    return custom ? `${base} ${custom}` : base;
  });

  // ── Template callbacks ──

  /** @internal */
  onCalendarDateSelected(value: unknown): void {
    // Single-mode strategy emits a scalar `D`. Guard against the wider calendar
    // output type for safety.
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) return;
    if (typeof value === 'object' && value !== null && 'start' in value && 'end' in value) return;
    this.onCalendarSelect()(value as D);
  }

  /** @internal */
  onTimeChange(event: TimePickerChangeEvent<D>): void {
    if (event.source === 'programmatic') return;
    this.onTimeInput()(event.value);
  }

  /** @internal */
  handleToday(): void {
    this.onToday()();
  }

  /** @internal */
  handleClear(): void {
    this.onClear()();
  }

  /** @internal */
  handleCancel(): void {
    this.onCancel()();
  }

  /** @internal */
  handleApply(): void {
    this.onApply()();
  }

  /** @internal */
  handlePreset(preset: DatePickerPreset<D>): void {
    this.onPresetSelect()(preset);
  }

  /** @internal */
  presetKey(index: number, preset: DatePickerPreset<D>): string | number {
    return preset.id ?? preset.label ?? index;
  }

  /** @internal */
  isActivePreset(preset: DatePickerPreset<D>): boolean {
    return !!preset.id && this.activePresetId() === preset.id;
  }

  /** @internal Tracks the most recently picked preset for visual state. Set by the parent. */
  readonly activePresetId = signal<string | undefined>(undefined);

  /** @internal Moves focus to the active calendar cell. Called by the parent after open. */
  focusCalendar(): void {
    this.calendarRef()?.focusActiveCell();
  }

  /** @internal Exposes the root overlay element for tests. */
  getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
