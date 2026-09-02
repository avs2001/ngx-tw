import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
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
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
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

/**
 * Whether the host element exposes a `columnheader` / `rowheader` role, which are the only two
 * roles `aria-sort` is valid on. A static `role` attribute wins over the tag name; a `[attr.role]`
 * *binding* is not visible yet at construction time and is deliberately not consulted.
 */
function isHeaderCell(el: HTMLElement): boolean {
  const role = el.getAttribute('role');
  if (role !== null) return role === 'columnheader' || role === 'rowheader';
  return el.tagName === 'TH';
}

/**
 * Whether the host element is already an interactive control. When it is, the inner container must
 * NOT also become one — two nested widgets is an axe `nested-interactive` failure and leaves
 * assistive tech with an ambiguous activation target.
 */
function isInteractiveHost(el: HTMLElement): boolean {
  const role = el.getAttribute('role');
  if (role === 'button' || role === 'link') return true;
  const tag = el.tagName;
  return tag === 'BUTTON' || (tag === 'A' && el.hasAttribute('href'));
}

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
      // `align-top` is load-bearing, not cosmetic. The container is an
      // inline-level box inside the host block, so without it the host's line
      // box is `strut ∪ baseline-aligned container` — at `xs` the strut's
      // descent hangs 2px below the 24px control, and the row measures 26px.
      // `vertical-align: top` flushes the box to the line-box top, making the
      // host exactly the pinned height at every size. Inert at sm–xl, where the
      // control already exceeds the strut.
      container:
        'inline-flex align-top items-center gap-1.5 cursor-pointer rounded-md font-medium text-fg transition-colors duration-normal motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      label: 'min-w-0',
      arrow:
        'inline-flex shrink-0 items-center justify-center transition-opacity duration-normal motion-reduce:transition-none',
      arrowIcon:
        'shrink-0 transition-transform duration-normal motion-reduce:transition-none',
    },
    variants: {
      size: {
        // Heights are pinned to the control scale (docs/vertical-rhythm.md):
        // 24 / 32 / 36 / 44 / 48. Vertical padding is deleted deliberately —
        // `items-center` on the container does the centring, and leaving `py-*`
        // alive would fight the pinned height under `box-sizing: border-box`.
        xs: {
          container: 'px-2 text-xs h-6',
          // `size-3.5` half-step: only icon size aligning with text-xs without
          // dominating it; codified per CLAUDE.md.
          arrowIcon: 'size-3.5',
        },
        sm: {
          container: 'px-2.5 text-sm h-8',
          arrowIcon: 'size-4',
        },
        md: {
          container: 'px-3 text-sm h-9',
          arrowIcon: 'size-4',
        },
        lg: {
          container: 'px-4 text-base h-11',
          arrowIcon: 'size-5',
        },
        xl: {
          container: 'px-5 text-base h-12',
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
      // True when the consumer mounted the header on an element that is
      // already a control (`<button>`, `<a href>`, `[role="button"]`). The
      // inner container then stays inert, so the canonical focus ring has to
      // move onto the host — it is the element that actually receives focus.
      hostControl: {
        true: {
          host: 'rounded-md cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
        },
        false: {},
      },
    },
    defaultVariants: {
      size: 'md',
      active: false,
      direction: 'none',
      disabled: false,
      hostControl: false,
    },
  },
  { twMerge: true },
);

/**
 * Turns any element (e.g., `<th>`, `<div>`, `<button>`) into a sortable header under a parent
 * `SortDirective`. Renders the projected label plus an arrow that reflects the current direction.
 * Triggers a sort cycle on click or Enter/Space.
 *
 * @remarks
 * **Where the control and `aria-sort` live depends on the host element.** Both are decided once,
 * at construction, from the host's tag name and its *static* `role` attribute:
 *
 * | Host | `aria-sort` | Interactive element |
 * |---|---|---|
 * | `<th>` / `[role="columnheader"\|"rowheader"]` | on the host | inner container (`role="button"`) |
 * | `<span>` / `<div>` (no role) | **not emitted** | inner container (`role="button"`) |
 * | `<button>` / `<a href>` / `[role="button"\|"link"]` | **not emitted** | the host itself |
 *
 * `aria-sort` is only valid on a `columnheader` / `rowheader`, so emitting it on a `<span>` or
 * `<button>` is an axe `aria-allowed-attr` failure and is silently ignored by assistive tech. When
 * the header is composed *inside* a header cell — `<th><span tw-sort-header>…</span></th>`, the
 * shape `tw-table` generates — the `<th>` owns `aria-sort` (see `tw-column`'s `sortState` input,
 * which auto-resolves against the same `[twSort]` directive). Outside a table there is no
 * `columnheader` to carry the state; the header remains a labelled button and the sort direction
 * is conveyed by the arrow plus the consumer's own live region.
 */
// Selector is deliberately kebab-case to read naturally as an HTML attribute on
// host elements (e.g. `<th tw-sort-header>`). Camelcasing it to `twSortHeader`
// would break the public API and ~20 demo usages.
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[tw-sort-header]',
  exportAs: 'twSortHeader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './sort-header.html',
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-sort]': 'hostAriaSort()',
    // Sort state as a data attribute, on EVERY host shape.
    //
    // `aria-sort` is only legal on a header cell, so on a span or button host
    // it is deliberately absent — which left the sort state with no stable,
    // valid hook at all on those hosts. The direction was readable only from
    // the arrow's rotation utility class, which is implementation detail no
    // test or consumer should depend on. A `data-*` attribute is valid on any
    // element and carries no ARIA semantics, so it states the same thing
    // without lying to assistive tech. Values mirror `aria-sort` exactly, so
    // a reader does not have to learn a second vocabulary.
    '[attr.data-sort-direction]': 'ariaSort()',
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

  private readonly hostEl: HTMLElement = inject(ElementRef).nativeElement;

  /**
   * Whether the host element can legally carry `aria-sort`. Resolved once, at construction — the
   * host's tag name and static attributes are already applied by then, and a later `[attr.role]`
   * binding would make this timing-dependent.
   */
  private readonly hostIsHeaderCell = isHeaderCell(this.hostEl);

  /** Whether the host is already a control, in which case the inner container must stay inert. */
  private readonly hostIsControl = isInteractiveHost(this.hostEl);

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
      const el = this.controlElement();
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

  /**
   * @internal Value actually written to the host's `aria-sort` attribute. `null` — i.e. no
   * attribute — unless the host is a `columnheader` / `rowheader`; see the class remarks.
   */
  readonly hostAriaSort = computed(() =>
    this.hostIsHeaderCell ? this.ariaSort() : null,
  );

  /** @internal `role` for the inner container: `'button'` unless the host is already the control. */
  readonly controlRole = computed(() =>
    this.hostIsControl || this.isDisabled() ? null : 'button',
  );

  /** @internal `tabindex` for the inner container. Mirrors `controlRole()`. */
  readonly controlTabIndex = computed(() =>
    this.hostIsControl || this.isDisabled() ? null : 0,
  );

  /** Whether the arrow element should render. Active headers always render; inactive render when not disabled so hover reveals the affordance. */
  readonly renderArrow = computed(() => this.isActive() || !this.isDisabled());

  /**
   * The element that carries focus and the accessible description — the host when the consumer
   * mounted the header on a control, the inner container otherwise.
   */
  private controlElement(): HTMLElement | undefined {
    return this.hostIsControl
      ? this.hostEl
      : this.containerRef()?.nativeElement;
  }

  // ── Variant class computation ──

  private readonly variantResult = computed(() =>
    sortHeaderVariants({
      size: this.size(),
      active: this.isActive(),
      direction: this.effectiveDirection() ?? 'none',
      disabled: this.isDisabled(),
      hostControl: this.hostIsControl,
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
    const el = this.controlElement();
    if (el) {
      this.focusMonitor.monitor(el, true);
    }
  }

  ngOnDestroy(): void {
    const el = this.controlElement();
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
