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
import { Sheet } from './sheet';
import { SheetRef } from './sheet-ref';

/**
 * Header wrapper for a sheet. Provides consistent padding and spacing for
 * title + subtitle + leading icon, and separates the header from scrollable
 * content below.
 */
@Directive({
  selector: '[twSheetHeader], tw-sheet-header',
  host: {
    class: 'flex items-start gap-3 px-6 pt-6 pb-4',
  },
})
export class SheetHeaderDirective {}

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
 * Decorative leading icon for a sheet header. Use with a semantic `color` to
 * match destructive / informational / success sheets.
 */
@Directive({
  selector: '[twSheetIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class SheetIconDirective {
  /** Semantic color for the icon container. Defaults to a neutral surface. */
  readonly color = input<TwColor | undefined>(undefined);

  protected readonly classes = computed(() => {
    const base = 'flex size-10 shrink-0 items-center justify-center rounded-full';
    const color = this.color();
    return color ? `${base} ${ICON_COLOR_CLASSES[color]}` : `${base} bg-surface-muted text-fg`;
  });
}

/**
 * Sheet title. Registers its ID with the container's `aria-labelledby` queue
 * so screen readers announce it automatically.
 */
@Directive({
  selector: '[twSheetTitle], tw-sheet-title',
  host: {
    class: 'text-base font-semibold text-fg',
    '[id]': 'id()',
  },
})
export class SheetTitleDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-sheet-title-');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sheet = inject(Sheet, { optional: true });
  private sheetRef = inject<SheetRef<unknown, unknown>>(SheetRef, { optional: true });

  /** Custom id for the title element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    if (!this.sheetRef && this.sheet) {
      this.sheetRef = findEnclosingSheet(this.elementRef, this.sheet) ?? null;
    }
    const container = this.sheetRef?.containerInstance;
    if (container) container._addAriaLabelledBy(this.id());
  }

  ngOnDestroy(): void {
    const container = this.sheetRef?.containerInstance;
    if (container) container._removeAriaLabelledBy(this.id());
  }
}

/** Secondary line beneath the sheet title — intended for a short description. */
@Directive({
  selector: '[twSheetSubtitle], tw-sheet-subtitle',
  host: {
    class: 'text-sm text-fg-muted',
  },
})
export class SheetSubtitleDirective {}

/**
 * Sheet description. Registers its ID with the container's `aria-describedby`
 * queue so screen readers announce the descriptive paragraph after the title.
 * Mirrors {@link SheetTitleDirective} but for `aria-describedby`.
 */
@Directive({
  selector: '[twSheetDescription], tw-sheet-description',
  host: {
    '[id]': 'id()',
  },
})
export class SheetDescriptionDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-sheet-description-');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sheet = inject(Sheet, { optional: true });
  private sheetRef = inject<SheetRef<unknown, unknown>>(SheetRef, { optional: true });

  /** Custom id for the description element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    if (!this.sheetRef && this.sheet) {
      this.sheetRef = findEnclosingSheet(this.elementRef, this.sheet) ?? null;
    }
    const container = this.sheetRef?.containerInstance;
    if (container) container._addAriaDescribedBy(this.id());
  }

  ngOnDestroy(): void {
    const container = this.sheetRef?.containerInstance;
    if (container) container._removeAriaDescribedBy(this.id());
  }
}

/**
 * Scrollable content region of the sheet. Apply between the header and the
 * actions bar. Inherits CDK's `CdkScrollable` to play nicely with scroll
 * strategies and nested scrollables.
 */
@Directive({
  selector: '[twSheetContent], tw-sheet-content',
  hostDirectives: [CdkScrollable],
  host: {
    class: 'flex-1 overflow-y-auto px-6 py-4 text-sm text-fg',
  },
})
export class SheetContentDirective {}

/** Horizontal alignment for sheet action buttons. */
export type SheetActionsAlign = 'start' | 'center' | 'end';

/**
 * Bottom action bar of a sheet. Use inside the sheet content or template to
 * host Cancel/Confirm buttons. Stays pinned below scrollable content.
 */
@Directive({
  selector: '[twSheetActions], tw-sheet-actions',
  host: {
    '[class]': 'classes()',
  },
})
export class SheetActionsDirective {
  /** Horizontal alignment of the action buttons. Defaults to `'end'`. */
  readonly align = input<SheetActionsAlign>('end');

  protected readonly classes = computed(() => {
    const align = this.align();
    const justify =
      align === 'start' ? 'justify-start' : align === 'center' ? 'justify-center' : 'justify-end';
    return `flex flex-wrap items-center gap-2 px-6 py-4 border-t border-border-muted ${justify}`;
  });
}

/**
 * Closes the enclosing sheet when the host button is clicked. Provide a
 * `[twSheetClose]` value to pass a result to `afterClosed()` subscribers.
 */
@Directive({
  selector: '[twSheetClose]',
  host: {
    '(click)': 'onClick()',
    '[attr.type]': 'type()',
  },
})
export class SheetCloseDirective implements OnInit {
  /** Value passed to `afterClosed()` when the button is clicked. */
  readonly twSheetClose = input<unknown>(undefined);

  /** Native button `type`. Defaults to `'button'` to avoid accidental form submission. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sheet = inject(Sheet, { optional: true });
  private sheetRef = inject<SheetRef<unknown, unknown>>(SheetRef, { optional: true });

  ngOnInit(): void {
    if (!this.sheetRef && this.sheet) {
      this.sheetRef = findEnclosingSheet(this.elementRef, this.sheet) ?? null;
    }
  }

  protected onClick(): void {
    this.sheetRef?.close(this.twSheetClose());
  }
}

function findEnclosingSheet(
  elementRef: ElementRef<HTMLElement>,
  sheet: Sheet,
): SheetRef<unknown, unknown> | undefined {
  let parent: HTMLElement | null = elementRef.nativeElement.parentElement;
  while (parent && parent.tagName.toLowerCase() !== 'tw-sheet-container') {
    parent = parent.parentElement;
  }
  if (!parent) return undefined;
  const id = parent.getAttribute('id');
  if (!id) return undefined;
  return sheet.getSheetById(id);
}
