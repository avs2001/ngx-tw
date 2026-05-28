import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';
import { AvatarComponent } from 'ngx-tw/avatar';
import { IconComponent } from 'ngx-tw/icon';

/** Visual style of the badge. */
export type BadgeVariant = 'solid' | 'outline' | 'soft';

const badgeVariants = tv({
  slots: {
    root: 'inline-flex items-center font-medium w-fit',
    content: 'inline-flex items-center',
    dismiss:
      'inline-flex items-center justify-center rounded-md cursor-pointer hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    dismissIcon: 'shrink-0',
    leadingAvatar: 'inline-flex shrink-0 rounded-full overflow-hidden [&>tw-avatar]:size-full',
    leadingIcon: 'inline-flex shrink-0 [&>tw-icon]:size-full',
  },
  variants: {
    variant: {
      solid: { root: '' },
      outline: { root: 'border' },
      soft: { root: '' },
    },
    color: {
      primary: {},
      secondary: {},
      accent: {},
      neutral: {},
      info: {},
      success: {},
      warning: {},
      error: {},
    },
    size: {
      xs: {
        root: 'px-1.5 py-0.5 text-xs gap-1',
        // size-6 (24px) meets WCAG 2.5.8 target-size; negative margins keep
        // the visible badge box centred without inflating its layout height.
        dismiss: 'size-6 -my-1 -mr-1',
        dismissIcon: 'size-3',
        leadingAvatar: 'size-4',
        leadingIcon: 'size-3',
      },
      sm: {
        root: 'px-2 py-0.5 text-xs gap-1',
        dismiss: 'size-6 -my-1 -mr-1',
        dismissIcon: 'size-3',
        leadingAvatar: 'size-4',
        leadingIcon: 'size-3',
      },
      md: {
        root: 'px-2 py-1 text-xs gap-1.5',
        // size-7 (28px) keeps the dismiss target comfortable at md density;
        // negative margins absorb the overflow so the badge height is unchanged.
        dismiss: 'size-7 -my-1.5 -mr-1.5',
        // size-3.5 (14px) half-step: sits between the size-3 used at xs/sm and
        // the size-4 used at lg/xl, balancing the X glyph against text-xs at
        // md density without dominating the dismiss button.
        dismissIcon: 'size-3.5',
        leadingAvatar: 'size-5',
        // size-3.5 (14px) half-step: the md badge sits between xs/sm (size-3
        // leading icon, text-xs) and lg/xl (size-4, text-sm); 14px is the
        // visual mid-point that lines up with text-xs at this density.
        leadingIcon: 'size-3.5',
      },
      lg: {
        root: 'px-3 py-1.5 text-sm gap-1.5',
        dismiss: 'size-8 -my-1.5 -mr-1.5',
        dismissIcon: 'size-4',
        leadingAvatar: 'size-5',
        leadingIcon: 'size-4',
      },
      xl: {
        root: 'px-3 py-1.5 text-sm gap-1.5',
        dismiss: 'size-8 -my-1.5 -mr-1.5',
        dismissIcon: 'size-4',
        leadingAvatar: 'size-6',
        leadingIcon: 'size-4',
      },
    },
    pill: {
      true: { root: 'rounded-full' },
      false: { root: 'rounded-md' },
    },
    hasAvatar: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    // ===== Primary =====
    { variant: 'solid', color: 'primary', class: { root: 'bg-primary-600 text-on-primary' } },
    { variant: 'outline', color: 'primary', class: { root: 'border-primary-300 text-primary-700' } },
    { variant: 'soft', color: 'primary', class: { root: 'bg-primary-50 text-primary-800' } },

    // ===== Secondary =====
    { variant: 'solid', color: 'secondary', class: { root: 'bg-secondary-600 text-on-secondary' } },
    { variant: 'outline', color: 'secondary', class: { root: 'border-secondary-300 text-secondary-700' } },
    { variant: 'soft', color: 'secondary', class: { root: 'bg-secondary-50 text-secondary-800' } },

    // ===== Accent =====
    { variant: 'solid', color: 'accent', class: { root: 'bg-accent-600 text-on-accent' } },
    { variant: 'outline', color: 'accent', class: { root: 'border-accent-300 text-accent-700' } },
    { variant: 'soft', color: 'accent', class: { root: 'bg-accent-50 text-accent-800' } },

    // ===== Neutral ===== (surface/fg tokens auto-adapt to dark mode)
    { variant: 'solid', color: 'neutral', class: { root: 'bg-surface-muted text-fg' } },
    { variant: 'outline', color: 'neutral', class: { root: 'border-border text-fg' } },
    { variant: 'soft', color: 'neutral', class: { root: 'bg-surface-muted text-fg-muted' } },

    // ===== Info =====
    { variant: 'solid', color: 'info', class: { root: 'bg-info-600 text-on-info' } },
    { variant: 'outline', color: 'info', class: { root: 'border-info-300 text-info-700' } },
    { variant: 'soft', color: 'info', class: { root: 'bg-info-50 text-info-800' } },

    // ===== Success =====
    { variant: 'solid', color: 'success', class: { root: 'bg-success-600 text-on-success' } },
    { variant: 'outline', color: 'success', class: { root: 'border-success-300 text-success-700' } },
    { variant: 'soft', color: 'success', class: { root: 'bg-success-50 text-success-800' } },

    // ===== Warning =====
    { variant: 'solid', color: 'warning', class: { root: 'bg-warning-500 text-on-warning' } },
    { variant: 'outline', color: 'warning', class: { root: 'border-warning-300 text-warning-700' } },
    { variant: 'soft', color: 'warning', class: { root: 'bg-warning-50 text-warning-800' } },

    // ===== Error =====
    { variant: 'solid', color: 'error', class: { root: 'bg-error-600 text-on-error' } },
    { variant: 'outline', color: 'error', class: { root: 'border-error-300 text-error-700' } },
    { variant: 'soft', color: 'error', class: { root: 'bg-error-50 text-error-800' } },

    // ===== Reduced left padding when avatar is present =====
    { hasAvatar: true, size: 'xs', class: { root: 'pl-0.5' } },
    { hasAvatar: true, size: 'sm', class: { root: 'pl-1' } },
    { hasAvatar: true, size: 'md', class: { root: 'pl-1' } },
    { hasAvatar: true, size: 'lg', class: { root: 'pl-1.5' } },
    { hasAvatar: true, size: 'xl', class: { root: 'pl-1.5' } },
  ],
  defaultVariants: {
    variant: 'soft',
    color: 'neutral',
    size: 'md',
    pill: false,
    hasAvatar: false,
  },
}, {
  twMerge: true,
});

/**
 * Compact status label, tag, or count attached to any host element.
 *
 * Uses an attribute selector (`[twBadge]`) rather than the library's canonical
 * element selector so consumers can apply the badge styling to any inline
 * element — `<span>`, `<a>`, `<div>` — without an extra wrapper. The trade-off
 * is intentional: badges most often live inside an existing text flow or list
 * item where wrapping in a `<tw-badge>` element would add structural noise.
 *
 * For dot-only presence indicators (no text, no padding), use the sibling
 * `[twBadgeDot]` directive — its rendering shape (no children, no dismiss,
 * no leading slot) is structurally distinct from the labelled badge.
 */
@Component({
  selector: '[twBadge]',
  exportAs: 'twBadge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'live() ? "status" : null',
  },
  template: `
    @if (hasLeadingAvatar()) {
      <span [class]="leadingAvatarClasses()"><ng-content select="tw-avatar" /></span>
    }
    @if (hasLeadingIcon() && !hasLeadingAvatar()) {
      <span [class]="leadingIconClasses()"><ng-content select="tw-icon" /></span>
    }
    <span [class]="contentClasses()"><ng-content /></span>
    @if (dismissible()) {
      <button
        type="button"
        [attr.aria-label]="dismissLabel()"
        [class]="dismissClasses()"
        (click)="dismissed.emit()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" [class]="dismissIconClasses()">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
        </svg>
      </button>
    }
  `,
})
export class BadgeComponent {
  /** Sets the semantic color palette. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** Controls the visual style. Defaults to `'soft'`. */
  readonly variant = input<BadgeVariant>('soft');

  /** Controls badge size (padding, font, icon size). Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, uses fully rounded corners instead of default `rounded-md`. Defaults to `false`. */
  readonly pill = input(false);

  /** When true, renders a dismiss button inside the badge. Defaults to `false`. */
  readonly dismissible = input(false);

  /**
   * When true, exposes the badge as an ARIA live region (`role="status"`)
   * so assistive technology announces content changes. Defaults to `false`
   * because most badges are decorative tags or labels — opt in only when
   * the badge represents a value that actually updates in place.
   */
  readonly live = input(false);

  /** Accessible label for the dismiss button. Override for localization. Defaults to `'Dismiss'`. */
  readonly dismissLabel = input<string>('Dismiss');

  /** Fires when the dismiss button is clicked. */
  readonly dismissed = output<void>();

  /** @internal */
  readonly avatarChild = contentChild(AvatarComponent);

  /** @internal */
  readonly iconChild = contentChild(IconComponent);

  readonly hasLeadingAvatar = computed(() => !!this.avatarChild());
  readonly hasLeadingIcon = computed(() => !!this.iconChild());

  private readonly variantResult = computed(() =>
    badgeVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      pill: this.pill(),
      hasAvatar: this.hasLeadingAvatar(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly contentClasses = computed(() => this.variantResult().content());
  readonly dismissClasses = computed(() => this.variantResult().dismiss());
  readonly dismissIconClasses = computed(() => this.variantResult().dismissIcon());
  readonly leadingAvatarClasses = computed(() => this.variantResult().leadingAvatar());
  readonly leadingIconClasses = computed(() => this.variantResult().leadingIcon());
}
