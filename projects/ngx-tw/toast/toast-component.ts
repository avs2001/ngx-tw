import {
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
import type { ToastSeverity } from './toast-config';

const toastVariants = tv(
  {
    slots: {
      root:
        'pointer-events-auto relative flex items-start gap-3 w-full max-w-sm p-4 rounded-lg border shadow-md text-sm will-change-transform transition-colors duration-200 motion-reduce:transition-none',
      icon: 'size-5 shrink-0 mt-0.5',
      title: 'text-sm font-semibold',
      description: 'text-sm',
      content: 'flex-1 min-w-0',
      action:
        'inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
      dismiss:
        'absolute top-3 right-3 inline-flex items-center justify-center size-5 rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      severity: {
        info: {},
        success: {},
        warning: {},
        error: {},
        neutral: {},
      },
    },
    compoundVariants: [
      {
        severity: 'info',
        class: {
          root: 'bg-info-50 text-info-800 border-info-300',
          icon: 'text-info-500',
          title: 'text-info-800',
          description: 'text-info-700',
          action: 'text-info-700 hover:bg-info-100',
          dismiss: 'text-info-500 hover:bg-info-100',
        },
      },
      {
        severity: 'success',
        class: {
          root: 'bg-success-50 text-success-800 border-success-300',
          icon: 'text-success-500',
          title: 'text-success-800',
          description: 'text-success-700',
          action: 'text-success-700 hover:bg-success-100',
          dismiss: 'text-success-500 hover:bg-success-100',
        },
      },
      {
        severity: 'warning',
        class: {
          root: 'bg-warning-50 text-warning-800 border-warning-300',
          icon: 'text-warning-500',
          title: 'text-warning-800',
          description: 'text-warning-700',
          action: 'text-warning-700 hover:bg-warning-100',
          dismiss: 'text-warning-500 hover:bg-warning-100',
        },
      },
      {
        severity: 'error',
        class: {
          root: 'bg-error-50 text-error-800 border-error-300',
          icon: 'text-error-500',
          title: 'text-error-800',
          description: 'text-error-700',
          action: 'text-error-700 hover:bg-error-100',
          dismiss: 'text-error-500 hover:bg-error-100',
        },
      },
      {
        severity: 'neutral',
        class: {
          root: 'bg-surface-raised text-fg border-border',
          icon: 'text-fg-muted',
          title: 'text-fg',
          description: 'text-fg-muted',
          action: 'text-fg hover:bg-surface-muted',
          dismiss: 'text-fg-muted hover:bg-surface-muted',
        },
      },
    ],
    defaultVariants: {
      severity: 'info',
    },
  },
  { twMerge: true },
);

/** Slot directive for the icon. When projected, overrides the severity-default icon. */
@Directive({
  selector: '[twToastIcon]',
  host: {
    '[class]': 'classes()',
    'aria-hidden': 'true',
  },
})
export class ToastIconDirective {
  private readonly toast = inject(ToastComponent);
  /** @internal */
  readonly classes = this.toast.iconClasses;
}

/** Slot directive for the bold title line inside a toast. */
@Directive({
  selector: '[twToastTitle]',
  host: {
    '[class]': 'classes()',
  },
})
export class ToastTitleDirective {
  private readonly toast = inject(ToastComponent);
  /** @internal */
  readonly classes = this.toast.titleClasses;
}

/** Slot directive for a secondary description line inside a toast. */
@Directive({
  selector: '[twToastDescription]',
  host: {
    '[class]': 'classes()',
  },
})
export class ToastDescriptionDirective {
  private readonly toast = inject(ToastComponent);
  /** @internal */
  readonly classes = this.toast.descriptionClasses;
}

/** Slot directive for the action button. Apply to a native `<button>` to inherit the severity-aware styling. */
@Directive({
  selector: '[twToastAction]',
  host: {
    type: 'button',
    '[class]': 'classes()',
    '(click)': 'onClick()',
  },
})
export class ToastActionDirective {
  private readonly toast = inject(ToastComponent);
  /** @internal */
  readonly classes = this.toast.actionClasses;
  /** @internal */
  protected onClick(): void {
    this.toast.actionClicked.emit();
  }
}

/**
 * Visual toast / snackbar panel. Rendered internally by {@link ToastService} for
 * string content, and exported for consumers who want to compose the same
 * visual inside a custom `TemplateRef` or component class passed to `show()`.
 */
@Component({
  selector: 'tw-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'roleAttr()',
    '[attr.aria-live]': 'ariaLiveAttr()',
    'aria-atomic': 'true',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.data-severity]': 'severity()',
  },
  template: `
    @if (hasProjectedIcon()) {
      <ng-content select="[twToastIcon]" />
    } @else if (icon() !== false) {
      <span [class]="iconClasses()" aria-hidden="true">
        @switch (severity()) {
          @case ('info') {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-full">
              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-.75 2.5a.75.75 0 0 0 0 1.5h.25v3h-.25a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5h-.25v-3.75a.75.75 0 0 0-.75-.75h-1Z" clip-rule="evenodd"/>
            </svg>
          }
          @case ('success') {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-full">
              <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/>
            </svg>
          }
          @case ('warning') {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-full">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
            </svg>
          }
          @case ('error') {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-full">
              <path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/>
            </svg>
          }
          @default {
            @if (icon() && icon() !== false) {
              {{ icon() }}
            }
          }
        }
      </span>
    }
    <div [class]="contentClasses()">
      <ng-content select="[twToastTitle]" />
      <ng-content select="[twToastDescription]" />
      <ng-content />
      <ng-content select="[twToastAction]" />
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
export class ToastComponent {
  /** Severity variant. Drives color palette, default icon, and ARIA role / live politeness. Defaults to `'info'`. */
  readonly severity = input<ToastSeverity>('info');

  /** Whether to render the close button. Defaults to `true`. */
  readonly dismissible = input<boolean>(true);

  /**
   * Icon override. Pass a string to render as text inside the icon slot, or
   * `false` to hide the built-in severity icon. Ignored when a `[twToastIcon]`
   * child is projected. When omitted, the severity-default icon renders.
   */
  readonly icon = input<string | false | undefined>(undefined);

  /** Explicit aria-label for the toast wrapper. When omitted, text content is used by assistive tech. */
  readonly ariaLabel = input<string | undefined>(undefined);

  /** Fires when the close button is clicked. */
  readonly dismissed = output<void>();

  /** Fires when a `[twToastAction]` button is clicked. */
  readonly actionClicked = output<void>();

  /** @internal */
  readonly projectedIcon = contentChild(ToastIconDirective);

  /** @internal */
  readonly hasProjectedIcon = computed(() => !!this.projectedIcon());

  private readonly variantResult = computed(() => toastVariants({ severity: this.severity() }));

  /** @internal */
  readonly rootClasses = computed(() => {
    const base = this.variantResult().root();
    return this.dismissible() ? `${base} pr-10` : base;
  });

  /** @internal */
  readonly iconClasses = computed(() => this.variantResult().icon());
  /** @internal */
  readonly titleClasses = computed(() => this.variantResult().title());
  /** @internal */
  readonly descriptionClasses = computed(() => this.variantResult().description());
  /** @internal */
  readonly contentClasses = computed(() => this.variantResult().content());
  /** @internal */
  readonly actionClasses = computed(() => this.variantResult().action());
  /** @internal */
  readonly dismissClasses = computed(() => this.variantResult().dismiss());

  /** @internal */
  protected readonly roleAttr = computed(() =>
    this.severity() === 'error' ? 'alert' : 'status',
  );

  /** @internal */
  protected readonly ariaLiveAttr = computed(() =>
    this.severity() === 'error' ? 'assertive' : 'polite',
  );
}
