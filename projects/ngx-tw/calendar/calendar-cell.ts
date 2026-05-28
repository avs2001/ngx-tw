import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  output,
  viewChild,
  type InputSignal,
  type OutputEmitterRef,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { tv } from 'tailwind-variants';
import type { CalendarCell, CalendarCellState, CalendarViewState } from './calendar.types';

/** Emitted on keyboard navigation keys (arrows, Home/End, PageUp/PageDown). */
export interface CalendarCellKeyNavEvent<D> {
  readonly direction: 'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'pageUp' | 'pageDown';
  /** True when the originating KeyboardEvent had Shift held — drives year-jump variants of Page navigation. */
  readonly shiftKey: boolean;
  readonly cell: CalendarCell<D>;
}

const cellVariants = tv(
  {
    slots: {
      wrapper: 'relative flex items-center justify-center',
      button:
        'relative flex items-center justify-center cursor-pointer select-none transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-not-allowed',
    },
    variants: {
      view: {
        day: { button: 'h-9 w-9 text-sm rounded-full' },
        month: { button: 'h-10 w-16 text-sm rounded-md' },
        year: { button: 'h-10 w-14 text-sm rounded-md' },
      },
      // Slot tokens own light/dark contrast — no `dark:`, no shade picks.
      // The range wash uses `primary-soft-hover` (one step deeper than `-soft`)
      // so the in-range band reads slightly stronger than the popover surface
      // without competing with the selected endpoints.
      state: {
        default: { button: 'text-fg hover:bg-surface-muted' },
        today: {
          button:
            'text-primary-fg font-semibold ring-1 ring-primary-border-strong hover:bg-primary-soft',
        },
        selected: {
          button: 'bg-primary-solid text-primary-solid-fg font-semibold hover:bg-primary-solid-hover',
        },
        'range-start': {
          button:
            'bg-primary-solid text-primary-solid-fg font-semibold rounded-l-full rounded-r-none hover:bg-primary-solid-hover',
        },
        'range-middle': {
          button:
            'bg-primary-soft-hover text-primary-soft-fg rounded-none hover:bg-primary-soft',
        },
        'range-end': {
          button:
            'bg-primary-solid text-primary-solid-fg font-semibold rounded-r-full rounded-l-none hover:bg-primary-solid-hover',
        },
        'preview-start': {
          button:
            'bg-primary-soft-hover text-primary-soft-fg rounded-l-full rounded-r-none ring-1 ring-primary-border-strong opacity-70',
        },
        'preview-middle': {
          button:
            'bg-primary-soft-hover text-primary-soft-fg rounded-none opacity-70',
        },
        'preview-end': {
          button:
            'bg-primary-soft-hover text-primary-soft-fg rounded-r-full rounded-l-none ring-1 ring-primary-border-strong opacity-70',
        },
        disabled: { button: 'text-fg-subtle cursor-not-allowed hover:bg-transparent' },
      },
      outside: {
        true: { button: 'text-fg-muted' },
        false: {},
      },
      range: {
        none: {},
        start: { wrapper: 'bg-primary-soft-hover rounded-l-full' },
        middle: { wrapper: 'bg-primary-soft-hover' },
        end: { wrapper: 'bg-primary-soft-hover rounded-r-full' },
        single: {},
      },
    },
    compoundVariants: [
      { state: 'disabled', outside: true, class: { button: 'text-fg-subtle' } },
      { state: 'selected', class: { button: 'ring-0' } },
    ],
    defaultVariants: { view: 'day', state: 'default', outside: false, range: 'none' },
  },
  { twMerge: true },
);

/**
 * Renders a single cell in any calendar view.
 *
 * The cell is a stateless presentation component — selection / preview /
 * today state is all derived from the `CalendarCell<D>` data object. It
 * emits events for clicks, keyboard navigation, mouse hover, and focus.
 */
@Component({
  selector: 'tw-calendar-cell',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'gridcell',
    // Phase 4 — `data-state-*` styling contract (§34.5). Each attribute is `''`
    // when its boolean state is true and absent (`null`) otherwise so consumers
    // can target via `tw-calendar-cell[data-state-today]` selectors.
    '[attr.data-state-today]': "cell().isToday ? '' : null",
    '[attr.data-state-selected]': "cell().isSelected && !cell().isRangeStart && !cell().isRangeEnd && !cell().isRangeMiddle ? '' : null",
    '[attr.data-state-range-start]': "cell().isRangeStart ? '' : null",
    '[attr.data-state-range-end]': "cell().isRangeEnd ? '' : null",
    '[attr.data-state-in-range]': "cell().isRangeMiddle ? '' : null",
    '[attr.data-state-range-preview-start]': "cell().isPreviewStart ? '' : null",
    '[attr.data-state-range-preview-end]': "cell().isPreviewEnd ? '' : null",
    '[attr.data-state-in-range-preview]': "cell().isPreviewMiddle ? '' : null",
    '[attr.data-state-invalid-preview]': "cell().isInvalidPreview ? '' : null",
    '[attr.data-state-invalid-flash]': "cell().isInvalidFlash ? '' : null",
    '[attr.data-state-disabled]': "!cell().enabled ? '' : null",
    '[attr.data-state-out-of-month]': "outside() ? '' : null",
    '[attr.data-state-weekend]': "cell().isWeekend ? '' : null",
    '[attr.data-state-focused]': "tabindex() === 0 ? '' : null",
  },
  template: `
    <div [class]="wrapperClasses()">
      <button
        #cellButton
        type="button"
        [class]="buttonClasses()"
        [attr.aria-label]="cell().ariaLabel"
        [attr.aria-selected]="cell().isSelected || null"
        [attr.aria-disabled]="!cell().enabled || null"
        [attr.aria-current]="cell().isToday ? 'date' : null"
        [attr.tabindex]="tabindex()"
        [disabled]="!cell().enabled"
        (click)="onClick()"
        (keydown)="onKeydown($event)"
        (mouseenter)="onMouseEnter()"
        (focus)="onFocus()"
      >
        @if (cellTemplate()) {
          <ng-container
            [ngTemplateOutlet]="cellTemplate()!"
            [ngTemplateOutletContext]="{ $implicit: cell() }"
          />
        } @else {
          {{ cell().displayValue }}
        }
      </button>
    </div>
  `,
})
export class CalendarCellComponent<D> {
  private readonly buttonRef: Signal<ElementRef<HTMLButtonElement> | undefined> =
    viewChild<ElementRef<HTMLButtonElement>>('cellButton');

  /** The cell data object to render. */
  readonly cell: InputSignal<CalendarCell<D>> = input.required<CalendarCell<D>>();

  /** The active calendar view — drives cell dimensions and radius. */
  readonly view: InputSignal<CalendarViewState> = input<CalendarViewState>('day');

  /** `true` when the cell's date is outside the currently displayed month. */
  readonly outside: InputSignal<boolean> = input<boolean>(false);

  /** Tab index for roving focus (`0` for the active cell, `-1` otherwise). */
  readonly tabindex: InputSignal<number> = input<number>(-1);

  /** Optional template rendered inside the button — receives `{ $implicit: CalendarCell<D> }`. */
  readonly cellTemplate: InputSignal<TemplateRef<{ $implicit: CalendarCell<D> }> | null> =
    input<TemplateRef<{ $implicit: CalendarCell<D> }> | null>(null);

  /** Emitted when the user activates the cell (click, Enter, or Space). */
  readonly selected: OutputEmitterRef<CalendarCell<D>> = output<CalendarCell<D>>();

  /** Emitted when the cell gains focus. */
  readonly focused: OutputEmitterRef<CalendarCell<D>> = output<CalendarCell<D>>();

  /** Emitted on pointer hover — parent uses this to drive range preview. */
  readonly previewed: OutputEmitterRef<CalendarCell<D>> = output<CalendarCell<D>>();

  /** Emitted on navigation keys (arrows, Home/End, PageUp/PageDown). */
  readonly keyNav: OutputEmitterRef<CalendarCellKeyNavEvent<D>> = output<CalendarCellKeyNavEvent<D>>();

  protected readonly cellState: Signal<CalendarCellState> = computed(() => {
    const c = this.cell();
    if (!c.enabled) return 'disabled';
    if (c.isRangeStart) return 'range-start';
    if (c.isRangeEnd) return 'range-end';
    if (c.isRangeMiddle) return 'range-middle';
    if (c.isPreviewStart) return 'preview-start';
    if (c.isPreviewEnd) return 'preview-end';
    if (c.isPreviewMiddle) return 'preview-middle';
    if (c.isSelected) return 'selected';
    if (c.isToday) return 'today';
    return 'default';
  });

  protected readonly wrapperRange: Signal<'none' | 'start' | 'middle' | 'end' | 'single'> = computed(() => {
    const c = this.cell();
    if (c.isRangeStart && c.isRangeEnd) return 'single';
    if (c.isRangeStart) return 'start';
    if (c.isRangeEnd) return 'end';
    if (c.isRangeMiddle) return 'middle';
    return 'none';
  });

  private readonly variantResult = computed(() =>
    cellVariants({
      view: this.view(),
      state: this.cellState(),
      outside: this.outside(),
      range: this.wrapperRange(),
    }),
  );

  protected readonly wrapperClasses: Signal<string> = computed(() => this.variantResult().wrapper());

  protected readonly buttonClasses: Signal<string> = computed(() => {
    const base = this.variantResult().button();
    const extra = this.cell().cssClasses;
    return extra ? `${base} ${extra}` : base;
  });

  protected onClick(): void {
    const c = this.cell();
    if (c.enabled) this.selected.emit(c);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const navKeys: Record<string, CalendarCellKeyNavEvent<D>['direction']> = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      Home: 'home',
      End: 'end',
      PageUp: 'pageUp',
      PageDown: 'pageDown',
    };
    const direction = navKeys[event.key];
    if (direction) {
      event.preventDefault();
      this.keyNav.emit({ direction, shiftKey: event.shiftKey, cell: this.cell() });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const c = this.cell();
      if (c.enabled) this.selected.emit(c);
    }
  }

  protected onMouseEnter(): void {
    this.previewed.emit(this.cell());
  }

  protected onFocus(): void {
    this.focused.emit(this.cell());
  }

  /** Imperatively focuses this cell's button. */
  focusButton(): void {
    this.buttonRef()?.nativeElement.focus();
  }
}
