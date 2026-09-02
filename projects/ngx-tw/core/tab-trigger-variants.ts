import { tv } from 'tailwind-variants';
import type { TwColor } from './types';

/**
 * Visual style shared by `tw-tabs` (`TabsVariant`) and `nav[twTabNav]` (`TabNavVariant`).
 * Kept as a string-literal union so downstream consumers can narrow when needed.
 */
export type TabTriggerVariant = 'underline' | 'enclosed' | 'pill';

/**
 * Trigger-only tailwind-variants config shared by tabs and tab-nav.
 *
 * Both components own additional component-local slots (tablist/list/panel/nav,
 * etc.) — only the trigger shape is canonical enough to share here. The
 * resulting class string is merged with each component's local trigger
 * additions (e.g. tab-nav prepends `no-underline` because anchor elements need
 * to override the default underline; tabs adds nothing extra at the base).
 *
 * Active and inactive trigger state is applied separately via
 * {@link getActiveTriggerClasses} / {@link getInactiveTriggerClasses} so the
 * `Record<TwColor, string>` lookups stay statically scannable by the Tailwind
 * v4 content scanner.
 */
export const tabTriggerVariants = tv(
  {
    slots: {
      trigger:
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      variant: {
        underline: {
          trigger: 'border-b-2 border-transparent -mb-px text-fg-muted hover:text-fg',
        },
        enclosed: {
          trigger:
            'border border-transparent bg-surface-muted text-fg-muted hover:text-fg -mb-px',
        },
        pill: {
          trigger: 'rounded-md text-fg-muted hover:text-fg',
        },
      },
      // Pinned control heights — see `docs/vertical-rhythm.md`. Vertical padding
      // is deliberately absent: the height is declared, not derived, and the
      // trigger's own border (`border-b-2` on underline, `border` on enclosed)
      // sits *inside* it under Preflight's global `box-sizing: border-box`.
      // `inline-flex items-center` on the base slot does the centring.
      size: {
        xs: { trigger: 'px-2 text-xs h-6' },
        sm: { trigger: 'px-3 text-sm h-8' },
        md: { trigger: 'px-4 text-sm h-9' },
        lg: { trigger: 'px-5 text-base h-11' },
        xl: { trigger: 'px-6 text-base h-12' },
      },
      fitted: {
        true: { trigger: 'flex-1 justify-center' },
        false: {},
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
    },
    defaultVariants: {
      variant: 'underline',
      color: 'primary',
      size: 'md',
      fitted: false,
    },
  },
  { twMerge: true },
);

// ── Active-state class lookups ──
// Slot tokens own light/dark contrast — no `dark:`, no shade picks. Classes
// stay statically written so the Tailwind v4 scanner sees them. The neutral
// rows use surface/fg/border tokens which already auto-adapt to dark mode.

/** @internal Active trigger classes for horizontal underline variants, keyed by color. */
export const UNDERLINE_ACTIVE_HORIZONTAL: Record<TwColor, string> = {
  primary: 'border-b-2 border-primary-border-strong text-primary-fg',
  secondary: 'border-b-2 border-secondary-border-strong text-secondary-fg',
  accent: 'border-b-2 border-accent-border-strong text-accent-fg',
  neutral: 'border-b-2 border-border-strong text-fg',
  info: 'border-b-2 border-info-border-strong text-info-fg',
  success: 'border-b-2 border-success-border-strong text-success-fg',
  warning: 'border-b-2 border-warning-border-strong text-warning-fg',
  error: 'border-b-2 border-error-border-strong text-error-fg',
};

/** @internal Active trigger classes for vertical underline variants, keyed by color. */
export const UNDERLINE_ACTIVE_VERTICAL: Record<TwColor, string> = {
  primary: 'border-r-2 border-primary-border-strong text-primary-fg',
  secondary: 'border-r-2 border-secondary-border-strong text-secondary-fg',
  accent: 'border-r-2 border-accent-border-strong text-accent-fg',
  neutral: 'border-r-2 border-border-strong text-fg',
  info: 'border-r-2 border-info-border-strong text-info-fg',
  success: 'border-r-2 border-success-border-strong text-success-fg',
  warning: 'border-r-2 border-warning-border-strong text-warning-fg',
  error: 'border-r-2 border-error-border-strong text-error-fg',
};

/** @internal Active trigger classes for horizontal enclosed variants, keyed by color. */
export const ENCLOSED_ACTIVE_HORIZONTAL: Record<TwColor, string> = {
  primary: 'bg-surface border border-border border-b-transparent text-primary-fg',
  secondary: 'bg-surface border border-border border-b-transparent text-secondary-fg',
  accent: 'bg-surface border border-border border-b-transparent text-accent-fg',
  neutral: 'bg-surface border border-border border-b-transparent text-fg',
  info: 'bg-surface border border-border border-b-transparent text-info-fg',
  success: 'bg-surface border border-border border-b-transparent text-success-fg',
  warning: 'bg-surface border border-border border-b-transparent text-warning-fg',
  error: 'bg-surface border border-border border-b-transparent text-error-fg',
};

/** @internal Active trigger classes for vertical enclosed variants, keyed by color. */
export const ENCLOSED_ACTIVE_VERTICAL: Record<TwColor, string> = {
  primary: 'bg-surface border border-border border-r-transparent text-primary-fg',
  secondary: 'bg-surface border border-border border-r-transparent text-secondary-fg',
  accent: 'bg-surface border border-border border-r-transparent text-accent-fg',
  neutral: 'bg-surface border border-border border-r-transparent text-fg',
  info: 'bg-surface border border-border border-r-transparent text-info-fg',
  success: 'bg-surface border border-border border-r-transparent text-success-fg',
  warning: 'bg-surface border border-border border-r-transparent text-warning-fg',
  error: 'bg-surface border border-border border-r-transparent text-error-fg',
};

/** @internal Active trigger classes for pill variants, keyed by color. */
export const PILL_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-surface shadow-sm text-primary-fg',
  secondary: 'bg-surface shadow-sm text-secondary-fg',
  accent: 'bg-surface shadow-sm text-accent-fg',
  neutral: 'bg-surface shadow-sm text-fg',
  info: 'bg-surface shadow-sm text-info-fg',
  success: 'bg-surface shadow-sm text-success-fg',
  warning: 'bg-surface shadow-sm text-warning-fg',
  error: 'bg-surface shadow-sm text-error-fg',
};

/** @internal Inactive trigger classes keyed by variant. */
export const INACTIVE_TRIGGER_CLASSES: Record<TabTriggerVariant, string> = {
  underline: 'border-transparent',
  enclosed: 'border-transparent bg-surface-muted',
  pill: '',
};

/**
 * Returns the active-state trigger class string for the given variant, color,
 * and orientation. Tab-nav callers pass `'horizontal'` since it is horizontal-only.
 */
export function getActiveTriggerClasses(
  variant: TabTriggerVariant,
  color: TwColor,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): string {
  switch (variant) {
    case 'underline':
      return orientation === 'vertical'
        ? UNDERLINE_ACTIVE_VERTICAL[color]
        : UNDERLINE_ACTIVE_HORIZONTAL[color];
    case 'enclosed':
      return orientation === 'vertical'
        ? ENCLOSED_ACTIVE_VERTICAL[color]
        : ENCLOSED_ACTIVE_HORIZONTAL[color];
    case 'pill':
      return PILL_ACTIVE[color];
  }
}

/** Returns the inactive-state trigger class string for the given variant. */
export function getInactiveTriggerClasses(variant: TabTriggerVariant): string {
  return INACTIVE_TRIGGER_CLASSES[variant];
}
