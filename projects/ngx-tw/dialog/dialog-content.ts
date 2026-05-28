import {
  computed,
  Directive,
  inject,
  input,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkScrollable } from '@angular/cdk/scrolling';
import type { TwColor } from 'ngx-tw/core';
import { TwDialogRef } from './dialog-ref';
import { DialogContainer } from './dialog-container';

/**
 * Header wrapper for a dialog. Provides consistent padding and spacing for
 * title + subtitle + leading icon, and separates the header from scrollable
 * content below.
 */
@Directive({
  selector: '[twDialogHeader], tw-dialog-header',
  host: {
    class: 'flex items-start gap-3 px-6 pt-6 pb-4',
  },
})
export class DialogHeaderDirective {}

// Slot tokens own light/dark contrast — no `dark:` overrides, no shade picks.
// See role slot conventions in `projects/ngx-tw/theme/_semantic.css`.
const ICON_COLOR_CLASSES: Record<TwColor, string> = {
  primary: 'bg-primary-soft text-primary-icon',
  secondary: 'bg-secondary-soft text-secondary-icon',
  accent: 'bg-accent-soft text-accent-icon',
  neutral: 'bg-neutral-soft text-neutral-icon',
  info: 'bg-info-soft text-info-icon',
  success: 'bg-success-soft text-success-icon',
  warning: 'bg-warning-soft text-warning-icon',
  error: 'bg-error-soft text-error-icon',
};

/**
 * Decorative leading icon for a dialog header. Use with a semantic `color` to
 * match destructive / informational / success dialogs.
 */
@Directive({
  selector: '[twDialogIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class DialogIconDirective {
  /** Semantic color for the icon container. Defaults to a neutral surface. */
  readonly color = input<TwColor | undefined>(undefined);

  protected readonly classes = computed(() => {
    const base = 'flex size-10 shrink-0 items-center justify-center rounded-full';
    const color = this.color();
    return color ? `${base} ${ICON_COLOR_CLASSES[color]}` : `${base} bg-surface-muted text-fg`;
  });
}

/**
 * Dialog title. Registers its ID with the container's `aria-labelledby` queue
 * so screen readers announce it automatically.
 */
@Directive({
  selector: '[twDialogTitle], tw-dialog-title',
  host: {
    class: 'text-sm font-semibold text-fg',
    '[id]': 'id()',
  },
})
export class DialogTitleDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-dialog-title-');
  private readonly dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, {
    optional: true,
  });
  // Ancestor-DI fallback for the rare case where `TwDialogRef` is not in the
  // directive's injector chain (e.g. heavily nested template portals). The
  // container ALWAYS resolves via element-injector traversal because the
  // directive lives inside `<tw-dialog-container>`'s DOM tree.
  private readonly container = inject(DialogContainer, { optional: true, skipSelf: true });

  /** Custom id for the title element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    const containerInstance = this.dialogRef?.containerInstance ?? this.container;
    if (containerInstance) containerInstance._addAriaLabelledBy(this.id());
  }

  ngOnDestroy(): void {
    const containerInstance = this.dialogRef?.containerInstance ?? this.container;
    if (containerInstance) containerInstance._removeAriaLabelledBy(this.id());
  }
}

/** Secondary line beneath the dialog title — intended for a short description. */
@Directive({
  selector: '[twDialogSubtitle], tw-dialog-subtitle',
  host: {
    class: 'text-sm text-fg-muted',
  },
})
export class DialogSubtitleDirective {}

/**
 * Dialog description. Registers its ID with the container's `aria-describedby`
 * queue so screen readers announce the descriptive paragraph after the title.
 * Mirrors {@link DialogTitleDirective} but for `aria-describedby`.
 */
@Directive({
  selector: '[twDialogDescription], tw-dialog-description',
  host: {
    '[id]': 'id()',
  },
})
export class DialogDescriptionDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-dialog-description-');
  private readonly dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, {
    optional: true,
  });
  // Ancestor-DI fallback — see DialogTitleDirective.
  private readonly container = inject(DialogContainer, { optional: true, skipSelf: true });

  /** Custom id for the description element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    const containerInstance = this.dialogRef?.containerInstance ?? this.container;
    if (containerInstance) containerInstance._addAriaDescribedBy(this.id());
  }

  ngOnDestroy(): void {
    const containerInstance = this.dialogRef?.containerInstance ?? this.container;
    if (containerInstance) containerInstance._removeAriaDescribedBy(this.id());
  }
}

/**
 * Scrollable content region of the dialog. Apply between the header and the
 * actions bar. Inherits CDK's `CdkScrollable` to play nicely with scroll
 * strategies and nested scrollables.
 */
@Directive({
  selector: '[twDialogContent], tw-dialog-content',
  hostDirectives: [CdkScrollable],
  host: {
    class: 'flex-1 overflow-y-auto px-6 py-4 text-sm text-fg',
  },
})
export class DialogContentDirective {}

/** Horizontal alignment for dialog action buttons. */
export type DialogActionsAlign = 'start' | 'center' | 'end';

/**
 * Bottom action bar of a dialog. Use inside the dialog content or template to
 * host Cancel/Confirm buttons. Stays pinned below scrollable content.
 */
@Directive({
  selector: '[twDialogActions], tw-dialog-actions',
  host: {
    '[class]': 'classes()',
  },
})
export class DialogActionsDirective {
  /** Horizontal alignment of the action buttons. Defaults to `'end'`. */
  readonly align = input<DialogActionsAlign>('end');

  protected readonly classes = computed(() => {
    const align = this.align();
    const justify =
      align === 'start' ? 'justify-start' : align === 'center' ? 'justify-center' : 'justify-end';
    return `flex flex-wrap items-center gap-2 px-6 py-4 border-t border-border-muted ${justify}`;
  });
}

/**
 * Closes the enclosing dialog when the host button is clicked. Provide a
 * `[twDialogClose]` value to pass a result to `afterClosed()` subscribers.
 */
@Directive({
  selector: '[twDialogClose]',
  host: {
    '(click)': 'onClick()',
    '[attr.type]': 'type()',
  },
})
export class DialogCloseDirective {
  /** Value passed to `afterClosed()` when the button is clicked. */
  readonly twDialogClose = input<unknown>(undefined);

  /** Native button `type`. Defaults to `'button'` to avoid accidental form submission. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  private readonly dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, {
    optional: true,
  });

  protected onClick(): void {
    this.dialogRef?.close(this.twDialogClose());
  }
}
