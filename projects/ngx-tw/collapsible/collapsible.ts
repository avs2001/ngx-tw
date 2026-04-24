import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the collapsible container. */
export type CollapsibleVariant = 'default' | 'bordered' | 'ghost' | 'filled';

// ── tv() config ──

const collapsibleVariants = tv({
  slots: {
    root: 'block rounded-lg overflow-hidden',
    trigger:
      'flex w-full items-center justify-between gap-3 bg-transparent border-0 appearance-none cursor-pointer text-sm font-medium text-fg transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    icon: 'size-5 shrink-0 text-fg-muted transition-transform duration-200 motion-reduce:transition-none',
    content: 'text-sm text-fg',
  },
  variants: {
    variant: {
      default: {
        root: 'border-b border-border',
        trigger: 'hover:bg-surface-muted',
      },
      bordered: {
        root: 'border border-border',
        trigger: 'hover:bg-surface-muted',
        content: 'border-t border-border',
      },
      ghost: {
        root: '',
        trigger: 'hover:bg-surface-muted rounded-md',
      },
      filled: {
        root: '',
      },
    },
    size: {
      xs: { trigger: 'px-2 py-1 text-xs', content: 'p-2' },
      sm: { trigger: 'px-3 py-1.5 text-sm', content: 'p-3' },
      md: { trigger: 'px-4 py-2 text-sm', content: 'p-4' },
      lg: { trigger: 'px-5 py-2.5 text-base', content: 'p-6' },
      xl: { trigger: 'px-6 py-3 text-base', content: 'p-8' },
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
    disabled: {
      true: { root: 'opacity-50 pointer-events-none' },
      false: {},
    },
    inGroup: {
      true: { root: 'rounded-none border-b-0 border-0' },
      false: {},
    },
  },
  compoundVariants: [
    // ── Filled + color ──
    { variant: 'filled', color: 'primary', class: { root: 'bg-primary-50', trigger: 'text-primary-800 hover:bg-primary-100', content: 'text-primary-700', icon: 'text-primary-600' } },
    { variant: 'filled', color: 'secondary', class: { root: 'bg-secondary-50', trigger: 'text-secondary-800 hover:bg-secondary-100', content: 'text-secondary-700', icon: 'text-secondary-600' } },
    { variant: 'filled', color: 'accent', class: { root: 'bg-accent-50', trigger: 'text-accent-800 hover:bg-accent-100', content: 'text-accent-700', icon: 'text-accent-600' } },
    { variant: 'filled', color: 'neutral', class: { root: 'bg-surface-muted', trigger: 'text-fg hover:bg-surface-sunken', content: 'text-fg-muted' } },
    { variant: 'filled', color: 'info', class: { root: 'bg-info-50', trigger: 'text-info-800 hover:bg-info-100', content: 'text-info-700', icon: 'text-info-600' } },
    { variant: 'filled', color: 'success', class: { root: 'bg-success-50', trigger: 'text-success-800 hover:bg-success-100', content: 'text-success-700', icon: 'text-success-600' } },
    { variant: 'filled', color: 'warning', class: { root: 'bg-warning-50', trigger: 'text-warning-800 hover:bg-warning-100', content: 'text-warning-700', icon: 'text-warning-600' } },
    { variant: 'filled', color: 'error', class: { root: 'bg-error-50', trigger: 'text-error-800 hover:bg-error-100', content: 'text-error-700', icon: 'text-error-600' } },

    // ── Bordered + color ──
    { variant: 'bordered', color: 'primary', class: { root: 'border-primary-300' } },
    { variant: 'bordered', color: 'secondary', class: { root: 'border-secondary-300' } },
    { variant: 'bordered', color: 'accent', class: { root: 'border-accent-300' } },
    { variant: 'bordered', color: 'info', class: { root: 'border-info-300' } },
    { variant: 'bordered', color: 'success', class: { root: 'border-success-300' } },
    { variant: 'bordered', color: 'warning', class: { root: 'border-warning-300' } },
    { variant: 'bordered', color: 'error', class: { root: 'border-error-300' } },
  ],
  defaultVariants: {
    variant: 'default',
    color: 'neutral',
    size: 'md',
    disabled: false,
    inGroup: false,
  },
}, {
  twMerge: true,
});

// ── Unique ID counter ──
let nextId = 0;

// ── CollapsibleIconDirective ──

@Directive({
  selector: '[twCollapsibleIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class CollapsibleIconDirective {
  private readonly collapsible = inject(CollapsibleComponent);

  /** @internal */
  readonly classes = computed(() => {
    const base = this.collapsible.iconClasses();
    return this.collapsible.open() ? `${base} rotate-180` : base;
  });
}

// ── CollapsibleTriggerDirective ──

@Component({
  selector: '[twCollapsibleTrigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'role': 'button',
    '[class]': 'classes()',
    '[attr.aria-expanded]': 'collapsible.open()',
    '[attr.aria-controls]': 'collapsible.panelId',
    '[attr.aria-disabled]': 'collapsible.disabled() || null',
    '[attr.tabindex]': '0',
    '[attr.id]': 'collapsible.triggerId',
    '(click)': 'onClick()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <ng-content />
    @if (!collapsible.customIcon()) {
      <svg [class]="iconClasses()" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    }
  `,
})
export class CollapsibleTriggerDirective {
  /** @internal */
  readonly collapsible = inject(CollapsibleComponent);
  readonly elementRef = inject(ElementRef<HTMLElement>);

  /** @internal */
  readonly classes = this.collapsible.triggerClasses;

  /** @internal */
  readonly iconClasses = computed(() => {
    const base = this.collapsible.iconClasses();
    return this.collapsible.open() ? `${base} rotate-180` : base;
  });

  onClick(): void {
    this.collapsible.toggle();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.collapsible.toggle();
      return;
    }

    // Delegate arrow key navigation to group
    const group = this.collapsible.group;
    if (group) {
      group.onTriggerKeydown(event);
    }
  }

  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}

// ── CollapsibleComponent ──

@Component({
  selector: 'tw-collapsible',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    <ng-content select="[twCollapsibleTrigger]" />
    @if (keepAlive() ? activated() : open()) {
      <div [class]="contentWrapperClasses()"
           [attr.data-open]="open()"
           [attr.id]="panelId"
           [attr.aria-labelledby]="triggerId"
           role="region"
           [animate.enter]="'collapsible-enter'"
           [animate.leave]="keepAlive() ? '' : 'collapsible-leave'">
        <div class="overflow-hidden">
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class CollapsibleComponent {
  /** Unique identifier for this panel. Required when used inside a group. */
  readonly value = input<string>('');

  /** Controls the visual style. Defaults to `'default'`. */
  readonly variant = input<CollapsibleVariant>('default');

  /** Sets the semantic color. Applies to `bordered` and `filled` variants. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** Controls padding of trigger and content sections. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, the panel cannot be toggled and appears dimmed. Defaults to `false`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** When true, content is rendered on first open and kept in the DOM across toggles. Defaults to `false`. */
  readonly keepAlive = input(false, { transform: booleanAttribute });

  /** Whether the panel is expanded. Two-way bindable. Defaults to `false`. */
  readonly open = model(false);

  /** Fires after the panel is toggled. Payload is the new open state. */
  readonly toggled = output<boolean>();

  /** @internal */
  readonly group = inject(CollapsibleGroupComponent, { optional: true });
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  /** @internal */
  readonly customIcon = contentChild(CollapsibleIconDirective);

  private readonly componentId = `tw-collapsible-${nextId++}`;
  readonly triggerId = `${this.componentId}-trigger`;
  readonly panelId = `${this.componentId}-panel`;

  /** @internal Tracks whether the panel has been opened at least once (for keepAlive mode). */
  readonly activated = signal(false);

  // ── Variant classes ──

  private readonly variantResult = computed(() =>
    collapsibleVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      disabled: this.disabled(),
      inGroup: !!this.group,
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly triggerClasses = computed(() => this.variantResult().trigger());
  readonly iconClasses = computed(() => this.variantResult().icon());
  readonly contentClasses = computed(() => this.variantResult().content());

  readonly contentWrapperClasses = computed(() => {
    const base = this.contentClasses();
    return this.keepAlive() ? `${base} collapsible-keep-alive` : base;
  });

  constructor() {
    // Track activation for keepAlive mode
    effect(() => {
      if (this.open() && !this.activated()) {
        this.activated.set(true);
      }
    });
  }

  /** @internal Toggle the open state. Called by the trigger directive. */
  toggle(): void {
    if (this.disabled()) return;

    if (this.group) {
      this.group.toggleItem(this);
    } else {
      const next = !this.open();
      this.open.set(next);
      this.toggled.emit(next);
      this.announceState(next);
    }
  }

  /** @internal Set the open state programmatically (used by group). */
  setOpen(value: boolean): void {
    this.open.set(value);
  }

  /** @internal */
  announceState(isOpen: boolean): void {
    this.liveAnnouncer.announce(
      isOpen ? 'Section expanded' : 'Section collapsed',
    );
  }
}

// ── CollapsibleGroupComponent ──

@Component({
  selector: 'tw-collapsible-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'group',
    '[class]': 'hostClasses()',
  },
  template: `<ng-content />`,
})
export class CollapsibleGroupComponent {
  /** When true, only one panel can be open at a time. Defaults to `false`. */
  readonly accordion = input(false, { transform: booleanAttribute });

  /** The value(s) of currently open panels. String in accordion mode, string array in independent mode. Two-way bindable. */
  readonly value = model<string | string[]>('');

  /** @internal */
  readonly hostClasses = computed(() => 'block rounded-lg overflow-hidden divide-y divide-border');

  private readonly destroyRef = inject(DestroyRef);

  /** @internal */
  readonly items = contentChildren(CollapsibleComponent);

  /** @internal */
  readonly triggers = contentChildren(CollapsibleTriggerDirective, { descendants: true });

  constructor() {
    // Sync children open states from the group value
    afterNextRender(() => {
      this.syncChildrenFromValue();
    });

    // Watch for value changes and sync children
    effect(() => {
      const val = this.value();
      const items = this.items();
      if (items.length === 0) return;

      for (const item of items) {
        const itemValue = item.value();
        if (this.accordion()) {
          item.setOpen(itemValue === val);
        } else {
          const openValues = Array.isArray(val) ? val : [];
          item.setOpen(openValues.includes(itemValue));
        }
      }
    });
  }

  private syncChildrenFromValue(): void {
    const val = this.value();
    const items = this.items();
    for (const item of items) {
      const itemValue = item.value();
      if (this.accordion()) {
        item.setOpen(itemValue === val);
      } else {
        const openValues = Array.isArray(val) ? val : [];
        item.setOpen(openValues.includes(itemValue));
      }
    }
  }

  /** @internal Called by a child collapsible when it is toggled. */
  toggleItem(item: CollapsibleComponent): void {
    const itemValue = item.value();
    const isCurrentlyOpen = item.open();
    const next = !isCurrentlyOpen;

    if (this.accordion()) {
      if (next) {
        // Close all others, open this one
        for (const child of this.items()) {
          if (child !== item) {
            child.setOpen(false);
          }
        }
        item.setOpen(true);
        this.value.set(itemValue);
      } else {
        // Close this one
        item.setOpen(false);
        this.value.set('');
      }
    } else {
      // Independent mode
      item.setOpen(next);
      const currentOpen = this.items()
        .filter(i => i.open())
        .map(i => i.value());
      this.value.set(currentOpen);
    }

    item.toggled.emit(next);
    item.announceState(next);
  }

  /** @internal Handle keyboard navigation within the group. */
  onTriggerKeydown(event: KeyboardEvent): void {
    const triggers = this.triggers();
    if (triggers.length === 0) return;

    const currentIndex = triggers.findIndex(
      t => t.elementRef.nativeElement === document.activeElement,
    );

    let targetIndex = -1;

    switch (event.key) {
      case 'ArrowDown':
        targetIndex = this.findNextEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowUp':
        targetIndex = this.findNextEnabledIndex(currentIndex, -1);
        break;
      case 'Home':
        targetIndex = this.findFirstEnabledIndex();
        break;
      case 'End':
        targetIndex = this.findLastEnabledIndex();
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      triggers[targetIndex].focus();
    }
  }

  private findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const items = this.items();
    const len = items.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!items[idx].disabled()) return idx;
    }
    return -1;
  }

  private findFirstEnabledIndex(): number {
    return this.items().findIndex(item => !item.disabled());
  }

  private findLastEnabledIndex(): number {
    const items = this.items();
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled()) return i;
    }
    return -1;
  }
}
