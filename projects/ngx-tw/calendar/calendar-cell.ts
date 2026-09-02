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
      // `aria-disabled:` rather than `disabled:` — the button never carries the
      // native `disabled` attribute (see the host template), so the `disabled:`
      // variant would never match.
      button:
        'relative flex items-center justify-center cursor-pointer select-none transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 aria-disabled:cursor-not-allowed',
    },
    variants: {
      // Every view's cell is `h-9` — the 36px `md` control height from
      // docs/vertical-rhythm.md. Month and year cells were `h-10`, which made a
      // month-picker row 4px taller than a day row for no reason and put the
      // value off the height scale. Only the width differs per view (a day is
      // one or two digits in a circle; a month/year is a 3–4 char label in a
      // rounded rect). The panel's height is pinned separately — see the
      // view-region wrapper in `calendar.ts`.
      //
      // Widths are chosen so all three grids compute to the SAME 252px intrinsic
      // width, which is what stops the panel shifting horizontally on a view
      // switch. The day grid is `grid-cols-7 gap-0`: 7 x 36 = 252. The month and
      // year grids are `grid-cols-4 gap-1`: 4 x 60 + 3 x 4 = 252. Month cells were
      // `w-16` (4 x 64 + 12 = 268) and year cells `w-14` (4 x 56 + 12 = 236), which
      // is where the 270 / 286 / 254 panel spread came from.
      //
      // The day cell is deliberately untouched: its `w-9` button has to coincide
      // exactly with its grid column so the range wrapper's `rounded-l-full` /
      // `rounded-r-full` cap lands on the selected endpoint pill instead of ~1px
      // past it. Equalising via the month and year cells keeps that coincidence
      // intact by construction, where a `min-w` on the shared view region would
      // have broken it — see the note in `calendar.ts`.
      view: {
        day: { button: 'h-9 w-9 text-sm rounded-full' },
        month: { button: 'h-9 w-15 text-sm rounded-md' },
        year: { button: 'h-9 w-15 text-sm rounded-md' },
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
    // `aria-selected` belongs HERE, not on the inner <button>. A button's
    // implicit role does not support `aria-selected`, so the previous binding
    // exposed nothing: the selected day's state was invisible to assistive tech
    // (SC 4.1.2). `gridcell` is the role that carries selection state, and it is
    // the element the grid/row structure actually addresses.
    '[attr.aria-selected]': "cell().isSelected || null",
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
      <!--
        No native disabled attribute. A disabled button cannot take DOM focus,
        so focusButton was a silent no-op on any out-of-range cell and the
        roving tabindex drifted out of sync with the real activeElement -
        pressing Tab into a grid whose cursor sat on a bounded date focused
        nothing at all. APG uses aria-disabled for grid cells for exactly this
        reason: the cell stays focusable and announceable, while activation is
        refused in onClick and onKeydown.
      -->
      <button
        #cellButton
        type="button"
        [class]="buttonClasses()"
        [attr.aria-label]="cell().ariaLabel"
        [attr.aria-disabled]="!cell().enabled || null"
        [attr.aria-current]="cell().isToday ? 'date' : null"
        [attr.tabindex]="tabindex()"
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

  /** The active calendar view — drives cell width and radius. Defaults to `'day'`. */
  readonly view: InputSignal<CalendarViewState> = input<CalendarViewState>('day');

  /** `true` when the cell's date is outside the currently displayed month, which mutes its text. Defaults to `false`. */
  readonly outside: InputSignal<boolean> = input<boolean>(false);

  /** Tab index for roving focus (`0` for the active cell, `-1` otherwise). Defaults to `-1`. */
  readonly tabindex: InputSignal<number> = input<number>(-1);

  /** Optional template rendered inside the button — receives `{ $implicit: CalendarCell<D> }`. Defaults to `null` (the cell renders its own display value). */
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
    // Browsers do not dispatch mouse events on a natively disabled button, so
    // before the switch to `aria-disabled` a disabled cell never previewed.
    // Guard explicitly to keep range preview from extending over dates the user
    // cannot pick.
    if (!this.cell().enabled) return;
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
