import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  TemplateRef,
  type Type,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import {
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  Overlay,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { CdkPortalOutlet, ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Subscription } from 'rxjs';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';
import {
  POPOVER_DATA,
  POPOVER_REF,
  type PopoverRef,
  type PopoverTemplateContext,
} from './popover-tokens';

// ── Types ──

/** Placement position of the popover relative to its trigger element. */
export type PopoverPosition =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/** Scroll strategy for the popover overlay. */
export type PopoverScrollStrategy = 'reposition' | 'close' | 'block' | 'noop';

/** Backdrop behavior for the popover. */
export type PopoverBackdrop = 'transparent' | 'dimmed' | 'none';

/** Trigger interaction that opens the popover. */
export type PopoverTrigger = 'click' | 'focus' | 'manual';

/** Direction the arrow points toward (derived from resolved overlay position). */
type ArrowDirection = 'top' | 'bottom' | 'left' | 'right';

/** Duration of leave animation in ms (must match _base.css scale-out/fade-out). */
const ANIMATION_DURATION = 120;

// ── Variant config ──

const popoverVariants = tv(
  {
    slots: {
      wrapper: 'relative',
      panel:
        'bg-surface-overlay text-fg text-sm border border-border rounded-lg shadow-md overflow-hidden',
      arrow: 'absolute size-2.5 rotate-45 bg-surface-overlay border border-border',
    },
    variants: {
      size: {
        xs: { panel: 'p-2' },
        sm: { panel: 'p-3' },
        md: { panel: 'p-4' },
        lg: { panel: 'p-6' },
        xl: { panel: 'p-8' },
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

// ── Color accent classes ──

const COLOR_ACCENT_CLASSES: Record<TwColor, string> = {
  primary: 'border-t-2 border-t-primary-500',
  secondary: 'border-t-2 border-t-secondary-500',
  accent: 'border-t-2 border-t-accent-500',
  neutral: 'border-t-2 border-t-neutral-500',
  info: 'border-t-2 border-t-info-500',
  success: 'border-t-2 border-t-success-500',
  warning: 'border-t-2 border-t-warning-500',
  error: 'border-t-2 border-t-error-500',
};

// ── Position mappings ──

function buildPositionMap(offset: number): Record<PopoverPosition, ConnectedPosition> {
  return {
    top: {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -offset,
    },
    'top-start': {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -offset,
    },
    'top-end': {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -offset,
    },
    bottom: {
      originX: 'center',
      originY: 'bottom',
      overlayX: 'center',
      overlayY: 'top',
      offsetY: offset,
    },
    'bottom-start': {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: offset,
    },
    'bottom-end': {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: offset,
    },
    left: {
      originX: 'start',
      originY: 'center',
      overlayX: 'end',
      overlayY: 'center',
      offsetX: -offset,
    },
    'left-start': {
      originX: 'start',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'top',
      offsetX: -offset,
    },
    'left-end': {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetX: -offset,
    },
    right: {
      originX: 'end',
      originY: 'center',
      overlayX: 'start',
      overlayY: 'center',
      offsetX: offset,
    },
    'right-start': {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
      offsetX: offset,
    },
    'right-end': {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetX: offset,
    },
  };
}

const FALLBACK_ORDER: Record<string, PopoverPosition[]> = {
  top: ['bottom', 'left', 'right'],
  bottom: ['top', 'left', 'right'],
  left: ['right', 'top', 'bottom'],
  right: ['left', 'top', 'bottom'],
};

function buildPositions(
  preferred: PopoverPosition,
  offset: number,
): ConnectedPosition[] {
  const positionMap = buildPositionMap(offset);
  const primary = preferred.split('-')[0];
  const positions = [positionMap[preferred]];
  const fallbacks = FALLBACK_ORDER[primary] ?? FALLBACK_ORDER['top'];
  for (const fb of fallbacks) {
    positions.push(positionMap[fb]);
  }
  return positions;
}

function resolveArrowDirection(position: ConnectedPosition): ArrowDirection {
  if (position.overlayY === 'bottom') return 'bottom';
  if (position.overlayY === 'top') return 'top';
  if (position.overlayX === 'end') return 'right';
  return 'left';
}

/** Arrow position classes keyed by which side the arrow sits on. */
const ARROW_POSITION_CLASSES: Record<ArrowDirection, string> = {
  bottom: 'left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 border-t-0 border-l-0',
  top: 'left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 border-b-0 border-r-0',
  right: 'top-1/2 -translate-y-1/2 right-0 translate-x-1/2 border-b-0 border-l-0',
  left: 'top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 border-t-0 border-r-0',
};

// ── Internal overlay component (not exported) ──

let nextPopoverId = 0;

@Component({
  selector: 'tw-popover-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkPortalOutlet],
  host: {
    class: 'origin-center',
    '[id]': 'id',
    '[attr.role]': '"dialog"',
    '[attr.aria-modal]': 'ariaModal() ? "true" : null',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'computedAriaLabelledBy()',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': '"scale-out"',
  },
  template: `
    <div [class]="wrapperClasses()">
      <div [class]="panelClasses()">
        <ng-template [cdkPortalOutlet]="portal()" />
      </div>
      @if (showArrow()) {
        <span [class]="arrowClasses()" aria-hidden="true"></span>
      }
    </div>
  `,
})
class PopoverOverlayComponent {
  readonly id = `tw-popover-${nextPopoverId++}`;

  readonly size = signal<TwSize>('md');
  readonly color = signal<TwColor | undefined>(undefined);
  readonly showArrow = signal(true);
  readonly arrowDirection = signal<ArrowDirection>('top');
  readonly ariaLabel = signal<string | undefined>(undefined);
  readonly ariaModal = signal(true);
  readonly ariaLabelledByQueue = signal<readonly string[]>([]);
  readonly panelClass = signal<string>('');
  readonly portal = signal<TemplatePortal<PopoverTemplateContext> | ComponentPortal<unknown> | null>(null);

  readonly computedAriaLabelledBy = computed(() => {
    if (this.ariaLabel()) return null;
    return this.ariaLabelledByQueue()[0] ?? null;
  });

  _addAriaLabelledBy(id: string): void {
    this.ariaLabelledByQueue.update((q) => (q.includes(id) ? q : [...q, id]));
  }

  _removeAriaLabelledBy(id: string): void {
    this.ariaLabelledByQueue.update((q) => q.filter((existing) => existing !== id));
  }

  private readonly variantResult = computed(() =>
    popoverVariants({ size: this.size() }),
  );

  readonly wrapperClasses = computed(() => this.variantResult().wrapper());

  readonly panelClasses = computed(() => {
    const base = this.variantResult().panel();
    const colorClass = this.color() ? COLOR_ACCENT_CLASSES[this.color()!] : '';
    const custom = this.panelClass();
    return [base, colorClass, custom].filter(Boolean).join(' ');
  });

  readonly arrowClasses = computed(() => {
    const base = this.variantResult().arrow();
    const position = ARROW_POSITION_CLASSES[this.arrowDirection()];
    return `${base} ${position}`;
  });
}

// ── Popover directive ──

@Directive({
  selector: '[twPopover]',
  exportAs: 'twPopover',
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[attr.aria-expanded]': 'twPopoverOpen()',
    '[attr.aria-controls]': 'overlayComponentId()',
    '(click)': 'onHostClick()',
    '(focus)': 'onHostFocus()',
    '(blur)': 'onHostBlur()',
    '(keydown.escape)': 'onEscape()',
  },
})
export class PopoverDirective {
  /** The content to render. An `ng-template` receives context with `$implicit` (data) and `close` (function). A component class receives data and a ref via injection tokens. */
  readonly twPopover = input.required<
    TemplateRef<PopoverTemplateContext> | Type<unknown>
  >();

  /** Preferred placement relative to the trigger. CDK handles fallback when space is insufficient. Defaults to `'bottom'`. */
  readonly twPopoverPosition = input<PopoverPosition>('bottom');

  /** What user interaction opens the popover. `'manual'` means consumers call `open()`/`close()` programmatically. Defaults to `'click'`. */
  readonly twPopoverTriggerOn = input<PopoverTrigger>('click');

  /** When true, all trigger interactions are suppressed. Defaults to `false`. */
  readonly twPopoverDisabled = input(false);

  /** Two-way bindable open state. Setting to `true` opens the popover; the popover sets it to `false` on close. */
  readonly twPopoverOpen = model(false);

  /** Controls panel padding using the standard spacing scale. Defaults to `'md'`. */
  readonly twPopoverSize = input<TwSize>('md');

  /** Pixel distance between trigger and panel edge. Defaults to `8`. */
  readonly twPopoverOffset = input(8);

  // Default true: the panel reads as a floating callout without the arrow; opt-out
  // is intended for compact iconic triggers where the arrow would crowd the layout.
  /** Whether to render a directional arrow pointing at the trigger. Defaults to `true`. */
  readonly twPopoverArrow = input(true);

  /** Backdrop behavior. `'transparent'` catches outside clicks invisibly. `'dimmed'` adds a semi-transparent overlay. `'none'` disables the backdrop. Defaults to `'transparent'`. */
  readonly twPopoverBackdrop = input<PopoverBackdrop>('transparent');

  // Default true: clicking away is the universal dismiss gesture for floating panels;
  // opt-out is for popovers that own multi-step flows the user must complete.
  /** Whether clicking outside the panel closes the popover. Only relevant when backdrop is `'none'`. Defaults to `true`. */
  readonly twPopoverCloseOnOutside = input(true);

  // Default true: WAI-ARIA dialog pattern mandates Escape closes; opt-out is for
  // popovers that own a child layer (nested dialog/menu) that should consume Escape first.
  /** Whether pressing Escape closes the popover. Defaults to `true`. */
  readonly twPopoverCloseOnEscape = input(true);

  /** CDK scroll strategy for the overlay. Defaults to `'reposition'`. */
  readonly twPopoverScrollStrategy = input<PopoverScrollStrategy>('reposition');

  // Default true: matches the role="dialog" baseline — a focus-trapped panel announces
  // itself as modal-ish; opt-out for inline popovers acting as informational tooltips.
  /** Whether to trap focus inside the popover panel using CDK FocusTrapFactory. Defaults to `true`. */
  readonly twPopoverTrapFocus = input(true);

  /** Arbitrary data passed to template context or component via `POPOVER_DATA` token. */
  readonly twPopoverData = input<unknown>(undefined);

  /** Additional CSS classes applied to the overlay panel for consumer customization. */
  readonly twPopoverPanelClass = input<string | string[]>('');

  /** Optional semantic color. When set, adds a colored top border accent to the panel. */
  readonly twPopoverColor = input<TwColor | undefined>(undefined);

  /** Explicit `aria-label` for the dialog panel. */
  readonly twPopoverAriaLabel = input<string | undefined>(undefined);

  /** Fires after the popover becomes visible. */
  readonly twPopoverOpened = output<void>();

  /** Fires after the popover is fully removed. */
  readonly twPopoverClosed = output<void>();

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  private overlayRef: OverlayRef | null = null;
  private popoverInstance: PopoverOverlayComponent | null = null;
  private focusTrap: ReturnType<FocusTrapFactory['create']> | null = null;
  private perOpenSubs: Subscription | null = null;
  private closing = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  /** Tracked focus-blur close timer; cleared on destroy so it can't fire post-teardown. */
  private blurCloseTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly overlayId = signal<string | null>(null);

  /** The overlay component's id for aria-controls binding. */
  protected readonly overlayComponentId = computed(() => this.overlayId());

  constructor() {
    // React to model changes from the parent
    effect(() => {
      const isOpen = this.twPopoverOpen();
      const disabled = this.twPopoverDisabled();
      if (disabled && this.popoverInstance) {
        this.closePopover();
        return;
      }
      if (isOpen && !this.popoverInstance && !disabled && !this.closing) {
        this.openPopover();
      } else if (!isOpen && this.popoverInstance) {
        this.closePopover();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearCloseTimer();
      if (this.blurCloseTimer !== null) {
        clearTimeout(this.blurCloseTimer);
        this.blurCloseTimer = null;
      }
      this.destroyFocusTrap();
      this.perOpenSubs?.unsubscribe();
      this.disposeOverlay();
    });
  }

  /** Programmatically open the popover. */
  open(): void {
    if (this.twPopoverDisabled() || this.popoverInstance || this.closing) return;
    this.twPopoverOpen.set(true);
  }

  /** Programmatically close the popover. */
  close(): void {
    if (!this.popoverInstance && !this.closing) return;
    this.twPopoverOpen.set(false);
  }

  /** Toggle open/close. */
  toggle(): void {
    if (this.popoverInstance || this.closing) {
      this.close();
    } else {
      this.open();
    }
  }

  /** Force CDK to recalculate overlay position. */
  reposition(): void {
    this.overlayRef?.updatePosition();
  }

  // ── Host event handlers ──

  protected onHostClick(): void {
    if (this.twPopoverTriggerOn() === 'click') {
      this.toggle();
    }
  }

  protected onHostFocus(): void {
    if (this.twPopoverTriggerOn() === 'focus') {
      this.open();
    }
  }

  protected onHostBlur(): void {
    if (this.twPopoverTriggerOn() === 'focus') {
      if (this.blurCloseTimer !== null) clearTimeout(this.blurCloseTimer);
      this.blurCloseTimer = setTimeout(() => {
        this.blurCloseTimer = null;
        const activeEl = document.activeElement;
        const overlayEl = this.overlayRef?.overlayElement;
        if (overlayEl && overlayEl.contains(activeEl)) return;
        this.close();
      });
    }
  }

  protected onEscape(): void {
    if (this.twPopoverCloseOnEscape() && this.popoverInstance) {
      this.close();
    }
  }

  // ── Private ──

  private openPopover(): void {
    this.ensureOverlay();
    this.updatePositionStrategy();
    this.attachContent();
    this.subscribePerOpen();
    this.overlayId.set(this.popoverInstance?.id ?? null);
    this.setupFocusTrap();
    this.twPopoverOpened.emit();
  }

  private closePopover(): void {
    if (this.closing) return;
    this.closing = true;

    // Restore focus to the trigger UNLESS the consumer has deliberately moved
    // focus to a different focusable element outside the overlay. We detect
    // that by checking whether the active element is a real focusable target
    // outside the overlay — body/null means focus is "unset" and we should
    // still restore (the typical case after Escape or backdrop click).
    const overlayEl = this.overlayRef?.overlayElement;
    const activeEl = document.activeElement as HTMLElement | null;
    const focusOutsideOverlayIntentionally =
      !!activeEl &&
      activeEl !== document.body &&
      activeEl !== this.elementRef.nativeElement &&
      !overlayEl?.contains(activeEl);

    // 1. Destroy focus trap so focus can leave
    this.destroyFocusTrap();

    // 2. Return focus to trigger only when appropriate
    if (!focusOutsideOverlayIntentionally) {
      this.elementRef.nativeElement.focus();
    }

    // 3. Wait for leave animation, then detach
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;

      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }

      this.perOpenSubs?.unsubscribe();
      this.perOpenSubs = null;
      this.popoverInstance = null;
      this.overlayId.set(null);

      // Use untracked to prevent effect re-trigger
      untracked(() => this.twPopoverOpen.set(false));

      this.twPopoverClosed.emit();
      this.closing = false;
    }, ANIMATION_DURATION);
  }

  private currentPositionStrategy: FlexibleConnectedPositionStrategy | null = null;

  private buildPositionStrategy(): FlexibleConnectedPositionStrategy {
    const positions = buildPositions(
      this.twPopoverPosition(),
      this.twPopoverOffset(),
    );

    return this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8);
  }

  private ensureOverlay(): void {
    if (this.overlayRef) return;

    const positionStrategy = this.buildPositionStrategy();
    this.currentPositionStrategy = positionStrategy;

    const backdrop = this.twPopoverBackdrop();
    const hasBackdrop = backdrop !== 'none';
    const backdropClass =
      backdrop === 'dimmed' ? 'bg-black/20' : 'cdk-overlay-transparent-backdrop';

    const scrollStrategy = this.resolveScrollStrategy();

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy,
      hasBackdrop,
      backdropClass,
      panelClass: 'tw-popover-panel',
    });
  }

  private updatePositionStrategy(): void {
    if (!this.overlayRef) return;
    const positionStrategy = this.buildPositionStrategy();
    this.currentPositionStrategy = positionStrategy;
    this.overlayRef.updatePositionStrategy(positionStrategy);
  }

  private subscribePerOpen(): void {
    this.perOpenSubs?.unsubscribe();
    this.perOpenSubs = new Subscription();

    const backdrop = this.twPopoverBackdrop();
    const hasBackdrop = backdrop !== 'none';

    // Backdrop click closes
    if (hasBackdrop) {
      this.perOpenSubs.add(
        this.overlayRef!.backdropClick().subscribe(() => this.close()),
      );
    }

    // Outside pointer events when no backdrop
    if (!hasBackdrop && this.twPopoverCloseOnOutside()) {
      this.perOpenSubs.add(
        this.overlayRef!.outsidePointerEvents().subscribe(() => this.close()),
      );
    }

    // Escape from within the overlay
    this.perOpenSubs.add(
      this.overlayRef!.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape' && this.twPopoverCloseOnEscape()) {
          this.close();
        }
      }),
    );

    // Per-open position change subscription — torn down on close to prevent
    // accumulation when the directive is opened/closed many times.
    if (this.currentPositionStrategy) {
      this.perOpenSubs.add(
        this.currentPositionStrategy.positionChanges.subscribe((change) => {
          if (this.popoverInstance) {
            const dir = resolveArrowDirection(change.connectionPair);
            this.popoverInstance.arrowDirection.set(dir);
          }
        }),
      );
    }
  }

  private attachContent(): void {
    const content = this.twPopover();

    // Attach the internal overlay component
    const overlayPortal = new ComponentPortal(
      PopoverOverlayComponent,
      this.viewContainerRef,
    );
    const componentRef = this.overlayRef!.attach(overlayPortal);
    this.popoverInstance = componentRef.instance;

    // Configure the overlay component
    this.popoverInstance.size.set(this.twPopoverSize());
    this.popoverInstance.color.set(this.twPopoverColor());
    this.popoverInstance.showArrow.set(this.twPopoverArrow());
    this.popoverInstance.ariaLabel.set(this.twPopoverAriaLabel());
    this.popoverInstance.ariaModal.set(this.twPopoverTrapFocus());
    this.popoverInstance.ariaLabelledByQueue.set([]);
    this.popoverInstance.panelClass.set(this.resolvePanelClass());

    // Provide POPOVER_REF for both template and component content. Title directives
    // call _addAriaLabelledBy / _removeAriaLabelledBy to register their id with the
    // overlay's aria-labelledby queue.
    const overlayInstance = this.popoverInstance;
    const popoverRef: PopoverRef = {
      close: () => this.close(),
      _addAriaLabelledBy: (id) => overlayInstance._addAriaLabelledBy(id),
      _removeAriaLabelledBy: (id) => overlayInstance._removeAriaLabelledBy(id),
    };

    // Create the content portal
    if (content instanceof TemplateRef) {
      const context: PopoverTemplateContext = {
        $implicit: this.twPopoverData(),
        close: () => this.close(),
      };
      const templateInjector = Injector.create({
        parent: this.injector,
        providers: [
          { provide: POPOVER_DATA, useValue: this.twPopoverData() },
          { provide: POPOVER_REF, useValue: popoverRef },
        ],
      });
      const templatePortal = new TemplatePortal(
        content,
        this.viewContainerRef,
        context,
        templateInjector,
      );
      this.popoverInstance.portal.set(templatePortal);
    } else {
      const contentInjector = Injector.create({
        parent: this.injector,
        providers: [
          { provide: POPOVER_DATA, useValue: this.twPopoverData() },
          { provide: POPOVER_REF, useValue: popoverRef },
        ],
      });
      const componentPortal = new ComponentPortal(
        content,
        this.viewContainerRef,
        contentInjector,
      );
      this.popoverInstance.portal.set(componentPortal);
    }
  }

  private setupFocusTrap(): void {
    if (!this.twPopoverTrapFocus() || !this.overlayRef) return;
    const overlayEl = this.overlayRef.overlayElement;
    this.focusTrap = this.focusTrapFactory.create(overlayEl);
    this.focusTrap.focusInitialElementWhenReady();
  }

  private destroyFocusTrap(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;
  }

  private disposeOverlay(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.popoverInstance = null;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private resolveScrollStrategy() {
    const strategy = this.twPopoverScrollStrategy();
    switch (strategy) {
      case 'close':
        return this.overlay.scrollStrategies.close();
      case 'block':
        return this.overlay.scrollStrategies.block();
      case 'noop':
        return this.overlay.scrollStrategies.noop();
      default:
        return this.overlay.scrollStrategies.reposition();
    }
  }

  private resolvePanelClass(): string {
    const raw = this.twPopoverPanelClass();
    return Array.isArray(raw) ? raw.join(' ') : raw;
  }
}
