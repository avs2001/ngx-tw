import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor } from 'ngx-tw/core';

/** Visual style of the alert container. */
export type AlertVariant = 'solid' | 'outline' | 'soft';

const alertVariants = tv({
  slots: {
    root: 'relative flex gap-3 rounded-lg p-4 text-sm',
    icon: 'size-5 shrink-0 mt-0.5',
    title: 'text-sm font-semibold',
    content: 'text-sm',
    actions: 'flex items-center gap-2 mt-2',
    dismiss:
      'absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
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
  },
  compoundVariants: [
    // ===== Primary =====
    { variant: 'soft', color: 'primary', class: { root: 'bg-primary-50 text-primary-800', icon: 'text-primary-500', title: 'text-primary-800', content: 'text-primary-700', dismiss: 'text-primary-500 hover:bg-primary-100' } },
    { variant: 'outline', color: 'primary', class: { root: 'border-primary-300 text-primary-800', icon: 'text-primary-500', title: 'text-primary-800', content: 'text-primary-700', dismiss: 'text-primary-500 hover:bg-primary-100' } },
    { variant: 'solid', color: 'primary', class: { root: 'bg-primary-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },

    // ===== Secondary =====
    { variant: 'soft', color: 'secondary', class: { root: 'bg-secondary-50 text-secondary-800', icon: 'text-secondary-500', title: 'text-secondary-800', content: 'text-secondary-700', dismiss: 'text-secondary-500 hover:bg-secondary-100' } },
    { variant: 'outline', color: 'secondary', class: { root: 'border-secondary-300 text-secondary-800', icon: 'text-secondary-500', title: 'text-secondary-800', content: 'text-secondary-700', dismiss: 'text-secondary-500 hover:bg-secondary-100' } },
    { variant: 'solid', color: 'secondary', class: { root: 'bg-secondary-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },

    // ===== Accent =====
    { variant: 'soft', color: 'accent', class: { root: 'bg-accent-50 text-accent-800', icon: 'text-accent-500', title: 'text-accent-800', content: 'text-accent-700', dismiss: 'text-accent-500 hover:bg-accent-100' } },
    { variant: 'outline', color: 'accent', class: { root: 'border-accent-300 text-accent-800', icon: 'text-accent-500', title: 'text-accent-800', content: 'text-accent-700', dismiss: 'text-accent-500 hover:bg-accent-100' } },
    { variant: 'solid', color: 'accent', class: { root: 'bg-accent-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },

    // ===== Neutral =====
    { variant: 'soft', color: 'neutral', class: { root: 'bg-surface-muted text-fg', icon: 'text-fg-muted', title: 'text-fg', content: 'text-fg-muted', dismiss: 'text-fg-muted hover:bg-surface-sunken' } },
    { variant: 'outline', color: 'neutral', class: { root: 'border-border text-fg', icon: 'text-fg-muted', title: 'text-fg', content: 'text-fg-muted', dismiss: 'text-fg-muted hover:bg-surface-muted' } },
    { variant: 'solid', color: 'neutral', class: { root: 'bg-surface-muted text-fg', icon: 'text-fg-muted', title: 'text-fg', content: 'text-fg-muted', dismiss: 'text-fg-muted hover:bg-surface-sunken' } },

    // ===== Info =====
    { variant: 'soft', color: 'info', class: { root: 'bg-info-50 text-info-800', icon: 'text-info-500', title: 'text-info-800', content: 'text-info-700', dismiss: 'text-info-500 hover:bg-info-100' } },
    { variant: 'outline', color: 'info', class: { root: 'border-info-300 text-info-800', icon: 'text-info-500', title: 'text-info-800', content: 'text-info-700', dismiss: 'text-info-500 hover:bg-info-100' } },
    { variant: 'solid', color: 'info', class: { root: 'bg-info-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },

    // ===== Success =====
    { variant: 'soft', color: 'success', class: { root: 'bg-success-50 text-success-800', icon: 'text-success-500', title: 'text-success-800', content: 'text-success-700', dismiss: 'text-success-500 hover:bg-success-100' } },
    { variant: 'outline', color: 'success', class: { root: 'border-success-300 text-success-800', icon: 'text-success-500', title: 'text-success-800', content: 'text-success-700', dismiss: 'text-success-500 hover:bg-success-100' } },
    { variant: 'solid', color: 'success', class: { root: 'bg-success-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },

    // ===== Warning =====
    { variant: 'soft', color: 'warning', class: { root: 'bg-warning-50 text-warning-800', icon: 'text-warning-500', title: 'text-warning-800', content: 'text-warning-700', dismiss: 'text-warning-500 hover:bg-warning-100' } },
    { variant: 'outline', color: 'warning', class: { root: 'border-warning-300 text-warning-800', icon: 'text-warning-500', title: 'text-warning-800', content: 'text-warning-700', dismiss: 'text-warning-500 hover:bg-warning-100' } },
    { variant: 'solid', color: 'warning', class: { root: 'bg-warning-500 text-black', icon: 'text-black', title: 'text-black', content: 'text-black/80', dismiss: 'text-black/70 hover:text-black hover:bg-black/10' } },

    // ===== Error =====
    { variant: 'soft', color: 'error', class: { root: 'bg-error-50 text-error-800', icon: 'text-error-500', title: 'text-error-800', content: 'text-error-700', dismiss: 'text-error-500 hover:bg-error-100' } },
    { variant: 'outline', color: 'error', class: { root: 'border-error-300 text-error-800', icon: 'text-error-500', title: 'text-error-800', content: 'text-error-700', dismiss: 'text-error-500 hover:bg-error-100' } },
    { variant: 'solid', color: 'error', class: { root: 'bg-error-600 text-white', icon: 'text-white', title: 'text-white', content: 'text-white/90', dismiss: 'text-white/70 hover:text-white hover:bg-white/10' } },
  ],
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
    'role': 'alert',
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
        aria-label="Dismiss"
        [class]="dismissClasses()"
        (click)="dismissed.emit()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-full">
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
  readonly dismissible = input(false);

  /** Sets the ARIA live politeness for screen reader announcements. Defaults to `'polite'`. */
  readonly politeness = input<'polite' | 'assertive' | 'off'>('polite');

  /** Fires when the dismiss button is clicked. */
  readonly dismissed = output<void>();

  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal */
  readonly iconDirective = contentChild(AlertIconDirective);

  readonly hasIcon = computed(() => !!this.iconDirective());

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

  constructor() {
    afterNextRender(() => {
      const politeness = this.politeness();
      if (politeness !== 'off') {
        const text = this.elementRef.nativeElement.textContent?.trim();
        if (text) {
          this.liveAnnouncer.announce(text, politeness);
        }
      }
    });
  }
}
