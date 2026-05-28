import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  isDevMode,
  type OnDestroy,
  type OnInit,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AriaDescriber, FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';
import { SortDirective, type SortDirection, type TwSortable } from './sort';

function snapshot(self: SortHeaderComponent): TwSortable {
  return {
    id: self.id(),
    start: self.start(),
    disableClear: self.disableClear(),
    disabled: self.isDisabled(),
  };
}

/** Position of the sort arrow relative to the header label. */
export type TwSortArrowPosition = 'before' | 'after';

// ── Static per-color maps (Tailwind v4 requires literal class strings for its JIT scanner). ──

const ARROW_ACTIVE_COLOR: Record<TwColor, string> = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  accent: 'text-accent-600',
  neutral: 'text-fg',
  info: 'text-info-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
};

// ── tv() config ──

const sortHeaderVariants = tv(
  {
    slots: {
      host: 'group select-none',
      container:
        'inline-flex items-center gap-1.5 cursor-pointer rounded-md font-medium text-fg transition-colors duration-normal motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      label: 'min-w-0',
      arrow:
        'inline-flex shrink-0 items-center justify-center transition-opacity duration-normal motion-reduce:transition-none',
      arrowIcon:
        'shrink-0 transition-transform duration-normal motion-reduce:transition-none',
    },
    variants: {
      size: {
        xs: {
          container: 'px-2 py-1 text-xs',
          // `size-3.5` half-step: only icon size aligning with text-xs without
          // dominating it; codified per CLAUDE.md.
          arrowIcon: 'size-3.5',
        },
        sm: {
          container: 'px-2.5 py-1.5 text-sm',
          arrowIcon: 'size-4',
        },
        md: {
          container: 'px-3 py-2 text-sm',
          arrowIcon: 'size-4',
        },
        lg: {
          container: 'px-4 py-2.5 text-base',
          arrowIcon: 'size-5',
        },
        xl: {
          container: 'px-5 py-3 text-base',
          arrowIcon: 'size-5',
        },
      },
      active: {
        true: {
          container: 'text-fg',
          arrow: 'opacity-100',
        },
        false: {
          container: 'text-fg-muted',
          arrow:
            'opacity-0 group-hover:opacity-50 group-focus-within:opacity-50',
        },
      },
      direction: {
        asc: { arrowIcon: 'rotate-180' },
        desc: { arrowIcon: 'rotate-0' },
        none: { arrowIcon: 'rotate-0' },
      },
      disabled: {
        true: {
          host: 'opacity-50 pointer-events-none',
          container: 'cursor-not-allowed',
        },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      active: false,
      direction: 'none',
      disabled: false,
    },
  },
  { twMerge: true },
);

/**
 * Turns any element (e.g., `<th>`, `<div>`, `<button>`) into a sortable header under a parent
 * `SortDirective`. Renders the projected label plus an arrow that reflects the current direction.
 * Triggers a sort cycle on click or Enter/Space.
 */
@Component({
  selector: '[tw-sort-header]',
  exportAs: 'twSortHeader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './sort-header.html',
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '(click)': 'handleClick()',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class SortHeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Unique id for this header. Required — identifies the field/column this header sorts. */
  readonly id = input.required<string>();

  /** Overrides the parent directive's `start` for this header only. `undefined` inherits from the parent. */
  readonly start = input<'asc' | 'desc' | undefined>(undefined);

  /** Overrides the parent directive's `disableClear` for this header only. `undefined` inherits from the parent. */
  readonly disableClear = input<boolean | undefined>(undefined);

  /** When true, this header is disabled — clicks and keyboard activation are ignored. Defaults to `false`. */
  readonly headerDisabled = input<boolean>(false, { alias: 'disabled' });

  /** Whether the sort arrow renders `'before'` or `'after'` the projected label. Defaults to `'after'`. */
  readonly arrowPosition = input<TwSortArrowPosition>('after');

  /** Semantic color used to tint the arrow when this header is active. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls padding and font size. Uses the shared `TwSize` scale. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Accessible description applied via `AriaDescriber` so screen readers announce the sort action alongside the header text. Defaults to `'Sort'`. */
  readonly sortActionDescription = input<string>('Sort');

  private readonly parent = inject(SortDirective, { optional: true });
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly ariaDescriber = inject(AriaDescriber, { optional: true });

  private readonly containerRef =
    viewChild<ElementRef<HTMLElement>>('container');

  private _describedBy: string | null = null;

  constructor() {
    if (!this.parent && isDevMode()) {
      throw new Error(
        'tw-sort-header must be placed within a parent element with the twSort directive.',
      );
    }

    // Reactive: re-tags the host whenever `sortActionDescription` (a public
    // signal input) changes; consumers may swap the description at runtime for
    // i18n / state-driven copy. Cleanup runs in `ngOnDestroy`. Not a one-shot
    // `afterNextRender`: that would freeze the description at first render and
    // silently ignore subsequent rebinds.
    effect(() => {
      const description = this.sortActionDescription();
      const el = this.containerRef()?.nativeElement;
      if (!el || !this.ariaDescriber) return;
      if (this._describedBy) {
        this.ariaDescriber.removeDescription(el, this._describedBy);
      }
      this.ariaDescriber.describe(el, description);
      this._describedBy = description;
    });
  }

  // ── Derived signals ──

  /** Whether this header is currently the active (sorted) header. */
  readonly isActive = computed(
    () => this.parent?.active() === this.id(),
  );

  /** Whether this header is disabled via its own input or the parent directive's `disabled`. */
  readonly isDisabled = computed(
    () => this.headerDisabled() || (this.parent?.disabled() ?? false),
  );

  /** Active direction for *this* header (null when not active). */
  readonly effectiveDirection = computed<SortDirection>(() =>
    this.isActive() ? (this.parent?.direction() ?? null) : null,
  );

  /** `aria-sort` value: `'ascending' | 'descending' | 'none'`. */
  readonly ariaSort = computed(() => {
    const d = this.effectiveDirection();
    if (d === 'asc') return 'ascending';
    if (d === 'desc') return 'descending';
    return 'none';
  });

  /** Whether the arrow element should render. Active headers always render; inactive render when not disabled so hover reveals the affordance. */
  readonly renderArrow = computed(() => this.isActive() || !this.isDisabled());

  // ── Variant class computation ──

  private readonly variantResult = computed(() =>
    sortHeaderVariants({
      size: this.size(),
      active: this.isActive(),
      direction: this.effectiveDirection() ?? 'none',
      disabled: this.isDisabled(),
    }),
  );

  /** @internal */
  readonly hostClasses = computed(() => this.variantResult().host());

  /** @internal */
  readonly containerClasses = computed(() => this.variantResult().container());

  /** @internal */
  readonly labelClasses = computed(() => this.variantResult().label());

  /** @internal */
  readonly arrowClasses = computed(() => {
    const base = this.variantResult().arrow();
    if (!this.isActive()) return base;
    return `${base} ${ARROW_ACTIVE_COLOR[this.color()]}`;
  });

  /** @internal */
  readonly arrowIconClasses = computed(() => this.variantResult().arrowIcon());

  // ── Lifecycle ──

  ngOnInit(): void {
    this.parent?.register(this.id());
  }

  ngAfterViewInit(): void {
    const el = this.containerRef()?.nativeElement;
    if (el) {
      this.focusMonitor.monitor(el, true);
    }
  }

  ngOnDestroy(): void {
    const el = this.containerRef()?.nativeElement;
    if (el) {
      this.focusMonitor.stopMonitoring(el);
      if (this._describedBy && this.ariaDescriber) {
        this.ariaDescriber.removeDescription(el, this._describedBy);
      }
    }
    this.parent?.deregister(this.id());
  }

  // ── Event handlers ──

  /** @internal */
  handleClick(): void {
    if (this.isDisabled()) return;
    this.parent?.sort(snapshot(this));
  }

  /** @internal */
  handleKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.parent?.sort(snapshot(this));
    }
  }
}
