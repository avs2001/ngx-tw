import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { TimePickerFormat, TwColor, TwSize } from 'ngx-tw/core';
import {
  CalendarComponent,
  provideRangeSelectionStrategy,
  type DateRange,
  type TwCalendarView,
  type TwDateFilter,
  TwDateRange,
  type ViewChangeEvent,
} from 'ngx-tw/calendar';
import { ButtonDirective } from 'ngx-tw/button';
import {
  TimePickerComponent,
  type TimePickerChangeEvent,
} from 'ngx-tw/time-picker';
import type { DateRangePickerMonths, DateRangePreset } from './date-range-picker';

/**
 * Internal overlay panel for `tw-date-range-picker`. Hosts the optional preset
 * list, a single `tw-calendar` in `selectionMode="range"` configured with
 * `numberOfMonths` (1 or 2 months under one header), an optional time row, and
 * an optional action bar. Receives configuration and interaction callbacks via
 * signal-backed fields set from the outer component. Not exported from the
 * public API.
 */
@Component({
  selector: 'tw-date-range-picker-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent, TimePickerComponent, ButtonDirective],
  providers: [provideRangeSelectionStrategy()],
  host: {
    '[class]': 'panelClasses()',
    '[id]': 'dialogId()',
    '[attr.role]': '"dialog"',
    '[attr.aria-modal]': '"true"',
    '[attr.aria-label]': 'dialogAriaLabel()',
    '[animate.enter]': '"scale-in fade-in"',
    '[animate.leave]': 'leaving() ? "scale-out fade-out" : ""',
  },
  template: `
    @if (presets().length) {
      <div
        class="flex flex-col gap-1 p-2 border-r border-border bg-surface-muted min-w-[10rem]"
        role="listbox"
        aria-label="Preset ranges"
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

    <div class="flex flex-col flex-1">
      <tw-calendar
        #calendar
        mode="range"
        class="!rounded-none !border-0 !bg-transparent !p-2"
        [bordered]="false"
        [value]="$any(pendingRangeAsRange())"
        [startAt]="$any(initialStartAt())"
        [startView]="startView()"
        [monthColumns]="numberOfMonths()"
        [minDate]="minDate()"
        [maxDate]="maxDate()"
        [dateFilter]="dateFilter()"
        [attr.aria-label]="calendarAriaLabel()"
        (valueChange)="onCalendarRangeSelected($event)"
        (viewChange)="onViewChanged($event)"
      />

      @if (showTime() && hasTimeablePending()) {
        <div class="border-t border-border flex items-center justify-between gap-3 px-3 py-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-fg-muted">Start</span>
            <tw-time-picker
              variant="naked"
              [value]="pendingRange()!.start"
              [size]="size()"
              [color]="color()"
              [format]="timeFormat()"
              [showSeconds]="showSeconds()"
              [hourStep]="hourStep()"
              [minuteStep]="minuteStep()"
              [secondStep]="secondStep()"
              [showClear]="false"
              [referenceDate]="pendingRange()!.start"
              aria-label="Start time"
              (timeChange)="onStartTime($event)"
            />
          </div>
          <span class="text-fg-subtle shrink-0">{{ rangeSeparator() }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-fg-muted">End</span>
            <tw-time-picker
              variant="naked"
              [value]="pendingRange()!.end"
              [size]="size()"
              [color]="color()"
              [format]="timeFormat()"
              [showSeconds]="showSeconds()"
              [hourStep]="hourStep()"
              [minuteStep]="minuteStep()"
              [secondStep]="secondStep()"
              [showClear]="false"
              [referenceDate]="pendingRange()!.end"
              aria-label="End time"
              (timeChange)="onEndTime($event)"
            />
          </div>
        </div>
      }

      @if (showActions()) {
        <div class="border-t border-border flex items-center justify-between gap-2 px-3 py-2">
          <div class="flex items-center gap-2">
            <button twButton variant="ghost" size="sm" type="button" (click)="handleToday()">
              {{ todayLabel() }}
            </button>
            @if (pendingRange() !== null) {
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
    </div>
  `,
})
export class DateRangePickerOverlayComponent<D = unknown> {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly calendarRef = viewChild<CalendarComponent<'range', D>>('calendar');

  // ── Config signals set by the parent ──

  /** @internal */
  readonly size = signal<TwSize>('md');
  /** @internal */
  readonly color = signal<TwColor>('primary');
  /** @internal */
  readonly minDate = signal<D | null>(null);
  /** @internal */
  readonly maxDate = signal<D | null>(null);
  /** @internal */
  readonly dateFilter = signal<TwDateFilter<D> | null>(null);
  /** @internal */
  readonly startView = signal<TwCalendarView>('day');
  /** @internal */
  readonly numberOfMonths = signal<DateRangePickerMonths>(2);
  /** @internal Current pending range shown as selected in the calendar. */
  readonly pendingRange = signal<TwDateRange<D> | null>(null);
  /** @internal */
  readonly currentView = signal<TwCalendarView>('day');
  /** @internal */
  readonly presets = signal<readonly DateRangePreset<D>[]>([]);
  /** @internal */
  readonly activePresetId = signal<string | undefined>(undefined);
  /** @internal */
  readonly showActions = signal(false);
  /** @internal */
  readonly showTime = signal(false);
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
  readonly todayLabel = signal('Today');
  /** @internal */
  readonly clearLabel = signal('Clear');
  /** @internal */
  readonly cancelLabel = signal('Cancel');
  /** @internal */
  readonly applyLabel = signal('Apply');
  /** @internal */
  readonly rangeSeparator = signal(' – ');
  /** @internal */
  readonly dialogId = signal<string>('');
  /** @internal */
  readonly dialogAriaLabel = signal<string>('Choose a date range');
  /** @internal */
  readonly panelClassValue = signal<string>('');
  /** @internal */
  readonly leaving = signal(false);

  // ── Callbacks set by the parent ──

  /** @internal */
  readonly onCalendarSelect = signal<(range: TwDateRange<D>) => void>(() => {});
  /** @internal */
  readonly onPresetSelect = signal<(preset: DateRangePreset<D>) => void>(() => {});
  /** @internal */
  readonly onStartTimeChange = signal<(date: D | null) => void>(() => {});
  /** @internal */
  readonly onEndTimeChange = signal<(date: D | null) => void>(() => {});
  /** @internal */
  readonly onViewChange = signal<(view: TwCalendarView) => void>(() => {});
  /** @internal */
  readonly onToday = signal<() => void>(() => {});
  /** @internal */
  readonly onClear = signal<() => void>(() => {});
  /** @internal */
  readonly onCancel = signal<() => void>(() => {});
  /** @internal */
  readonly onApply = signal<() => void>(() => {});

  // ── Derived ──

  /** @internal */
  readonly panelClasses = computed(() => {
    const base =
      'block bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex max-w-[calc(100vw-16px)]';
    const custom = this.panelClassValue();
    return custom ? `${base} ${custom}` : base;
  });

  /** @internal */
  readonly calendarAriaLabel = computed(() =>
    this.numberOfMonths() === 2 ? 'Date range calendar (two months)' : 'Date range calendar',
  );

  /** @internal The time row requires both endpoints to be set — each time-picker needs a concrete date. */
  readonly hasTimeablePending = computed(() => {
    const v = this.pendingRange();
    return v !== null && v.start !== null && v.end !== null;
  });

  /** @internal Adapts `TwDateRange<D> | null` to the `CalendarRangeValue<D>` shape the calendar's `value` input expects. */
  readonly pendingRangeAsRange = computed<{ start: D | null; end: D | null }>(() => {
    const v = this.pendingRange();
    return v ? { start: v.start, end: v.end } : { start: null, end: null };
  });

  /** @internal Seeds the calendar's active month on first attach so it anchors to the current value rather than today. */
  readonly initialStartAt = computed<D | null>(() => {
    const v = this.pendingRange();
    return v?.start ?? null;
  });

  // ── Template handlers ──

  /** @internal */
  presetKey(index: number, preset: DateRangePreset<D>): string | number {
    return preset.id ?? preset.label ?? index;
  }

  /** @internal */
  isActivePreset(preset: DateRangePreset<D>): boolean {
    return !!preset.id && this.activePresetId() === preset.id;
  }

  /** @internal */
  onCalendarRangeSelected(value: unknown): void {
    // `selectedChange` from the calendar emits the range strategy's completed selection
    // (a `DateRange<D>`). Wrap it into a `TwDateRange` for downstream consumers.
    if (value && typeof value === 'object' && 'start' in value && 'end' in value) {
      const r = value as DateRange<D>;
      this.onCalendarSelect()(new TwDateRange<D>(r.start, r.end));
    }
  }

  /** @internal */
  onViewChanged(event: ViewChangeEvent): void {
    this.currentView.set(event.to);
    this.onViewChange()(event.to);
  }

  /** @internal */
  onStartTime(event: TimePickerChangeEvent<D>): void {
    if (event.source === 'programmatic') return;
    this.onStartTimeChange()(event.value);
  }

  /** @internal */
  onEndTime(event: TimePickerChangeEvent<D>): void {
    if (event.source === 'programmatic') return;
    this.onEndTimeChange()(event.value);
  }

  /** @internal */
  handlePreset(preset: DateRangePreset<D>): void {
    this.onPresetSelect()(preset);
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

  /** @internal Moves focus to the active cell of the calendar. Called by the parent after open. */
  focusCalendar(): void {
    this.calendarRef()?.focusActiveCell();
  }

  /** @internal Exposes the root overlay element for tests. */
  getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
