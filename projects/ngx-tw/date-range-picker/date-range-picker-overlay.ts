import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  signal,
  type TemplateRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import type {
  RangeBehaviorConfig,
  TimePickerFormat,
  TwColor,
  TwSize,
} from 'ngx-tw/core';
import {
  CalendarComponent,
  provideRangeSelectionStrategy,
  type CalendarCell,
  type CalendarViewState,
  type DateClassFn,
  type DateRange,
  type DateFilterFn,
  type RangeClickBehavior,
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
 * Internal directive that adopts a preset `<button>` into the picker's
 * roving-tabindex listbox model. The directive's own host binding wins over
 * `twButton`'s default `tabindex=null`, ensuring the active option carries
 * `tabindex="0"` on the very first paint.
 *
 * @internal
 */
@Directive({
  selector: 'button[twDateRangePresetOption]',
  host: {
    '[attr.tabindex]': 'tabindex()',
  },
})
export class DateRangePresetOptionDirective {
  private readonly elementRef = inject(ElementRef<HTMLButtonElement>);

  /** @internal Tab-index — `'0'` on the active option, `'-1'` on the rest. */
  readonly tabindex = signal<string>('-1');

  /** @internal */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}

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
  imports: [
    CalendarComponent,
    TimePickerComponent,
    ButtonDirective,
    DateRangePresetOptionDirective,
  ],
  providers: [provideRangeSelectionStrategy()],
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
        class="flex flex-col gap-1 p-2 border-r border-border bg-surface-muted min-w-40"
        role="listbox"
        tabindex="-1"
        aria-label="Preset ranges"
        (keydown)="onPresetListKeydown($event)"
      >
        @for (preset of presets(); track presetKey($index, preset); let i = $index) {
          <button
            twButton
            twDateRangePresetOption
            variant="ghost"
            size="sm"
            type="button"
            role="option"
            class="w-full justify-start"
            [attr.aria-selected]="isActivePreset(preset) ? 'true' : 'false'"
            (click)="handlePreset(preset, i)"
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
        [dateClass]="dateClass()"
        [cellTemplate]="cellTemplate()"
        [locale]="locale()"
        [firstDayOfWeek]="firstDayOfWeek()"
        [minRangeLength]="minRangeLength()"
        [maxRangeLength]="maxRangeLength()"
        [rangeBehavior]="rangeBehavior()"
        [rangeClickBehavior]="rangeClickBehavior()"
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
  private readonly presetOptions = viewChildren(DateRangePresetOptionDirective);

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
  readonly dateFilter = signal<DateFilterFn<D> | null>(null);
  /** @internal */
  readonly startView = signal<CalendarViewState>('day');
  /** @internal */
  readonly numberOfMonths = signal<DateRangePickerMonths>(2);
  /** @internal Current pending range shown as selected in the calendar. */
  readonly pendingRange = signal<TwDateRange<D> | null>(null);
  /** @internal */
  readonly currentView = signal<CalendarViewState>('day');
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

  // ── Forwarded calendar config ──

  /** @internal */
  readonly minRangeLength = signal<number | null>(null);
  /** @internal */
  readonly maxRangeLength = signal<number | null>(null);
  /** @internal */
  readonly rangeBehavior = signal<Partial<RangeBehaviorConfig>>({});
  /** @internal */
  readonly rangeClickBehavior = signal<RangeClickBehavior>('restart');
  /** @internal */
  readonly firstDayOfWeek = signal<number | null>(null);
  /** @internal */
  readonly locale = signal<string | null>(null);
  /** @internal */
  readonly dateClass = signal<DateClassFn<D> | null>(null);
  /** @internal */
  readonly cellTemplate = signal<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

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
  readonly onViewChange = signal<(view: CalendarViewState) => void>(() => {});
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

  // ── Preset listbox keyboard ──

  /** @internal Roving tabindex pointer — index of the focusable preset option. */
  readonly activeOptionIndex = signal<number>(0);

  constructor() {
    // Drive the directive's `tabindex` signal from `activeOptionIndex`. We
    // use `afterRenderEffect` so the directive instances are already created
    // when we read them (regular `effect` may run before the view init).
    afterRenderEffect(() => {
      const options = this.presetOptions();
      const active = this.activeOptionIndex();
      for (let i = 0; i < options.length; i++) {
        options[i].tabindex.set(i === active ? '0' : '-1');
      }
    });
  }

  /** @internal */
  onPresetListKeydown(event: KeyboardEvent): void {
    const options = this.presetOptions();
    const count = options.length;
    if (count === 0) return;
    const current = this.activeOptionIndex();
    const move = (next: number): void => {
      const idx = ((next % count) + count) % count;
      this.activeOptionIndex.set(idx);
      options[idx]?.focus();
    };

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(current + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        move(current - 1);
        return;
      case 'Home':
        event.preventDefault();
        move(0);
        return;
      case 'End':
        event.preventDefault();
        move(count - 1);
        return;
      case 'Enter':
      case ' ': {
        const preset = this.presets()[current];
        if (preset) {
          event.preventDefault();
          this.handlePreset(preset, current);
        }
        return;
      }
      default:
        return;
    }
  }

  /** @internal */
  handlePreset(preset: DateRangePreset<D>, index?: number): void {
    if (typeof index === 'number') this.activeOptionIndex.set(index);
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
