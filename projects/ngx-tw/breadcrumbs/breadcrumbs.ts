import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import {
  MenuComponent,
  MenuItemDirective,
  MenuTriggerDirective,
} from '@cdevhub/ngx-tw/menu';

// ── Public types ──

/**
 * Describes a single hop in a breadcrumb trail. The last entry in `items` is
 * always treated as the current page (rendered with `aria-current="page"`,
 * never as an anchor).
 *
 * The generic `T` types the optional `data` payload — useful for forwarding
 * routerLink commands or any other consumer-defined metadata to the custom
 * item template without unsafe casts.
 */
export interface TwBreadcrumbsItem<T = unknown> {
  /** Visible label shown for this hop. */
  label: string;
  /**
   * Optional href used to render the default anchor. Omit on the current item
   * (the last entry). Ignored when a custom `*twBreadcrumbsItem` template is
   * projected — the consumer owns the anchor in that case.
   */
  href?: string;
  /**
   * Opaque payload forwarded to the consumer's `*twBreadcrumbsItem` template
   * via the template context. Use this to carry router commands or any other
   * data your template needs.
   */
  data?: T;
  /**
   * When true, the item renders as muted text without an anchor (even if
   * `href` is set). Receives `aria-disabled="true"`.
   */
  disabled?: boolean;
}

/**
 * Template context passed to `*twBreadcrumbsItem` for each rendered item.
 */
export interface TwBreadcrumbsItemContext<T = unknown> {
  /** The item record (also exposed via `let-item="$implicit"`). */
  $implicit: TwBreadcrumbsItem<T>;
  /** Same as `$implicit`. Available via `let-item="item"` for readability. */
  item: TwBreadcrumbsItem<T>;
  /** Zero-based index of this item in the original `items` input. */
  index: number;
  /** `true` only for the last entry — the current page. */
  isCurrent: boolean;
}

// ── tv() config ──

const breadcrumbs = tv(
  {
    slots: {
      // The host outer element (<tw-breadcrumbs>) is a custom element; we wrap
      // the actual landmark <nav> inside the template. The list is a real <ol>
      // so the trail keeps its semantic ordering for assistive tech.
      list: 'flex flex-wrap items-center m-0 p-0 list-none min-w-0',
      item: 'inline-flex items-center min-w-0',
      link:
        'inline-flex items-center text-fg-muted hover:text-fg transition-colors duration-200 motion-reduce:transition-none ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded-md no-underline truncate',
      current: 'inline-flex items-center text-fg font-medium truncate',
      disabled:
        'inline-flex items-center text-fg-subtle opacity-50 cursor-not-allowed truncate',
      // Separator carries rtl:rotate-180 so the chevron flips for RTL layouts;
      // requires a `dir="rtl"` ancestor for Tailwind's rtl: variant to match.
      separator:
        'inline-flex items-center text-fg-subtle shrink-0 select-none rtl:rotate-180',
      overflowTrigger:
        'inline-flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-surface-muted ' +
        'transition-colors duration-200 motion-reduce:transition-none ' +
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 cursor-pointer',
    },
    variants: {
      // A breadcrumb row is inline text navigation, so its box is a `min-h-*`
      // floor rather than a pinned height (docs/vertical-rhythm.md §2) — the
      // trail must stay free to wrap onto a second line in a narrow container.
      // The floor lands on the control scale (24 / 32 / 36 / 44 / 48) for two
      // reasons:
      //   1. The font ramp cannot separate all five steps on its own —
      //      `text-lg` is forbidden by CLAUDE.md, so `sm`/`md` both resolve to
      //      `text-sm` and `lg`/`xl` both to `text-base`. Without the floor,
      //      two of the five size steps are visually dead.
      //   2. `overflowTrigger` is a square button (24 / 28 / 32 / 36 / 36) that
      //      is taller than the bare text line box at every size, so a trail
      //      that collapses would jump in height the moment the ellipsis
      //      appears. With the floor at or above the trigger square at every
      //      size, the row height no longer depends on whether it renders.
      // The `lg`/`xl` trigger saturation at `size-9` is the codified CLAUDE.md
      // note — deliberately left alone.
      size: {
        xs: {
          list: 'gap-1',
          item: 'min-h-6',
          link: 'text-xs',
          current: 'text-xs',
          disabled: 'text-xs',
          separator: 'min-h-6 text-xs',
          overflowTrigger: 'size-6 text-xs',
        },
        sm: {
          list: 'gap-1',
          item: 'min-h-8',
          link: 'text-sm',
          current: 'text-sm',
          disabled: 'text-sm',
          separator: 'min-h-8 text-sm',
          overflowTrigger: 'size-7 text-sm',
        },
        md: {
          list: 'gap-1.5',
          item: 'min-h-9',
          link: 'text-sm',
          current: 'text-sm',
          disabled: 'text-sm',
          separator: 'min-h-9 text-sm',
          overflowTrigger: 'size-8 text-sm',
        },
        lg: {
          list: 'gap-2',
          item: 'min-h-11',
          link: 'text-base',
          current: 'text-base',
          disabled: 'text-base',
          separator: 'min-h-11 text-base',
          overflowTrigger: 'size-9 text-base',
        },
        xl: {
          list: 'gap-2',
          item: 'min-h-12',
          link: 'text-base',
          current: 'text-base',
          disabled: 'text-base',
          separator: 'min-h-12 text-base',
          overflowTrigger: 'size-9 text-base',
        },
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

// Separator glyph size mirrors the menu-item icon scale: keep the chevron one
// step below the text-size step so it reads as a quiet hint, not a glyph.
const ICON_SIZE_FOR_BREADCRUMB: Record<TwSize, TwSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'md',
};

// ── Template slot directives ──

/**
 * Structural directive applied to an `<ng-template>` projected into
 * `tw-breadcrumbs`. Replaces the default per-item rendering so consumers can
 * wire their own anchors (typically `routerLink`-bound). The template receives
 * `$implicit` (the item), `item`, `index`, and `isCurrent` in its context.
 */
@Directive({
  selector: '[twBreadcrumbsItem]',
})
export class BreadcrumbsItemTemplateDirective<T = unknown> {
  /** @internal */
  readonly templateRef = inject<TemplateRef<TwBreadcrumbsItemContext<T>>>(TemplateRef);

  /** Type-narrows the template context for `let-` destructuring in templates. */
  static ngTemplateContextGuard<T>(
    _dir: BreadcrumbsItemTemplateDirective<T>,
    _ctx: unknown,
  ): _ctx is TwBreadcrumbsItemContext<T> {
    return true;
  }
}

/**
 * Structural directive applied to an `<ng-template>` projected into
 * `tw-breadcrumbs`. Replaces the default chevron separator with custom
 * content (any element — icon, text, dot, etc.).
 */
@Directive({
  selector: '[twBreadcrumbsSeparator]',
})
export class BreadcrumbsSeparatorTemplateDirective {
  /** @internal */
  readonly templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}

// ── Link styling directive ──

/**
 * Applies the parent `tw-breadcrumbs` link / current / disabled styling to a
 * consumer-projected anchor (or span) inside `*twBreadcrumbsItem`. Without
 * this directive, projected content renders unstyled — only the layout `<li>`
 * is provided by the component.
 *
 * The directive sets `aria-current="page"` when `current` is true. It does
 * NOT itself swap the element tag; the consumer should still pick `<a>` for
 * link items and `<span>` for the current item.
 */
@Directive({
  selector: '[twBreadcrumbsLink]',
  host: {
    '[class]': 'classes()',
    '[attr.aria-current]': 'current() ? "page" : null',
  },
})
export class BreadcrumbsLinkDirective {
  /** When true, this element is the current page: styled bold and gets `aria-current="page"`. Defaults to `false`. */
  readonly current = input(false);

  /** When true, applies disabled styling (muted, not-allowed cursor). Defaults to `false`. */
  readonly disabled = input(false);

  private readonly parent = inject<BreadcrumbsComponent<unknown>>(
    forwardRef(() => BreadcrumbsComponent),
  );

  /** @internal Combined classes pulled from the parent component's slot tokens. */
  readonly classes = computed(() => {
    const slots = this.parent.slotResult();
    if (this.disabled()) return slots.disabled();
    if (this.current()) return slots.current();
    return slots.link();
  });
}

// ── Rendered entry types (internal) ──

interface RenderedItem<T> {
  readonly kind: 'item';
  readonly item: TwBreadcrumbsItem<T>;
  readonly index: number;
  readonly isCurrent: boolean;
  readonly key: string;
}

interface RenderedSeparator {
  readonly kind: 'separator';
  readonly key: string;
}

interface RenderedOverflow {
  readonly kind: 'overflow';
  readonly key: string;
}

type RenderedEntry<T> = RenderedItem<T> | RenderedSeparator | RenderedOverflow;

// ── BreadcrumbsComponent ──

/**
 * Breadcrumb trail rendered as a `<nav>` landmark with an ordered list of
 * navigation hops. The last entry in `items` is the current page (gets
 * `aria-current="page"`, never an anchor). Items beyond `maxItems` are
 * collapsed behind an ellipsis trigger that opens an overflow menu.
 *
 * Customize per-item rendering with `*twBreadcrumbsItem` (consumer projects
 * router-aware anchors), and the separator with `*twBreadcrumbsSeparator` or
 * the `separator` input (Lucide icon name).
 *
 * @example
 * ```html
 * <tw-breadcrumbs [items]="trail" />
 *
 * <tw-breadcrumbs [items]="trail" [maxItems]="3" separator="slash">
 *   <ng-template twBreadcrumbsItem let-item let-isCurrent="isCurrent">
 *     @if (isCurrent) {
 *       <span twBreadcrumbsLink [current]="true">{{ item.label }}</span>
 *     } @else {
 *       <a twBreadcrumbsLink [routerLink]="item.data?.routerLink">{{ item.label }}</a>
 *     }
 *   </ng-template>
 * </tw-breadcrumbs>
 * ```
 */
@Component({
  selector: 'tw-breadcrumbs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    IconComponent,
    MenuComponent,
    MenuItemDirective,
    MenuTriggerDirective,
  ],
  host: {
    // Custom elements default to inline; force a block layout so the trail
    // behaves predictably inside flex / grid containers.
    class: 'block min-w-0',
  },
  template: `
    <nav [attr.aria-label]="ariaLabel()">
      <ol [class]="listClasses()">
        @for (entry of renderedEntries(); track entry.key) {
          @if (entry.kind === 'item') {
            <li [class]="itemClasses()">
              @if (itemTemplate(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tpl.templateRef;
                    context: {
                      $implicit: entry.item,
                      item: entry.item,
                      index: entry.index,
                      isCurrent: entry.isCurrent
                    }
                  "
                />
              } @else {
                @if (entry.isCurrent) {
                  <span [class]="currentClasses()" aria-current="page">{{ entry.item.label }}</span>
                } @else if (entry.item.disabled) {
                  <span [class]="disabledClasses()" aria-disabled="true">{{ entry.item.label }}</span>
                } @else if (entry.item.href) {
                  <a [class]="linkClasses()" [attr.href]="entry.item.href">{{ entry.item.label }}</a>
                } @else {
                  <span [class]="linkClasses()">{{ entry.item.label }}</span>
                }
              }
            </li>
          } @else if (entry.kind === 'separator') {
            <li [class]="separatorClasses()" aria-hidden="true">
              @if (separatorTemplate(); as sepTpl) {
                <ng-container *ngTemplateOutlet="sepTpl.templateRef" />
              } @else {
                <tw-icon [name]="separator()" [size]="iconSize()" />
              }
            </li>
          } @else {
            <li [class]="itemClasses()">
              <!--
                The overflow menu pulls in tw-menu + @angular/cdk/menu (overlay,
                focus-trap). @defer keeps that weight in a lazy chunk so a plain
                breadcrumb trail (the common case, maxItems=0) never bundles it;
                the chunk loads when the trigger scrolls into view and is
                prefetched on idle to keep the first click responsive. The
                @placeholder mirrors the trigger so layout and a11y are stable.
              -->
              @defer (on viewport; prefetch on idle) {
                <button
                  type="button"
                  [class]="overflowTriggerClasses()"
                  [twMenuTrigger]="overflowMenuTpl"
                  aria-label="Show more breadcrumbs"
                >
                  <span aria-hidden="true">&hellip;</span>
                </button>
                <ng-template #overflowMenuTpl>
                  <tw-menu aria-label="Hidden breadcrumb items">
                    @for (hidden of collapsedItems(); track hidden) {
                      @if (hidden.disabled || !hidden.href) {
                        <span twMenuItem [attr.aria-disabled]="hidden.disabled ? 'true' : null">
                          {{ hidden.label }}
                        </span>
                      } @else {
                        <a twMenuItem [attr.href]="hidden.href">{{ hidden.label }}</a>
                      }
                    }
                  </tw-menu>
                </ng-template>
              } @placeholder {
                <button
                  type="button"
                  [class]="overflowTriggerClasses()"
                  aria-label="Show more breadcrumbs"
                >
                  <span aria-hidden="true">&hellip;</span>
                </button>
              }
            </li>
          }
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbsComponent<T = unknown> {
  /** The full breadcrumb trail. The last entry is treated as the current page. Defaults to `[]`. */
  readonly items = input<readonly TwBreadcrumbsItem<T>[]>([]);

  /** Density of the trail — drives font size, gap, icon size, and the overflow-button square. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /**
   * When greater than `0`, the trail collapses any middle items past this
   * threshold behind an overflow menu. The first item and the current (last)
   * item are always visible. Values `< 2` are clamped to `2`. Defaults to `0`
   * (no collapsing).
   */
  readonly maxItems = input<number>(0);

  /**
   * Lucide icon name used for the default separator between items. Ignored
   * when a `*twBreadcrumbsSeparator` template is projected. Defaults to
   * `'chevron-right'`. Requires the consumer to register the icon via
   * `provideTwLucideIcons({ ChevronRight, ... })`.
   */
  readonly separator = input<string>('chevron-right');

  /** Accessible label applied to the `<nav>` landmark. Defaults to `'Breadcrumb'`. Aliased as `aria-label`. */
  readonly ariaLabel = input<string>('Breadcrumb', { alias: 'aria-label' });

  /** Custom per-item template projected via `*twBreadcrumbsItem`. */
  readonly itemTemplate = contentChild(BreadcrumbsItemTemplateDirective<T>);

  /** Custom separator template projected via `*twBreadcrumbsSeparator`. */
  readonly separatorTemplate = contentChild(BreadcrumbsSeparatorTemplateDirective);

  /** @internal Materialised tv() slot result; exposed so `BreadcrumbsLinkDirective` can pull link/current/disabled classes. */
  readonly slotResult = computed(() => breadcrumbs({ size: this.size() }));

  /** @internal Icon size for the default chevron separator. */
  readonly iconSize = computed(() => ICON_SIZE_FOR_BREADCRUMB[this.size()]);

  /** @internal Class strings per slot, memoised. */
  readonly listClasses = computed(() => this.slotResult().list());
  readonly itemClasses = computed(() => this.slotResult().item());
  readonly linkClasses = computed(() => this.slotResult().link());
  readonly currentClasses = computed(() => this.slotResult().current());
  readonly disabledClasses = computed(() => this.slotResult().disabled());
  readonly separatorClasses = computed(() => this.slotResult().separator());
  readonly overflowTriggerClasses = computed(() => this.slotResult().overflowTrigger());

  /** @internal Items hidden behind the overflow menu. Empty when no collapsing is active. */
  readonly collapsedItems = computed<readonly TwBreadcrumbsItem<T>[]>(() => {
    const all = this.items();
    const max = this.maxItems();
    if (max <= 0 || all.length <= 2 || all.length <= max) return [];
    const effectiveMax = Math.max(max, 2);
    if (all.length <= effectiveMax) return [];
    const tailCount = effectiveMax - 1;
    const hiddenEnd = all.length - tailCount;
    return all.slice(1, hiddenEnd);
  });

  /** @internal Flat sequence of items + separators + overflow used by the template's @for. */
  readonly renderedEntries = computed<RenderedEntry<T>[]>(() => {
    const all = this.items();
    const max = this.maxItems();
    if (all.length === 0) return [];

    const entries: RenderedEntry<T>[] = [];
    const lastIndex = all.length - 1;
    const pushSeparator = (key: string) =>
      entries.push({ kind: 'separator', key: `sep-${key}` });

    const collapsing = max > 0 && all.length > 2 && all.length > max;
    const effectiveMax = Math.max(max, 2);
    const shouldCollapse = collapsing && all.length > effectiveMax;

    if (!shouldCollapse) {
      for (let i = 0; i < all.length; i++) {
        if (i > 0) pushSeparator(`${i}`);
        entries.push({
          kind: 'item',
          item: all[i],
          index: i,
          isCurrent: i === lastIndex,
          key: `item-${i}`,
        });
      }
      return entries;
    }

    const tailCount = effectiveMax - 1;
    const tailStart = all.length - tailCount;

    // First item.
    entries.push({
      kind: 'item',
      item: all[0],
      index: 0,
      isCurrent: lastIndex === 0,
      key: 'item-0',
    });
    pushSeparator('after-first');

    // Overflow trigger.
    entries.push({ kind: 'overflow', key: 'overflow' });
    pushSeparator('after-overflow');

    // Tail items.
    for (let i = tailStart; i < all.length; i++) {
      if (i > tailStart) pushSeparator(`${i}`);
      entries.push({
        kind: 'item',
        item: all[i],
        index: i,
        isCurrent: i === lastIndex,
        key: `item-${i}`,
      });
    }

    return entries;
  });
}
