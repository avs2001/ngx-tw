import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { tv } from 'tailwind-variants';

/** Geometric shape of the skeleton placeholder. */
export type SkeletonShape = 'text' | 'rectangle' | 'circle';

/** Animation style applied to the skeleton. */
export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

const skeletonVariants = tv(
  {
    slots: {
      root: 'block bg-surface-muted overflow-hidden relative isolate',
      container: 'relative flex flex-col gap-2',
      row: 'block bg-surface-muted overflow-hidden relative isolate w-full',
      sr: 'sr-only',
    },
    variants: {
      shape: {
        text: { root: 'h-4 w-full rounded-md', row: 'h-4 rounded-md' },
        rectangle: { root: 'h-4 w-full rounded-md', row: 'h-4 rounded-md' },
        circle: { root: 'rounded-full aspect-square', row: 'rounded-full aspect-square' },
      },
      animation: {
        pulse: { root: 'skeleton-pulse', row: 'skeleton-pulse' },
        wave: { root: 'skeleton-wave', row: 'skeleton-wave' },
        none: { root: '', row: '' },
      },
    },
    defaultVariants: {
      shape: 'text',
      animation: 'pulse',
    },
  },
  { twMerge: true },
);

function dimensionToCss(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * Placeholder loading shape (the standard "shimmer" / "pulse") shown where real
 * content will appear. Use inside lists, cards, tables, and detail views to
 * communicate "this region is loading" without layout jump when content arrives.
 *
 * Three shapes (`text`, `rectangle`, `circle`), three animations (`pulse`,
 * `wave`, `none`), arbitrary `width` / `height`, and an optional multi-line
 * text mode. By default the skeleton is hidden from assistive technology
 * (parent owns the announcement); set `announce` to expose `role="status"`.
 *
 * @example
 * ```html
 * <tw-skeleton />
 * <tw-skeleton [lines]="3" />
 * <tw-skeleton shape="circle" [width]="40" [height]="40" />
 * <tw-skeleton shape="rectangle" animation="wave" height="12rem" />
 * ```
 */
@Component({
  selector: 'tw-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[style]': 'rootStyle()',
    '[attr.aria-hidden]': 'announce() ? null : "true"',
    '[attr.role]': 'announce() ? "status" : null',
    '[attr.aria-busy]': 'announce() ? "true" : null',
    '[attr.aria-live]': 'announce() ? "polite" : null',
  },
  template: `
    @if (mode() === 'multi') {
      @for (_ of rowsArray(); track $index) {
        <span [class]="rowClass($index)" [style]="rowStyle($index)"></span>
      }
    }
    @if (announce()) {
      <span [class]="srClasses()">Loading</span>
    }
  `,
})
export class SkeletonComponent {
  /** Geometric shape of the placeholder. `'text'` renders a short rectangle with text-line proportions; `'rectangle'` a free-form block sized by `width`/`height`; `'circle'` a perfect circle (avatar / icon placeholder). Defaults to `'text'`. */
  readonly shape = input<SkeletonShape>('text');

  /** Animation style. `'pulse'` fades opacity in and out; `'wave'` sweeps a shimmer across; `'none'` renders a static block. All animations are halted under `prefers-reduced-motion`. Defaults to `'pulse'`. */
  readonly animation = input<SkeletonAnimation>('pulse');

  /** Optional explicit width. Numbers are treated as pixels; strings pass through (e.g. `'50%'`, `'12rem'`, `'auto'`). When undefined, the skeleton fills its container's width (or its shape default for circle). */
  readonly width = input<string | number | undefined>(undefined);

  /** Optional explicit height. Numbers are treated as pixels; strings pass through. When undefined, the skeleton uses its shape default (text-line height for text, `1rem` for rectangle, equal-to-width for circle). */
  readonly height = input<string | number | undefined>(undefined);

  /** Number of stacked text rows to render. Only applies when `shape` is `'text'`. Values greater than 1 render N rows in a vertical stack with a `0.5rem` gap; the last row is rendered at 60% width to mimic a paragraph's final line. Ignored for `'rectangle'` and `'circle'`. Defaults to `1`. */
  readonly lines = input<number>(1);

  /** When true, the skeleton announces itself as a busy live region via `role="status"`, `aria-busy="true"`, `aria-live="polite"`, and a visually-hidden label. When false, the skeleton is fully hidden from assistive technology with `aria-hidden="true"` — appropriate when a parent already owns the loading announcement. Defaults to `false`. */
  readonly announce = input(false, { transform: booleanAttribute });

  protected readonly mode = computed<'single' | 'multi'>(() =>
    this.shape() === 'text' && this.lines() > 1 ? 'multi' : 'single',
  );

  private readonly variantResult = computed(() =>
    skeletonVariants({ shape: this.shape(), animation: this.animation() }),
  );

  protected readonly rootClasses = computed(() => {
    if (this.mode() === 'multi') {
      return skeletonVariants({ shape: this.shape(), animation: 'none' }).container();
    }
    return this.variantResult().root();
  });

  protected readonly srClasses = computed(() => this.variantResult().sr());

  protected readonly rowsArray = computed(() => new Array(Math.max(1, this.lines())).fill(0));

  protected readonly rootStyle = computed(() => {
    if (this.mode() === 'multi') {
      return '';
    }
    return this.styleString(this.width(), this.height());
  });

  protected rowClass(index: number): string {
    const base = this.variantResult().row();
    const isLast = index === this.lines() - 1;
    return isLast ? `${base} w-3/5` : base;
  }

  protected rowStyle(index: number): string {
    const isLast = index === this.lines() - 1;
    if (isLast) {
      return this.styleString(undefined, this.height());
    }
    return this.styleString(this.width(), this.height());
  }

  private styleString(width: string | number | undefined, height: string | number | undefined): string {
    const parts: string[] = [];
    const w = dimensionToCss(width);
    const h = dimensionToCss(height);
    if (w) {
      parts.push(`width: ${w}`);
    }
    if (h) {
      parts.push(`height: ${h}`);
    }
    return parts.length ? `${parts.join('; ')};` : '';
  }
}
