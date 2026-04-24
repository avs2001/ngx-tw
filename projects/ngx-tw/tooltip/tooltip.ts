import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  type ConnectedPosition,
  Overlay,
  type OverlayRef,
  ScrollDispatcher,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { AriaDescriber } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwColor } from 'ngx-tw/core';

/** Placement position of the tooltip relative to its trigger element. */
export type TooltipPosition =
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

/** Size scale for the tooltip. */
export type TooltipSize = 'sm' | 'md' | 'lg';

/** Direction the arrow points toward (derived from resolved overlay position). */
type ArrowDirection = 'top' | 'bottom' | 'left' | 'right';

// ── Variant config ──

const tooltipVariants = tv(
  {
    slots: {
      wrapper: 'relative z-50 pointer-events-none',
      panel: 'rounded-md shadow-sm',
      arrow: 'absolute size-2 rotate-45',
    },
    variants: {
      color: {
        primary: {
          panel: 'bg-primary-700 text-white',
          arrow: 'bg-primary-700',
        },
        secondary: {
          panel: 'bg-secondary-700 text-white',
          arrow: 'bg-secondary-700',
        },
        accent: {
          panel: 'bg-accent-700 text-white',
          arrow: 'bg-accent-700',
        },
        neutral: {
          wrapper: 'drop-shadow-[0_0_0.5px_var(--color-border)] drop-shadow-sm',
          panel: 'bg-surface-overlay text-fg',
          arrow: 'bg-surface-overlay',
        },
        info: { panel: 'bg-info-700 text-white', arrow: 'bg-info-700' },
        success: {
          panel: 'bg-success-700 text-white',
          arrow: 'bg-success-700',
        },
        warning: {
          panel: 'bg-warning-700 text-white',
          arrow: 'bg-warning-700',
        },
        error: { panel: 'bg-error-700 text-white', arrow: 'bg-error-700' },
      },
      size: {
        sm: {
          panel: 'px-2 py-1 text-xs max-w-48',
        },
        md: {
          panel: 'px-3 py-1.5 text-sm max-w-xs',
        },
        lg: {
          panel: 'px-4 py-2 text-sm max-w-sm',
        },
      },
    },
    defaultVariants: {
      color: 'neutral',
      size: 'md',
    },
  },
  { twMerge: true },
);

// ── Position mappings ──

const POSITION_MAP: Record<TooltipPosition, ConnectedPosition> = {
  top: {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetY: -8,
  },
  'top-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -8,
  },
  'top-end': {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -8,
  },
  bottom: {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetY: 8,
  },
  'bottom-start': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 8,
  },
  'bottom-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 8,
  },
  left: {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -8,
  },
  'left-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'top',
    offsetX: -8,
  },
  'left-end': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetX: -8,
  },
  right: {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: 8,
  },
  'right-start': {
    originX: 'end',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'top',
    offsetX: 8,
  },
  'right-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetX: 8,
  },
};

const FALLBACK_ORDER: Record<string, TooltipPosition[]> = {
  top: ['bottom', 'left', 'right'],
  bottom: ['top', 'left', 'right'],
  left: ['right', 'top', 'bottom'],
  right: ['left', 'top', 'bottom'],
};

function buildPositions(preferred: TooltipPosition): ConnectedPosition[] {
  const primary = preferred.split('-')[0];
  const positions = [POSITION_MAP[preferred]];
  const fallbacks = FALLBACK_ORDER[primary] ?? FALLBACK_ORDER['top'];
  for (const fb of fallbacks) {
    positions.push(POSITION_MAP[fb]);
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
  bottom: 'left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2',
  top: 'left-1/2 -translate-x-1/2 top-0 -translate-y-1/2',
  right: 'top-1/2 -translate-y-1/2 right-0 translate-x-1/2',
  left: 'top-1/2 -translate-y-1/2 left-0 -translate-x-1/2',
};

// ── Internal overlay component (not exported) ──

let nextTooltipId = 0;

@Component({
  selector: 'tw-tooltip-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tooltip',
    '[id]': 'id',
    '[animate.enter]': '"fade-in"',
    '[animate.leave]': '"fade-out"',
  },
  imports: [NgTemplateOutlet],
  template: `
    <div [class]="wrapperClasses()">
      <div [class]="panelClasses()">
        @if (isTemplate()) {
          <ng-container *ngTemplateOutlet="templateContent()" />
        } @else {
          {{ textContent() }}
        }
      </div>
      @if (showArrow()) {
        <span [class]="arrowClasses()" aria-hidden="true"></span>
      }
    </div>
  `,
})
class TooltipOverlayComponent {
  readonly id = `tw-tooltip-${nextTooltipId++}`;

  readonly content = signal<string | TemplateRef<void>>('');
  readonly color = signal<TwColor>('neutral');
  readonly size = signal<TooltipSize>('md');
  readonly showArrow = signal(true);
  readonly arrowDirection = signal<ArrowDirection>('bottom');

  readonly isTemplate = computed(
    () => this.content() instanceof TemplateRef,
  );
  readonly templateContent = computed(
    () => this.content() as TemplateRef<void>,
  );
  readonly textContent = computed(() => this.content() as string);

  private readonly variantResult = computed(() =>
    tooltipVariants({ color: this.color(), size: this.size() }),
  );

  readonly wrapperClasses = computed(() => this.variantResult().wrapper());
  readonly panelClasses = computed(() => this.variantResult().panel());
  readonly arrowClasses = computed(() => {
    const base = this.variantResult().arrow();
    const position = ARROW_POSITION_CLASSES[this.arrowDirection()];
    return `${base} ${position}`;
  });
}

// ── Tooltip directive ──

@Directive({
  selector: '[twTooltip]',
  exportAs: 'twTooltip',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focusin)': 'onFocusIn()',
    '(focusout)': 'onFocusOut()',
    '(keydown.escape)': 'onEscape()',
    '(touchstart)': 'onTouchStart()',
    '(touchend)': 'onTouchEnd()',
  },
})
export class TooltipDirective {
  /** The tooltip content. Strings render as text; TemplateRef renders via ngTemplateOutlet. */
  readonly twTooltip = input.required<string | TemplateRef<void>>();

  /** Preferred placement relative to the trigger. CDK handles fallback. Defaults to `'top'`. */
  readonly twTooltipPosition = input<TooltipPosition>('top');

  /** Semantic color palette for the tooltip. Defaults to `'neutral'`. */
  readonly twTooltipColor = input<TwColor>('neutral');

  /** Controls padding, font size, max-width, and arrow size. Defaults to `'md'`. */
  readonly twTooltipSize = input<TooltipSize>('md');

  /** Milliseconds to wait before showing after trigger. Defaults to `200`. */
  readonly twTooltipShowDelay = input(200);

  /** Milliseconds to wait before hiding after trigger ends. Defaults to `0`. */
  readonly twTooltipHideDelay = input(0);

  /** When true, tooltip never shows. Defaults to `false`. */
  readonly twTooltipDisabled = input(false);

  /** When true, renders an arrow pointing to the trigger. Defaults to `true`. */
  readonly twTooltipArrow = input(true);

  /** Fires when the tooltip becomes visible. */
  readonly twTooltipShown = output<void>();

  /** Fires when the tooltip is fully hidden. */
  readonly twTooltipHidden = output<void>();

  private readonly overlay = inject(Overlay);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ariaDescriber = inject(AriaDescriber);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollDispatcher = inject(ScrollDispatcher);

  private overlayRef: OverlayRef | null = null;
  private tooltipInstance: TooltipOverlayComponent | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollSub: { unsubscribe(): void } | null = null;

  constructor() {
    // Hide immediately when disabled changes to true
    effect(() => {
      if (this.twTooltipDisabled()) {
        this.detach();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearTimers();
      this.removeAriaDescription();
      this.disposeOverlay();
      this.scrollSub?.unsubscribe();
    });
  }

  /** Programmatically show the tooltip. */
  show(): void {
    if (this.twTooltipDisabled() || !this.twTooltip()) return;
    this.clearTimers();
    this.showTimer = setTimeout(
      () => this.createAndShow(),
      this.twTooltipShowDelay(),
    );
  }

  /** Programmatically hide the tooltip. */
  hide(): void {
    this.clearTimers();
    this.hideTimer = setTimeout(
      () => this.detach(),
      this.twTooltipHideDelay(),
    );
  }

  /** Toggle tooltip visibility. */
  toggle(): void {
    if (this.tooltipInstance) {
      this.hide();
    } else {
      this.show();
    }
  }

  // ── Host event handlers ──

  protected onMouseEnter(): void {
    this.show();
  }

  protected onMouseLeave(): void {
    this.hide();
  }

  protected onFocusIn(): void {
    this.show();
  }

  protected onFocusOut(): void {
    this.hide();
  }

  protected onEscape(): void {
    if (this.tooltipInstance) {
      this.detach();
    }
  }

  protected onTouchStart(): void {
    this.show();
  }

  protected onTouchEnd(): void {
    this.hide();
  }

  // ── Private ──

  private createAndShow(): void {
    if (this.tooltipInstance) {
      this.updateTooltip();
      return;
    }

    this.createOverlay();
    const portal = new ComponentPortal(TooltipOverlayComponent);
    const componentRef = this.overlayRef!.attach(portal);
    this.tooltipInstance = componentRef.instance;

    this.updateTooltip();
    this.setAriaDescription();

    this.elementRef.nativeElement.setAttribute(
      'aria-describedby',
      this.tooltipInstance.id,
    );

    this.scrollSub = this.scrollDispatcher
      .ancestorScrolled(this.elementRef, 20)
      .subscribe(() => this.detach());

    this.twTooltipShown.emit();
  }

  private createOverlay(): void {
    if (this.overlayRef) return;

    const positions = buildPositions(this.twTooltipPosition());
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions(positions)
      .withPush(false);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'tw-tooltip-panel',
    });

    positionStrategy.positionChanges.subscribe((change) => {
      if (this.tooltipInstance) {
        const dir = resolveArrowDirection(change.connectionPair);
        this.tooltipInstance.arrowDirection.set(dir);
      }
    });
  }

  private updateTooltip(): void {
    if (!this.tooltipInstance) return;
    this.tooltipInstance.content.set(this.twTooltip());
    this.tooltipInstance.color.set(this.twTooltipColor());
    this.tooltipInstance.size.set(this.twTooltipSize());
    this.tooltipInstance.showArrow.set(this.twTooltipArrow());
  }

  private detach(): void {
    this.clearTimers();
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
    }
    this.tooltipInstance = null;
    this.elementRef.nativeElement.removeAttribute('aria-describedby');
    this.scrollSub?.unsubscribe();
    this.scrollSub = null;
    this.twTooltipHidden.emit();
  }

  private disposeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.tooltipInstance = null;
  }

  private setAriaDescription(): void {
    const content = this.twTooltip();
    if (typeof content === 'string' && content) {
      this.ariaDescriber.describe(
        this.elementRef.nativeElement,
        content,
        'tooltip',
      );
    }
  }

  private removeAriaDescription(): void {
    const content = this.twTooltip();
    if (typeof content === 'string' && content) {
      this.ariaDescriber.removeDescription(
        this.elementRef.nativeElement,
        content,
        'tooltip',
      );
    }
  }

  private clearTimers(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }
}
