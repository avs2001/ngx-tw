import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { CdkScrollable } from '@angular/cdk/scrolling';
import type { TwColor } from 'ngx-tw/core';
import { TwDialog } from './dialog';
import { TwDialogRef } from './dialog-ref';
import { TwDialogContainer } from './dialog-container';

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
export class TwDialogHeaderDirective {}

const ICON_COLOR_CLASSES: Record<TwColor, string> = {
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300',
  secondary: 'bg-secondary-50 text-secondary-600 dark:bg-secondary-950 dark:text-secondary-300',
  accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950 dark:text-accent-300',
  neutral: 'bg-surface-muted text-fg',
  info: 'bg-info-50 text-info-600 dark:bg-info-950 dark:text-info-300',
  success: 'bg-success-50 text-success-600 dark:bg-success-950 dark:text-success-300',
  warning: 'bg-warning-50 text-warning-600 dark:bg-warning-950 dark:text-warning-300',
  error: 'bg-error-50 text-error-600 dark:bg-error-950 dark:text-error-300',
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
export class TwDialogIconDirective {
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
    class: 'text-base font-semibold text-fg',
    '[id]': 'id()',
  },
})
export class TwDialogTitleDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-dialog-title-');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(TwDialog, { optional: true });
  private dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, { optional: true });

  /** Custom id for the title element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    if (!this.dialogRef && this.dialog) {
      this.dialogRef = findEnclosingDialog(this.elementRef, this.dialog) ?? null;
    }
    const container = this.dialogRef?.containerInstance;
    if (container) container._addAriaLabelledBy(this.id());
  }

  ngOnDestroy(): void {
    const container = this.dialogRef?.containerInstance;
    if (container) container._removeAriaLabelledBy(this.id());
  }
}

/** Secondary line beneath the dialog title — intended for a short description. */
@Directive({
  selector: '[twDialogSubtitle], tw-dialog-subtitle',
  host: {
    class: 'text-sm text-fg-muted',
  },
})
export class TwDialogSubtitleDirective {}

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
export class TwDialogContentDirective {}

/** Horizontal alignment for dialog action buttons. */
export type TwDialogActionsAlign = 'start' | 'center' | 'end';

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
export class TwDialogActionsDirective implements OnInit, OnDestroy {
  /** Horizontal alignment of the action buttons. Defaults to `'end'`. */
  readonly align = input<TwDialogActionsAlign>('end');

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(TwDialog, { optional: true });
  private dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, { optional: true });

  protected readonly classes = computed(() => {
    const align = this.align();
    const justify =
      align === 'start' ? 'justify-start' : align === 'center' ? 'justify-center' : 'justify-end';
    return `flex flex-wrap items-center gap-2 px-6 py-4 border-t border-border-muted ${justify}`;
  });

  ngOnInit(): void {
    if (!this.dialogRef && this.dialog) {
      this.dialogRef = findEnclosingDialog(this.elementRef, this.dialog) ?? null;
    }
    const container = this.dialogRef?.containerInstance;
    if (container) container._updateActionSectionCount(1);
  }

  ngOnDestroy(): void {
    const container = this.dialogRef?.containerInstance;
    if (container) container._updateActionSectionCount(-1);
  }
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
export class TwDialogCloseDirective implements OnInit {
  /** Value passed to `afterClosed()` when the button is clicked. */
  readonly twDialogClose = input<unknown>(undefined);

  /** Native button `type`. Defaults to `'button'` to avoid accidental form submission. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialog = inject(TwDialog, { optional: true });
  private dialogRef = inject<TwDialogRef<unknown, unknown>>(TwDialogRef, { optional: true });

  ngOnInit(): void {
    if (!this.dialogRef && this.dialog) {
      this.dialogRef = findEnclosingDialog(this.elementRef, this.dialog) ?? null;
    }
  }

  protected onClick(): void {
    this.dialogRef?.close(this.twDialogClose());
  }
}

function findEnclosingDialog(
  elementRef: ElementRef<HTMLElement>,
  dialog: TwDialog,
): TwDialogRef<unknown, unknown> | undefined {
  let parent: HTMLElement | null = elementRef.nativeElement.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'tw-dialog-container') {
    parent = parent.parentElement;
  }
  if (!parent) return undefined;
  const id = parent.getAttribute('id');
  if (!id) return undefined;
  return dialog.getDialogById(id);
}
