import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwSize } from 'ngx-tw/core';
import { TW_ICON_REGISTRAR } from './icon.providers';
import { IconRegistry } from './icon.registry';
import type { TwIconColor, TwIconData } from './icon.types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Converts a kebab-case icon name to PascalCase for registry lookup. */
function toPascalCase(str: string): string {
  return str.replace(/(^|[-_\s])([a-z0-9])/g, (_match, _sep, char: string) =>
    char.toUpperCase(),
  );
}

/** Pixel sizes for each TwSize value, used as SVG width/height attributes. */
const ICON_SIZE_PX: Record<TwSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const iconVariants = tv({
  base: 'inline-flex items-center justify-center shrink-0 align-middle',
  variants: {
    color: {
      current: '',
      primary: 'text-primary-500',
      secondary: 'text-secondary-500',
      accent: 'text-accent-500',
      neutral: 'text-fg-muted',
      info: 'text-info-500',
      success: 'text-success-500',
      warning: 'text-warning-500',
      error: 'text-error-500',
    },
    size: {
      xs: 'size-3',
      sm: 'size-4',
      md: 'size-5',
      lg: 'size-6',
      xl: 'size-8',
    },
  },
  defaultVariants: {
    color: 'current',
    size: 'md',
  },
}, {
  twMerge: true,
});

/**
 * Renders SVG icons from a registry or from direct icon data.
 *
 * Icons inherit `currentColor` by default. Use the `color` input for semantic
 * color variants that respond to theme changes.
 *
 * Register icons tree-shakably via `provideTwIcons()` (raw SVG data) or
 * `provideTwLucideIcons()` from `ngx-tw/icon/lucide` (Lucide adapter).
 *
 * @example
 * ```html
 * <tw-icon name="star" />
 * <tw-icon name="check" color="success" size="lg" />
 * <tw-icon name="alert-triangle" color="warning" ariaLabel="Warning" />
 * ```
 */
@Component({
  selector: 'tw-icon',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class IconComponent {
  private readonly doc = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly elRef = inject(ElementRef<HTMLElement>);
  private readonly registry = inject(IconRegistry);
  private readonly _registrar = inject(TW_ICON_REGISTRAR, { optional: true });

  /** Icon name in kebab-case (e.g. `'chevron-right'`). Resolved via the registry. */
  readonly name = input<string>();

  /** Direct icon data (SVG element tuples). Takes precedence over `name`. */
  readonly img = input<TwIconData>();

  /** Semantic color. `'current'` inherits from parent text color. Defaults to `'current'`. */
  readonly color = input<TwIconColor>('current');

  /** Icon size. Defaults to `'md'` (20px). */
  readonly size = input<TwSize>('md');

  /** SVG stroke width. Defaults to `2`. */
  readonly strokeWidth = input(2);

  /** When true, stroke width scales inversely with icon size to maintain consistent visual weight. Defaults to `false`. */
  readonly absoluteStrokeWidth = input(false);

  /** Accessible label. When set, removes `aria-hidden` and applies `aria-label` to the SVG. */
  readonly ariaLabel = input<string>();

  /** SVG viewBox attribute. Defaults to `'0 0 24 24'`. */
  readonly viewBox = input('0 0 24 24');

  /** Resolves icon data from `img` (priority) or `name` (registry lookup). */
  protected readonly resolvedIcon = computed<TwIconData | undefined>(() => {
    const imgData = this.img();
    if (imgData) return imgData;

    const iconName = this.name();
    if (iconName) return this.registry.get(toPascalCase(iconName)) ?? undefined;

    return undefined;
  });

  /** Pixel size for the current `size` input. */
  protected readonly sizeInPx = computed(() => ICON_SIZE_PX[this.size()]);

  /** Effective stroke width, accounting for `absoluteStrokeWidth`. */
  protected readonly effectiveStrokeWidth = computed(() => {
    const sw = this.strokeWidth();
    if (!this.absoluteStrokeWidth()) return sw;
    return (sw * 24) / this.sizeInPx();
  });

  /** Host class string from tv(). */
  readonly classes = computed(() =>
    iconVariants({ color: this.color(), size: this.size() }),
  );

  /** Tracks the previous render state to avoid unnecessary DOM rebuilds. */
  private prevIconData: TwIconData | undefined;
  private prevStrokeWidth: number | undefined;
  private prevViewBox: string | undefined;
  private prevAriaLabel: string | undefined;
  private currentSvg: SVGElement | null = null;

  constructor() {
    effect(() => {
      this.renderSvg();
    });
  }

  private renderSvg(): void {
    const el = this.elRef.nativeElement;
    const data = this.resolvedIcon();
    const sw = this.effectiveStrokeWidth();
    const vb = this.viewBox();
    const label = this.ariaLabel();
    const iconName = this.name();

    // Dev-mode warning when icon name is provided but not found
    if (isDevMode() && iconName && !data) {
      console.warn(
        `Icon "${iconName}" not found in registry. Did you forget to register it with provideTwIcons()?`,
      );
    }

    // No icon data — clear and return
    if (!data) {
      if (this.currentSvg) {
        this.renderer.removeChild(el, this.currentSvg);
        this.currentSvg = null;
        this.prevIconData = undefined;
      }
      return;
    }

    // SVG caching: skip DOM rebuild if only color/size changed (handled by host classes)
    if (
      this.currentSvg &&
      data === this.prevIconData &&
      sw === this.prevStrokeWidth &&
      vb === this.prevViewBox &&
      label === this.prevAriaLabel
    ) {
      return;
    }

    // Remove previous SVG
    if (this.currentSvg) {
      this.renderer.removeChild(el, this.currentSvg);
    }

    const size = this.sizeInPx();

    // Build SVG element
    const svg = this.doc.createElementNS(SVG_NS, 'svg');
    this.renderer.setAttribute(svg, 'xmlns', SVG_NS);
    this.renderer.setAttribute(svg, 'width', String(size));
    this.renderer.setAttribute(svg, 'height', String(size));
    this.renderer.setAttribute(svg, 'viewBox', vb);
    this.renderer.setAttribute(svg, 'fill', 'none');
    this.renderer.setAttribute(svg, 'stroke', 'currentColor');
    this.renderer.setAttribute(svg, 'stroke-width', String(sw));
    this.renderer.setAttribute(svg, 'stroke-linecap', 'round');
    this.renderer.setAttribute(svg, 'stroke-linejoin', 'round');

    if (label) {
      this.renderer.setAttribute(svg, 'role', 'img');
      this.renderer.setAttribute(svg, 'aria-label', label);
    } else {
      this.renderer.setAttribute(svg, 'aria-hidden', 'true');
    }

    // Render SVG children from icon data
    for (const [tag, attrs] of data) {
      const child = this.doc.createElementNS(SVG_NS, tag);
      for (const [key, value] of Object.entries(attrs)) {
        this.renderer.setAttribute(child, key, String(value));
      }
      this.renderer.appendChild(svg, child);
    }

    this.renderer.appendChild(el, svg);

    // Update cache
    this.currentSvg = svg;
    this.prevIconData = data;
    this.prevStrokeWidth = sw;
    this.prevViewBox = vb;
    this.prevAriaLabel = label;
  }
}
