import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  output,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor } from '@cdevhub/ngx-tw/core';

/** Visual style of the alert container. */
export type AlertVariant = 'solid' | 'outline' | 'soft';

/** ARIA live-region politeness for the alert. Maps to the host `role`. */
export type AlertPoliteness = 'polite' | 'assertive' | 'off';

/**
 * Alert variants use the semantic role slot tokens defined in
 * `projects/ngx-tw/theme/_semantic.css` (and redefined per-theme in
 * `_dark.css` / `_high-contrast.css`). The mapping role × variant → slots
 * is the same for every color, so the variant table is expressed as a single
 * function template over the role name — no per-role copy-paste, no shade
 * picks, no `dark:` overrides. Dark / high-contrast contrast is owned by the
 * theme tokens; components only consume slots.
 */
type AlertSlotClasses = {
  root: string;
  icon: string;
  title: string;
  content: string;
  dismiss: string;
};

function softSlots(role: TwColor): AlertSlotClasses {
  return {
    root: `bg-${role}-soft text-${role}-soft-fg-muted`,
    icon: `text-${role}-icon`,
    title: `text-${role}-soft-fg`,
    content: `text-${role}-soft-fg-muted`,
    dismiss: `text-${role}-icon hover:bg-${role}-soft-hover`,
  };
}

function outlineSlots(role: TwColor): AlertSlotClasses {
  return {
    root: `border-${role}-border text-${role}-soft-fg-muted`,
    icon: `text-${role}-icon`,
    title: `text-${role}-soft-fg`,
    content: `text-${role}-soft-fg-muted`,
    dismiss: `text-${role}-icon hover:bg-${role}-soft`,
  };
}

function solidSlots(role: TwColor): AlertSlotClasses {
  return {
    root: `bg-${role}-solid text-${role}-solid-fg`,
    icon: `text-${role}-solid-fg`,
    title: `text-${role}-solid-fg`,
    content: `text-${role}-solid-fg`,
    dismiss: `text-${role}-solid-fg/80 hover:bg-${role}-solid-hover`,
  };
}

const ROLES: readonly TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral',
  'info', 'success', 'warning', 'error',
] as const;

const alertVariants = tv({
  slots: {
    root: 'relative flex gap-3 rounded-lg p-4 text-sm',
    icon: 'size-5 shrink-0 mt-0.5',
    title: 'text-sm font-semibold',
    content: 'text-sm',
    actions: 'flex items-center gap-2 mt-2',
    // size-3.5 inner glyph: half-step decorative — keeps the X visually centred
    // in the size-6 square-interactive target without dominating the button.
    dismiss:
      'absolute top-2.5 right-2.5 inline-flex items-center justify-center size-6 rounded-md cursor-pointer transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  },
  variants: {
    variant: {
      solid: { root: '' },
      outline: { root: 'border' },
      soft: { root: '' },
    },
    color: Object.fromEntries(ROLES.map((r) => [r, {}])) as Record<TwColor, {}>,
  },
  compoundVariants: ROLES.flatMap((role) => [
    { variant: 'soft' as const, color: role, class: softSlots(role) },
    { variant: 'outline' as const, color: role, class: outlineSlots(role) },
    { variant: 'solid' as const, color: role, class: solidSlots(role) },
  ]),
  defaultVariants: {
    variant: 'soft',
    color: 'info',
  },
}, {
  twMerge: true,
});

@Directive({
  selector: '[twAlertIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class AlertIconDirective {
  private readonly alert = inject(AlertComponent);
  readonly classes = this.alert.iconClasses;
}

@Directive({
  selector: '[twAlertTitle]',
  host: {
    '[class]': 'classes()',
  },
})
export class AlertTitleDirective {
  private readonly alert = inject(AlertComponent);
  readonly classes = this.alert.titleClasses;
}

@Directive({
  selector: '[twAlertContent]',
  host: {
    '[class]': 'classes()',
  },
})
export class AlertContentDirective {
  private readonly alert = inject(AlertComponent);
  readonly classes = this.alert.contentClasses;
}

@Directive({
  selector: '[twAlertActions]',
  host: {
    '[class]': 'classes()',
  },
})
export class AlertActionsDirective {
  private readonly alert = inject(AlertComponent);
  readonly classes = this.alert.actionsClasses;
}

@Component({
  selector: 'tw-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': 'computedRole()',
    '[class]': 'rootClasses()',
    '[animate.leave]': '"fade-out"',
  },
  template: `
    @if (hasIcon()) {
      <ng-content select="[twAlertIcon]" />
    }
    <div class="min-w-0 flex-1">
      <ng-content select="[twAlertTitle]" />
      <ng-content select="[twAlertContent]" />
      <ng-content />
      <ng-content select="[twAlertActions]" />
    </div>
    @if (dismissible()) {
      <button
        type="button"
        [attr.aria-label]="dismissLabel()"
        [class]="dismissClasses()"
        (click)="dismissed.emit()"
      >
        <!-- size-3.5 (14px) is the half-step between size-3 and size-4 — the only icon size that visually aligns with the alert title's text-sm metric inside the compact xs-density dismiss button. -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3.5">
          <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
        </svg>
      </button>
    }
  `,
})
export class AlertComponent {
  /** Controls the visual style of the alert. Defaults to `'soft'`. */
  readonly variant = input<AlertVariant>('soft');

  /** Sets the semantic color palette. Defaults to `'info'`. */
  readonly color = input<TwColor>('info');

  /** When true, renders a dismiss button. Defaults to `false`. */
  readonly dismissible = input(false, { transform: booleanAttribute });

  /**
   * Sets the ARIA live-region politeness. Maps to the host `role`:
   * `'assertive'` → `role="alert"`, `'polite'` → `role="status"`,
   * `'off'` → no role. Use `'off'` to suppress re-announcement when the
   * alert content updates after initial render — assistive tech treats the
   * alert as a static region rather than a live region. Defaults to `'polite'`.
   */
  readonly politeness = input<AlertPoliteness>('polite');

  /** Accessible label for the dismiss button. Override for localization. Defaults to `'Dismiss'`. */
  readonly dismissLabel = input<string>('Dismiss');

  /** Fires when the dismiss button is clicked. */
  readonly dismissed = output<void>();

  /** @internal */
  readonly iconDirective = contentChild(AlertIconDirective);

  readonly hasIcon = computed(() => !!this.iconDirective());

  readonly computedRole = computed(() => {
    switch (this.politeness()) {
      case 'assertive':
        return 'alert';
      case 'polite':
        return 'status';
      default:
        return null;
    }
  });

  private readonly variantResult = computed(() =>
    alertVariants({
      variant: this.variant(),
      color: this.color(),
    }),
  );

  readonly rootClasses = computed(() => {
    const base = this.variantResult().root();
    return this.dismissible() ? `${base} pr-10` : base;
  });

  readonly iconClasses = computed(() => this.variantResult().icon());
  readonly titleClasses = computed(() => this.variantResult().title());
  readonly contentClasses = computed(() => this.variantResult().content());
  readonly actionsClasses = computed(() => this.variantResult().actions());
  readonly dismissClasses = computed(() => this.variantResult().dismiss());
}
