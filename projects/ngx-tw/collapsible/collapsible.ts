import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { FocusableOption, FocusKeyManager, LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the collapsible container. */
export type CollapsibleVariant = 'default' | 'bordered' | 'ghost' | 'filled';

/** Decorative axes bundled into a single collapsible input. */
export interface CollapsibleDisplay {
  /** Visual style of the panel container. Defaults to `'default'`. */
  variant?: CollapsibleVariant;
  /** Semantic color; applies to the `bordered` and `filled` variants. Defaults to `'neutral'`. */
  color?: TwColor;
  /** Padding scale for the trigger and content sections. Defaults to `'md'`. */
  size?: TwSize;
}

const DISPLAY_DEFAULTS: Required<CollapsibleDisplay> = {
  variant: 'default',
  color: 'neutral',
  size: 'md',
};

// ── tv() config ──

const collapsibleVariants = tv({
  slots: {
    root: 'block rounded-lg overflow-hidden',
    trigger:
      'flex w-full items-center justify-between gap-3 bg-transparent border-0 appearance-none cursor-pointer text-sm font-medium text-fg transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    icon: 'size-5 shrink-0 text-fg-muted transition-transform duration-normal motion-reduce:transition-none',
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

/**
 * Marks the toggle element inside a `<tw-collapsible>`. Apply this to a
 * native `<button>`; the directive wires up ARIA, keyboard handling, and
 * focus management. Custom hosts (e.g. `<div>`) are not supported.
 */
@Component({
  selector: '[twCollapsibleTrigger]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ViewEncapsulation.None — the directive's host IS the consumer's <button>;
  // scoped styles can't reach a host that lives outside this component's tree.
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.aria-expanded]': 'collapsible.open()',
    '[attr.aria-controls]': 'collapsible.panelId',
    '[attr.aria-disabled]': 'collapsible.disabled() || null',
    '[attr.tabindex]': 'collapsible.disabled() ? -1 : 0',
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
export class CollapsibleTriggerDirective implements FocusableOption {
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

  /** @internal FocusableOption: lets FocusKeyManager skip disabled triggers. */
  get disabled(): boolean {
    return this.collapsible.disabled();
  }

  /** @internal FocusableOption: text label for typeahead navigation. */
  getLabel(): string {
    return this.elementRef.nativeElement.textContent?.trim() ?? '';
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

  /** Bundles decorative axes: `variant`, `color`, `size`. Accepts a partial; unset keys fall back to the defaults (`{ variant: 'default', color: 'neutral', size: 'md' }`). */
  readonly display = input<CollapsibleDisplay>({});

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

  /**
   * @internal Tracks whether the panel has been opened at least once (for keepAlive mode).
   *
   * Latches to `true` the first time `open` is `true` and stays `true` for the
   * lifetime of the component. Implemented as a `linkedSignal` so the derivation
   * lives next to the source — `activated()` reads cleanly as "derived from open".
   */
  readonly activated = linkedSignal<boolean, boolean>({
    source: () => this.open(),
    computation: (open, prev) => (prev?.value ?? false) || open,
  });

  // ── Resolved display config ──

  /** @internal Resolved decorative configuration. */
  readonly resolvedDisplay = computed<Required<CollapsibleDisplay>>(() => ({
    ...DISPLAY_DEFAULTS,
    ...this.display(),
  }));

  // ── Variant classes ──

  private readonly variantResult = computed(() => {
    const { variant, color, size } = this.resolvedDisplay();
    return collapsibleVariants({
      variant,
      color,
      size,
      disabled: this.disabled(),
      inGroup: !!this.group,
    });
  });

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly triggerClasses = computed(() => this.variantResult().trigger());
  readonly iconClasses = computed(() => this.variantResult().icon());
  readonly contentClasses = computed(() => this.variantResult().content());

  readonly contentWrapperClasses = computed(() => {
    const base = this.contentClasses();
    return this.keepAlive() ? `${base} collapsible-keep-alive` : base;
  });

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
    // Use bindings (not static attributes) so subclasses can override the values.
    // Angular DOES inherit host metadata across `extends`; literal-string entries
    // can't be turned off by a subclass, but binding expressions are evaluated
    // against the actual instance and so respect subclass overrides of the
    // backing signal/computed.
    '[attr.role]': 'hostRole()',
    '[class]': 'hostClasses()',
  },
  template: `<ng-content />`,
})
export class CollapsibleGroupComponent {
  /**
   * When true, only one panel can be open at a time.
   *
   * `AccordionComponent` (subclass) ignores this input and drives the same
   * behaviour from its own `type` input via the `isAccordionMode()` /
   * `canCollapseSingleMode()` virtual hooks below. Consumers using
   * `<tw-collapsible-group>` directly should bind this input; consumers using
   * `<tw-accordion>` should bind `type="single"` / `type="multiple"` instead.
   *
   * Defaults to `false`.
   */
  readonly accordion = input(false, { transform: booleanAttribute });

  /** The value(s) of currently open panels. String in accordion mode, string array in independent mode. `null` when no panel is open in accordion mode. Two-way bindable. Defaults to `null`. */
  readonly value = model<string | string[] | null>(null);

  /**
   * @internal Wrapper `role` attribute. Subclasses may override (e.g.
   * `AccordionComponent` returns `null` per APG — accordions don't carry
   * `role="group"`).
   */
  readonly hostRole = computed<string | null>(() => 'group');

  /**
   * @internal Host class string. Subclasses may override to provide their own
   * variant-driven string (e.g. `AccordionComponent.rootClasses`).
   */
  readonly hostClasses = computed(() => 'block rounded-lg overflow-hidden divide-y divide-border');

  /** @internal */
  readonly items = contentChildren(CollapsibleComponent);

  /** @internal */
  readonly triggers = contentChildren(CollapsibleTriggerDirective, { descendants: true });

  private keyManager: FocusKeyManager<CollapsibleTriggerDirective> | null = null;

  /**
   * @internal Whether the group is in single-open-panel mode.
   *
   * Subclasses override to bridge their own input surface (e.g. `AccordionComponent`
   * returns `this.type() === 'single'`). All internal toggle/sync/warn logic reads
   * the mode through this hook, never `accordion()` directly — that lets the
   * subclass drive mode from `type` without redeclaring the parent's signal input.
   */
  protected isAccordionMode(): boolean {
    return this.accordion();
  }

  /**
   * @internal Whether re-clicking the open panel in single mode closes it.
   *
   * Defaults to `true` for the bare group component (re-clicking always closes).
   * `AccordionComponent` overrides to honour its `collapsible` opt-out input.
   */
  protected canCollapseSingleMode(): boolean {
    return true;
  }

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

      // Read mode via the virtual hook so subclass overrides take effect.
      const accordion = this.isAccordionMode();

      if (isDevMode()) {
        if (accordion && Array.isArray(val)) {
          console.warn(
            '[tw-collapsible-group] `value` is an array but the group is in accordion mode. Use a single string (or null) in accordion mode.',
          );
        } else if (!accordion && typeof val === 'string' && val !== '') {
          console.warn(
            '[tw-collapsible-group] `value` is a string but the group is in independent mode. Use a string[] in independent mode.',
          );
        }
      }

      untracked(() => {
        for (const item of items) {
          const itemValue = item.value();
          if (accordion) {
            item.setOpen(itemValue === val);
          } else {
            const openValues = Array.isArray(val) ? val : [];
            item.setOpen(openValues.includes(itemValue));
          }
        }
      });
    });

    // Rebuild FocusKeyManager whenever the trigger set changes
    effect((onCleanup) => {
      const triggers = this.triggers();
      if (triggers.length === 0) {
        this.keyManager = null;
        return;
      }
      this.keyManager = new FocusKeyManager(triggers)
        .withWrap()
        .withHomeAndEnd()
        .withVerticalOrientation()
        .withTypeAhead();

      onCleanup(() => {
        this.keyManager?.destroy();
      });
    });
  }

  private syncChildrenFromValue(): void {
    const val = this.value();
    const items = this.items();
    const accordion = this.isAccordionMode();
    for (const item of items) {
      const itemValue = item.value();
      if (accordion) {
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

    if (this.isAccordionMode()) {
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
        // Close this one — honour the subclass's collapsible opt-out, if any.
        if (!this.canCollapseSingleMode()) return;
        item.setOpen(false);
        this.value.set(null);
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
    if (!this.keyManager) return;

    // Sync active item with the currently focused trigger.
    // Use event.target (not document.activeElement) so this works under shadow DOM.
    const triggers = this.triggers();
    const focusedIdx = triggers.findIndex(
      t => t.elementRef.nativeElement === event.target,
    );
    if (focusedIdx >= 0 && focusedIdx !== this.keyManager.activeItemIndex) {
      this.keyManager.setActiveItem(focusedIdx);
    }

    this.keyManager.onKeydown(event);
  }
}
