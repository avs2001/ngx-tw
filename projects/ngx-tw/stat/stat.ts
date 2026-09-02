import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  type ElementRef,
  inject,
  input,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import { SkeletonComponent } from '@cdevhub/ngx-tw/skeleton';

/** Surface treatment for the stat tile. */
export type StatVariant = 'plain' | 'outlined' | 'elevated' | 'filled';

/** Direction of trend conveyed by the delta indicator. */
export type StatDeltaDirection = 'up' | 'down' | 'neutral';

/** Display style of the trend delta. */
export type StatDeltaVariant = 'badge' | 'inline' | 'icon-only';

// ── Slot marker directives (DOM projection) ───────────────────────────

/** Label slot — short caption ("Revenue", "Active users"). Projected into `<dt>`. */
@Directive({ selector: '[twStatLabel]' })
export class StatLabelDirective {}

/** Value slot — the dominant numeric/text element. Projected into `<dd>`. */
@Directive({ selector: '[twStatValue]' })
export class StatValueDirective {}

/** Description slot — optional secondary text under the value. Projected into a second `<dd>`. */
@Directive({ selector: '[twStatDescription]' })
export class StatDescriptionDirective {}

/** Icon slot — optional leading icon. Triggers the icon-leading layout. */
@Directive({ selector: '[twStatIcon]' })
export class StatIconDirective {}

/** Footer slot — optional auxiliary region (sparklines, tags, metadata). Always renders, even during loading. */
@Directive({ selector: '[twStatFooter]' })
export class StatFooterDirective {}

// ── Stat tile tv() config ─────────────────────────────────────────────

const statTile = tv(
  {
    slots: {
      root: 'block text-fg',
      iconFlex: 'flex items-start gap-3',
      iconWrapper: 'shrink-0 text-fg-muted',
      contentStack: 'min-w-0 flex-1',
      dl: 'flex flex-col',
      label: 'text-fg-muted font-medium',
      valueRow: 'flex items-baseline gap-2 flex-wrap',
      value: 'text-fg block tabular-nums font-semibold',
      description: 'text-fg-muted',
      delta: 'inline-flex items-center',
      footer: 'mt-3 pt-3 border-t border-border',
    },
    variants: {
      variant: {
        plain: { root: 'bg-transparent' },
        outlined: { root: 'bg-surface border border-border rounded-lg' },
        elevated: {
          root: 'bg-surface-raised border border-border rounded-lg shadow hover:shadow-md transition-shadow duration-200 motion-reduce:transition-none',
        },
        filled: { root: 'bg-surface-muted rounded-lg' },
      },
      size: {
        xs: {
          root: 'p-2',
          dl: 'gap-1',
          label: 'text-2xs',
          value: 'text-xs',
          description: 'text-2xs',
          delta: 'mt-1',
        },
        sm: {
          root: 'p-3',
          dl: 'gap-1',
          label: 'text-xs',
          value: 'text-sm',
          description: 'text-xs',
          delta: 'mt-1',
        },
        md: {
          root: 'p-4',
          dl: 'gap-1.5',
          label: 'text-xs',
          value: 'text-base',
          description: 'text-xs',
          delta: 'mt-1',
        },
        // lg/xl `value` uses `text-base` per the KPI-value carve-out
        // (CLAUDE.md typography). The dominant numeric needs to outrank the
        // `text-sm` label/description in visual hierarchy.
        lg: {
          root: 'p-6',
          dl: 'gap-2',
          label: 'text-sm',
          value: 'text-base font-bold',
          description: 'text-sm',
          delta: 'mt-2',
        },
        xl: {
          root: 'p-8',
          dl: 'gap-2',
          label: 'text-sm',
          value: 'text-base font-extrabold',
          description: 'text-sm',
          delta: 'mt-2',
        },
      },
    },
    defaultVariants: {
      variant: 'outlined',
      size: 'md',
    },
  },
  { twMerge: true },
);

// ── Delta tv() config ─────────────────────────────────────────────────

const statDelta = tv(
  {
    slots: {
      root: 'relative inline-flex items-center gap-1 font-medium tabular-nums',
      icon: 'shrink-0',
      text: 'inline-flex items-center',
      comparison: 'text-fg-muted',
    },
    variants: {
      variant: {
        badge: {
          root: 'px-2 py-0.5 rounded-md text-xs',
        },
        inline: {
          root: 'text-xs',
        },
        'icon-only': {
          // size-6 (24px) — square interactive-target scale at xs density per
          // CLAUDE.md icon sub-scale; here it just centres the chevron.
          root: 'justify-center size-6 rounded-md',
          // Text and comparison stay in the DOM so the composed aria-label
          // still picks them up; `sr-only` removes them visually.
          text: 'sr-only',
          comparison: 'sr-only',
        },
      },
      effectiveColor: {
        success: {},
        error: {},
        neutral: {},
      },
    },
    compoundVariants: [
      // ===== badge (soft chip) =====
      {
        variant: 'badge',
        effectiveColor: 'success',
        class: { root: 'bg-success-soft text-success-soft-fg' },
      },
      {
        variant: 'badge',
        effectiveColor: 'error',
        class: { root: 'bg-error-soft text-error-soft-fg' },
      },
      // Neutral pinned explicitly to surface/fg tokens (advisor: never use
      // `text-neutral-700` or template through neutral via -soft-fg chain).
      {
        variant: 'badge',
        effectiveColor: 'neutral',
        class: { root: 'bg-surface-muted text-fg-muted' },
      },

      // ===== inline (no chip) =====
      {
        variant: 'inline',
        effectiveColor: 'success',
        class: { root: 'text-success-700' },
      },
      {
        variant: 'inline',
        effectiveColor: 'error',
        class: { root: 'text-error-700' },
      },
      {
        variant: 'inline',
        effectiveColor: 'neutral',
        class: { root: 'text-fg-muted' },
      },

      // ===== icon-only =====
      {
        variant: 'icon-only',
        effectiveColor: 'success',
        class: { root: 'bg-success-soft text-success-soft-fg' },
      },
      {
        variant: 'icon-only',
        effectiveColor: 'error',
        class: { root: 'bg-error-soft text-error-soft-fg' },
      },
      {
        variant: 'icon-only',
        effectiveColor: 'neutral',
        class: { root: 'bg-surface-muted text-fg-muted' },
      },
    ],
    defaultVariants: {
      variant: 'badge',
      effectiveColor: 'neutral',
    },
  },
  { twMerge: true },
);

// ── Stat delta component ──────────────────────────────────────────────

/**
 * Compact trend indicator — direction + projected delta text + optional
 * comparison label. Usable standalone or projected into a `<tw-stat>` tile.
 *
 * Sentiment is conveyed by both icon direction and color; consumers running
 * "lower is better" metrics (bounce rate, latency, churn) set `inverted` to
 * swap the success/error color mapping without changing the literal direction
 * or the announced verb.
 */
@Component({
  selector: 'tw-stat-delta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[class]': 'rootClasses()',
    '[attr.aria-label]': 'composedAriaLabel()',
  },
  template: `
    <svg
      [class]="iconClasses() + ' ' + iconSizeClass()"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (direction()) {
        @case ('up') { <path d="M4 10l4-4 4 4" /> }
        @case ('down') { <path d="M4 6l4 4 4-4" /> }
        @default { <path d="M3 8h10" /> }
      }
    </svg>
    <span #textEl [class]="textClasses()"><ng-content /></span>
    @if (comparisonLabel(); as comp) {
      <span [class]="comparisonClasses()">{{ comp }}</span>
    }
  `,
})
export class StatDeltaComponent {
  /** Direction of change. `'up'` renders an up-chevron and (by default) the `success` color; `'down'` renders a down-chevron and the `error` color; `'neutral'` renders a horizontal-line glyph and the neutral color. Defaults to `'neutral'`. */
  readonly direction = input<StatDeltaDirection>('neutral');

  /** When true, swaps success/error semantics so `down` reads as success and `up` reads as error — use for metrics where lower is better (bounce rate, error rate, latency, churn). `neutral` direction is unaffected. Defaults to `false`. */
  readonly inverted = input(false, { transform: booleanAttribute });

  /** Display style. `'badge'` (default) wraps the delta in a pill chip; `'inline'` is icon + text only with no chip; `'icon-only'` shows just the chevron for ultra-dense layouts. */
  readonly variant = input<StatDeltaVariant>('badge');

  /** Optional comparison label rendered next to the delta value (e.g. `"vs last week"`, `"since launch"`). Defaults to `undefined`. */
  readonly comparisonLabel = input<string>();

  /** Explicit accessible label, mirrored to `aria-label`. When omitted, the component composes one from `direction` + projected text + `comparisonLabel`. Override when projected content is purely symbolic or already localized. Defaults to `undefined`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** @internal */
  protected readonly textEl = viewChild<ElementRef<HTMLElement>>('textEl');

  /** @internal */
  protected readonly projectedText = signal('');

  constructor() {
    const injector = inject(Injector);
    // Read the projected text via the wrapper span's textContent. textContent
    // is recursive across projected children, so this resolves the consumer's
    // string even when wrapped in arbitrary markup. afterRenderEffect runs
    // after each render so projection changes are captured.
    afterRenderEffect(
      () => {
        const el = this.textEl()?.nativeElement;
        if (!el) {
          this.projectedText.set('');
          return;
        }
        const text = (el.textContent ?? '').trim();
        this.projectedText.set(text);
      },
      { injector },
    );
  }

  /** @internal */
  protected readonly effectiveColor = computed<'success' | 'error' | 'neutral'>(() => {
    const dir = this.direction();
    if (dir === 'neutral') return 'neutral';
    const inv = this.inverted();
    if (dir === 'up') return inv ? 'error' : 'success';
    return inv ? 'success' : 'error';
  });

  /** @internal */
  protected readonly iconSizeClass = computed(() => {
    // Glyph sub-scale: size-3 (12px) at the badge/inline xs/sm density,
    // size-4 (16px) at md+. The delta lives inside text-xs, so size-3 holds.
    // Larger contexts (md / lg / xl on the parent tile) get size-4.
    return this.variant() === 'icon-only' ? 'size-4' : 'size-3';
  });

  /** @internal */
  protected readonly composedAriaLabel = computed(() => {
    const explicit = this.ariaLabel();
    if (explicit) return explicit;
    const dir = this.direction();
    const verb = dir === 'up' ? 'increased' : dir === 'down' ? 'decreased' : 'unchanged';
    const text = this.projectedText();
    const comp = this.comparisonLabel();
    const parts: string[] = [];
    if (text) {
      parts.push(`${verb} by ${text}`);
    } else {
      parts.push(verb);
    }
    if (comp) parts.push(comp);
    return parts.join(' ');
  });

  private readonly variantResult = computed(() =>
    statDelta({ variant: this.variant(), effectiveColor: this.effectiveColor() }),
  );

  protected readonly rootClasses = computed(() => this.variantResult().root());
  protected readonly iconClasses = computed(() => this.variantResult().icon());
  protected readonly textClasses = computed(() => this.variantResult().text());
  protected readonly comparisonClasses = computed(() => this.variantResult().comparison());
}

// ── Stat tile component ───────────────────────────────────────────────

/**
 * KPI tile — a compact display tile surfacing a single key performance
 * indicator with an optional trend delta. Composes a `<dl>` / `<dt>` / `<dd>`
 * definition list internally so the label-to-value pairing is announced
 * naturally by assistive technology.
 *
 * Slots:
 * - `[twStatLabel]` — caption (rendered as `<dt>`).
 * - `[twStatValue]` — dominant value (rendered as `<dd>`).
 * - `[twStatDescription]` — optional secondary text (second `<dd>`).
 * - `[twStatIcon]` — optional leading icon (switches to icon-leading layout).
 * - `[twStatFooter]` — optional auxiliary region (sparklines, tags).
 * - `<tw-stat-delta>` — projected trend indicator alongside the value.
 *
 * Loading state replaces label/value/delta with `<tw-skeleton>` placeholders
 * sized to match the density. Footer always renders during loading so
 * consumers can compose their own skeleton charts.
 */
@Component({
  selector: 'tw-stat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent, NgTemplateOutlet],
  host: {
    '[class]': 'rootClasses()',
    // Permanent live region — `aria-busy` toggle alone signals state change
    // so assistive tech announces the resolved content on loading→loaded
    // without the live region being torn down mid-transition.
    'aria-live': 'polite',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  template: `
    @if (iconLeading()) {
      <div [class]="iconFlexClasses()">
        <div [class]="iconWrapperClasses()">
          <ng-content select="[twStatIcon]" />
        </div>
        <div [class]="contentStackClasses()">
          <ng-container [ngTemplateOutlet]="dlBlock" />
        </div>
      </div>
    } @else {
      <ng-container [ngTemplateOutlet]="dlBlock" />
    }

    @if (hasFooter()) {
      <div [class]="footerClasses()">
        <ng-content select="[twStatFooter]" />
      </div>
    }

    <ng-template #dlBlock>
      <dl [class]="dlClasses()">
        @if (loading()) {
          <dt [class]="labelClasses()">
            <tw-skeleton width="40%" height="0.75rem" />
          </dt>
        } @else if (hasLabel()) {
          <dt [class]="labelClasses()">
            <ng-content select="[twStatLabel]" />
          </dt>
        }

        <dd [class]="valueRowClasses()">
          @if (loading()) {
            <tw-skeleton [width]="loadingValueWidth()" [height]="loadingValueHeight()" />
          } @else if (hasValue()) {
            <span [class]="valueClasses()">
              <ng-content select="[twStatValue]" />
            </span>
          }

          @if (loading()) {
            <span [class]="deltaClasses()">
              <tw-skeleton width="3rem" height="1.25rem" />
            </span>
          } @else if (hasDelta()) {
            <span [class]="deltaClasses()">
              <ng-content select="tw-stat-delta" />
            </span>
          }
        </dd>

        @if (!loading() && hasDescription()) {
          <dd [class]="descriptionClasses()">
            <ng-content select="[twStatDescription]" />
          </dd>
        }
      </dl>
    </ng-template>
  `,
})
export class StatComponent {
  /** Surface treatment. `'plain'` removes border and background; `'outlined'` (default) adds a border on the surface token; `'elevated'` adds shadow and uses the raised surface; `'filled'` uses the muted surface with no border. */
  readonly variant = input<StatVariant>('outlined');

  /** Density scale — drives padding, internal gaps, value/label typography, and the skeleton placeholder dimensions. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, replaces label, value, and delta regions with `<tw-skeleton>` placeholders and toggles `aria-busy="true"` on the host. Projected footer content still renders. Defaults to `false`. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** @internal */
  protected readonly labelSlot = contentChild(StatLabelDirective);
  /** @internal */
  protected readonly valueSlot = contentChild(StatValueDirective);
  /** @internal */
  protected readonly descriptionSlot = contentChild(StatDescriptionDirective);
  /** @internal */
  protected readonly iconSlot = contentChild(StatIconDirective);
  /** @internal */
  protected readonly footerSlot = contentChild(StatFooterDirective);
  /** @internal */
  protected readonly deltaSlot = contentChild(StatDeltaComponent);

  protected readonly hasLabel = computed(() => !!this.labelSlot());
  protected readonly hasValue = computed(() => !!this.valueSlot());
  protected readonly hasDescription = computed(() => !!this.descriptionSlot());
  protected readonly hasIcon = computed(() => !!this.iconSlot());
  protected readonly hasFooter = computed(() => !!this.footerSlot());
  protected readonly hasDelta = computed(() => !!this.deltaSlot());

  protected readonly iconLeading = computed(() => this.hasIcon());

  /** Skeleton width during loading state — scales with the size axis. */
  protected readonly loadingValueWidth = computed(() => {
    switch (this.size()) {
      case 'xs': return '4rem';
      case 'sm': return '5rem';
      case 'md': return '6rem';
      case 'lg': return '8rem';
      case 'xl': return '10rem';
    }
  });

  /** Skeleton height during loading state — matches the value font size. */
  protected readonly loadingValueHeight = computed(() => {
    switch (this.size()) {
      case 'xs': return '0.75rem';
      case 'sm': return '0.875rem';
      case 'md': return '1rem';
      case 'lg': return '1rem';
      case 'xl': return '1rem';
    }
  });

  private readonly variantResult = computed(() =>
    statTile({ variant: this.variant(), size: this.size() }),
  );

  protected readonly rootClasses = computed(() => this.variantResult().root());
  protected readonly iconFlexClasses = computed(() => this.variantResult().iconFlex());
  protected readonly iconWrapperClasses = computed(() => this.variantResult().iconWrapper());
  protected readonly contentStackClasses = computed(() => this.variantResult().contentStack());
  protected readonly dlClasses = computed(() => this.variantResult().dl());
  protected readonly labelClasses = computed(() => this.variantResult().label());
  protected readonly valueRowClasses = computed(() => this.variantResult().valueRow());
  protected readonly valueClasses = computed(() => this.variantResult().value());
  protected readonly descriptionClasses = computed(() => this.variantResult().description());
  protected readonly deltaClasses = computed(() => this.variantResult().delta());
  protected readonly footerClasses = computed(() => this.variantResult().footer());
}
