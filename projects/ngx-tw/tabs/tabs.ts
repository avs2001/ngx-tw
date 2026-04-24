import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
  type AfterViewInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the tab strip. */
export type TabsVariant = 'underline' | 'enclosed' | 'pill';

// ── tv() config ──

const tabsVariants = tv({
  slots: {
    root: 'flex',
    tablist: 'relative flex shrink-0',
    tablistInner: 'flex overflow-x-auto',
    trigger:
      'inline-flex items-center gap-1.5 font-medium whitespace-nowrap cursor-pointer transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    panel: 'min-w-0 flex-1',
    scrollButton:
      'inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200 motion-reduce:transition-none disabled:opacity-30 disabled:cursor-default hover:bg-surface-muted',
    closeButton:
      'inline-flex items-center justify-center size-4 rounded-md cursor-pointer transition-colors duration-200 motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
  },
  variants: {
    variant: {
      underline: {
        tablist: 'border-b border-border',
        tablistInner: 'gap-0',
        trigger: 'border-b-2 border-transparent -mb-px text-fg-muted hover:text-fg',
        panel: 'pt-4',
      },
      enclosed: {
        tablist: 'border-b border-border',
        tablistInner: 'gap-0',
        trigger:
          'border border-transparent bg-surface-muted text-fg-muted hover:text-fg -mb-px',
        panel: 'pt-4',
      },
      pill: {
        tablist: 'bg-surface-muted rounded-xl p-1',
        tablistInner: 'gap-1',
        trigger: 'rounded-md text-fg-muted hover:text-fg',
        panel: 'pt-4',
      },
    },
    size: {
      xs: {
        trigger: 'px-2 py-1 text-xs',
        scrollButton: 'size-5',
      },
      sm: {
        trigger: 'px-3 py-1.5 text-sm',
        scrollButton: 'size-5',
      },
      md: {
        trigger: 'px-4 py-2 text-sm',
        scrollButton: 'size-6',
      },
      lg: {
        trigger: 'px-5 py-2.5 text-base',
        scrollButton: 'size-7',
      },
      xl: {
        trigger: 'px-6 py-3 text-base',
        scrollButton: 'size-8',
      },
    },
    orientation: {
      horizontal: {
        root: 'flex-col',
        tablist: '',
        tablistInner: 'flex-row',
      },
      vertical: {
        root: 'flex-row',
        tablistInner: 'flex-col overflow-y-auto overflow-x-hidden',
      },
    },
    fitted: {
      true: {
        trigger: 'flex-1 justify-center',
      },
      false: {},
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
    // ── Underline vertical ──
    {
      variant: 'underline',
      orientation: 'vertical',
      class: {
        tablist: 'border-b-0 border-r border-border',
        trigger: 'border-b-0 -mb-0 border-r-2 border-transparent -mr-px',
        panel: 'pt-0 pl-4',
      },
    },
    // ── Enclosed vertical ──
    {
      variant: 'enclosed',
      orientation: 'vertical',
      class: {
        tablist: 'border-b-0 border-r border-border',
        trigger: '-mb-0 -mr-px',
        panel: 'pt-0 pl-4',
      },
    },
    // ── Pill vertical ──
    {
      variant: 'pill',
      orientation: 'vertical',
      class: {
        panel: 'pt-0 pl-4',
      },
    },

    // Active colors are applied dynamically — see getActiveTriggerClasses()
  ],
  defaultVariants: {
    variant: 'underline',
    color: 'primary',
    size: 'md',
    orientation: 'horizontal',
    fitted: false,
  },
}, {
  twMerge: true,
});

// ── Static active trigger class lookups (all classes must be statically written for Tailwind v4) ──

const UNDERLINE_ACTIVE_HORIZONTAL: Record<TwColor, string> = {
  primary: 'border-b-2 border-primary-500 text-primary-600',
  secondary: 'border-b-2 border-secondary-500 text-secondary-600',
  accent: 'border-b-2 border-accent-500 text-accent-600',
  neutral: 'border-b-2 border-border-strong text-fg',
  info: 'border-b-2 border-info-500 text-info-600',
  success: 'border-b-2 border-success-500 text-success-600',
  warning: 'border-b-2 border-warning-500 text-warning-600',
  error: 'border-b-2 border-error-500 text-error-600',
};

const UNDERLINE_ACTIVE_VERTICAL: Record<TwColor, string> = {
  primary: 'border-r-2 border-primary-500 text-primary-600',
  secondary: 'border-r-2 border-secondary-500 text-secondary-600',
  accent: 'border-r-2 border-accent-500 text-accent-600',
  neutral: 'border-r-2 border-border-strong text-fg',
  info: 'border-r-2 border-info-500 text-info-600',
  success: 'border-r-2 border-success-500 text-success-600',
  warning: 'border-r-2 border-warning-500 text-warning-600',
  error: 'border-r-2 border-error-500 text-error-600',
};

const ENCLOSED_ACTIVE_HORIZONTAL: Record<TwColor, string> = {
  primary: 'bg-surface border border-border border-b-transparent text-primary-700',
  secondary: 'bg-surface border border-border border-b-transparent text-secondary-700',
  accent: 'bg-surface border border-border border-b-transparent text-accent-700',
  neutral: 'bg-surface border border-border border-b-transparent text-fg',
  info: 'bg-surface border border-border border-b-transparent text-info-700',
  success: 'bg-surface border border-border border-b-transparent text-success-700',
  warning: 'bg-surface border border-border border-b-transparent text-warning-700',
  error: 'bg-surface border border-border border-b-transparent text-error-700',
};

const ENCLOSED_ACTIVE_VERTICAL: Record<TwColor, string> = {
  primary: 'bg-surface border border-border border-r-transparent text-primary-700',
  secondary: 'bg-surface border border-border border-r-transparent text-secondary-700',
  accent: 'bg-surface border border-border border-r-transparent text-accent-700',
  neutral: 'bg-surface border border-border border-r-transparent text-fg',
  info: 'bg-surface border border-border border-r-transparent text-info-700',
  success: 'bg-surface border border-border border-r-transparent text-success-700',
  warning: 'bg-surface border border-border border-r-transparent text-warning-700',
  error: 'bg-surface border border-border border-r-transparent text-error-700',
};

const PILL_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-surface shadow-sm text-primary-700',
  secondary: 'bg-surface shadow-sm text-secondary-700',
  accent: 'bg-surface shadow-sm text-accent-700',
  neutral: 'bg-surface shadow-sm text-fg',
  info: 'bg-surface shadow-sm text-info-700',
  success: 'bg-surface shadow-sm text-success-700',
  warning: 'bg-surface shadow-sm text-warning-700',
  error: 'bg-surface shadow-sm text-error-700',
};

const INACTIVE_CLASSES: Record<TabsVariant, string> = {
  underline: 'border-transparent',
  enclosed: 'border-transparent bg-surface-muted',
  pill: '',
};

function getActiveTriggerClasses(variant: TabsVariant, color: TwColor, orientation: 'horizontal' | 'vertical'): string {
  switch (variant) {
    case 'underline':
      return orientation === 'vertical'
        ? UNDERLINE_ACTIVE_VERTICAL[color]
        : UNDERLINE_ACTIVE_HORIZONTAL[color];
    case 'enclosed':
      return orientation === 'vertical'
        ? ENCLOSED_ACTIVE_VERTICAL[color]
        : ENCLOSED_ACTIVE_HORIZONTAL[color];
    case 'pill':
      return PILL_ACTIVE[color];
  }
}

function getInactiveTriggerClasses(variant: TabsVariant): string {
  return INACTIVE_CLASSES[variant];
}

// ── Directives ──

@Directive({ selector: 'ng-template[twTabTrigger]' })
export class TabTriggerDirective {
  readonly templateRef = inject(TemplateRef);
}

@Directive({ selector: 'ng-template[twTabContent]' })
export class TabContentDirective {
  readonly templateRef = inject(TemplateRef);
}

// ── TabComponent ──

@Component({
  selector: 'tw-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #implicitContent>
      <ng-content />
    </ng-template>
  `,
  host: {
    'style': 'display: none',
  },
})
export class TabComponent {
  /** Unique identifier for this tab. Used to match the active tab value. */
  readonly value = input.required<string>();

  /** Plain text label shown in the trigger. Ignored when a custom trigger template is provided. */
  readonly label = input('');

  /** When true, the tab cannot be selected and is skipped by keyboard navigation. Defaults to false. */
  readonly disabled = input(false);

  /** When true, a close button is rendered in the tab trigger. Defaults to false. */
  readonly closable = input(false);

  /** When true, the tab panel content is only instantiated when the tab becomes active for the first time. Defaults to false. */
  readonly lazy = input(false);

  /** @internal Custom trigger template, if provided. */
  readonly triggerTemplate = contentChild(TabTriggerDirective);

  /** @internal Custom content template, if provided via twTabContent. */
  readonly contentTemplate = contentChild(TabContentDirective);

  /** @internal Implicit content template wrapping ng-content. */
  readonly implicitContentTemplate = viewChild<TemplateRef<unknown>>('implicitContent');
}

// ── Tab trigger element wrapper ──

@Directive({
  selector: '[twTabTriggerElement]',
  host: {
    '[attr.tabindex]': 'tabIndex()',
  },
})
export class TabTriggerElementDirective {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly isActive = input(false);
  readonly isDisabled = input(false);

  readonly tabIndex = computed(() => this.isActive() ? 0 : -1);

  focus(): void {
    this.elementRef.nativeElement.focus();
  }
}

// ── TabsComponent ──

let nextId = 0;

@Component({
  selector: 'tw-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TabTriggerElementDirective],
  templateUrl: './tabs.html',
  host: {
    '[class]': 'rootClasses()',
  },
})
export class TabsComponent implements AfterViewInit {
  /** Controls the visual style of the tab strip. Defaults to 'underline'. */
  readonly variant = input<TabsVariant>('underline');

  /** Sets the semantic color for active tab indicators and highlights. Defaults to 'primary'. */
  readonly color = input<TwColor>('primary');

  /** Controls padding, font size, and icon size of tab triggers. Defaults to 'md'. */
  readonly size = input<TwSize>('md');

  /** Layout direction of the tab strip. Defaults to 'horizontal'. */
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** When true, tab triggers stretch to fill the available width equally. Defaults to false. */
  readonly fitted = input(false);

  /** The value of the currently active tab. Two-way bound. Updates when the user selects a tab. */
  readonly value = model<string>('');

  /** Fires when a closable tab's close button is clicked. Payload is the tab's value. */
  readonly closed = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  /** @internal */
  readonly tabs = contentChildren(TabComponent);

  /** @internal */
  readonly triggerElements = viewChildren(TabTriggerElementDirective);

  /** @internal */
  readonly tablistInnerRef = viewChild<ElementRef<HTMLElement>>('tablistInner');

  private readonly componentId = `tw-tabs-${nextId++}`;

  // ── Active tab tracking ──

  readonly activeValue = linkedSignal(() => this.value());

  // ── Lazy tab tracking — Set of tab values that have been activated at least once ──
  readonly activatedTabs = signal(new Set<string>());

  // ── Scroll overflow signals ──
  readonly canScrollStart = signal(false);
  readonly canScrollEnd = signal(false);

  private resizeObserver: ResizeObserver | null = null;
  private scrollCleanup: (() => void) | null = null;

  // ── Variant classes ──

  private readonly variantResult = computed(() =>
    tabsVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      orientation: this.orientation(),
      fitted: this.fitted(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly tablistClasses = computed(() => this.variantResult().tablist());
  readonly tablistInnerClasses = computed(() => this.variantResult().tablistInner());
  readonly baseTriggerClasses = computed(() => this.variantResult().trigger());
  readonly panelClasses = computed(() => this.variantResult().panel());
  readonly scrollButtonClasses = computed(() => this.variantResult().scrollButton());
  readonly closeButtonClasses = computed(() => this.variantResult().closeButton());

  // ── Per-trigger active/inactive class computation ──

  /** @internal Get combined trigger classes for a given tab. */
  getTriggerClasses(tabValue: string, isActive: boolean): string {
    const base = this.baseTriggerClasses();
    const extra = isActive
      ? getActiveTriggerClasses(this.variant(), this.color(), this.orientation())
      : getInactiveTriggerClasses(this.variant());
    return twMerge(base, extra);
  }

  // ── ID generation ──
  getTabId(tabValue: string): string {
    return `${this.componentId}-tab-${tabValue}`;
  }

  getPanelId(tabValue: string): string {
    return `${this.componentId}-panel-${tabValue}`;
  }

  // ── Tab visibility ──

  isTabActive(tabValue: string): boolean {
    return this.activeValue() === tabValue;
  }

  shouldRenderPanel(tab: TabComponent): boolean {
    const value = tab.value();
    if (!tab.lazy()) {
      return true;
    }
    // Lazy: render only if it has been activated at least once
    return this.activatedTabs().has(value);
  }

  // ── Selection ──

  selectTab(tab: TabComponent): void {
    if (tab.disabled()) return;
    const val = tab.value();
    this.activeValue.set(val);
    this.value.set(val);

    // Mark as activated for lazy tabs
    this.activatedTabs.update(set => {
      const next = new Set(set);
      next.add(val);
      return next;
    });

    // Announce to screen readers
    const tabsArr = this.tabs();
    const idx = tabsArr.findIndex(t => t.value() === val);
    this.liveAnnouncer.announce(
      `${tab.label() || val} tab, ${idx + 1} of ${tabsArr.length}`,
    );
  }

  closeTab(tab: TabComponent, event: MouseEvent): void {
    event.stopPropagation();
    const val = tab.value();
    this.closed.emit(val);

    // If closing the active tab, activate nearest enabled sibling
    if (this.isTabActive(val)) {
      const tabsArr = this.tabs();
      const idx = tabsArr.findIndex(t => t.value() === val);
      const next = this.findNearestEnabledTab(tabsArr, idx);
      if (next) {
        this.selectTab(next);
      }
    }
  }

  private findNearestEnabledTab(tabs: readonly TabComponent[], fromIndex: number): TabComponent | null {
    // Search forward first, then backward
    for (let i = fromIndex + 1; i < tabs.length; i++) {
      if (!tabs[i].disabled()) return tabs[i];
    }
    for (let i = fromIndex - 1; i >= 0; i--) {
      if (!tabs[i].disabled()) return tabs[i];
    }
    return null;
  }

  // ── Keyboard navigation ──

  onKeydown(event: KeyboardEvent): void {
    const tabsArr = this.tabs();
    if (tabsArr.length === 0) return;

    const isHorizontal = this.orientation() === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let targetIndex = -1;
    const currentIdx = tabsArr.findIndex(t => t.value() === this.activeValue());

    switch (event.key) {
      case nextKey:
        targetIndex = this.findNextEnabledIndex(tabsArr, currentIdx, 1);
        break;
      case prevKey:
        targetIndex = this.findNextEnabledIndex(tabsArr, currentIdx, -1);
        break;
      case 'Home':
        targetIndex = tabsArr.findIndex(t => !t.disabled());
        break;
      case 'End':
        for (let i = tabsArr.length - 1; i >= 0; i--) {
          if (!tabsArr[i].disabled()) { targetIndex = i; break; }
        }
        break;
      default:
        return; // Don't prevent default for unhandled keys
    }

    if (targetIndex >= 0 && targetIndex < tabsArr.length) {
      event.preventDefault();
      this.selectTab(tabsArr[targetIndex]);
      // Focus the trigger element
      const triggers = this.triggerElements();
      if (triggers[targetIndex]) {
        triggers[targetIndex].focus();
      }
    }
  }

  private findNextEnabledIndex(tabs: readonly TabComponent[], from: number, direction: 1 | -1): number {
    const len = tabs.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!tabs[idx].disabled()) return idx;
    }
    return -1;
  }

  // ── Scrolling ──

  scrollStart(): void {
    const el = this.tablistInnerRef()?.nativeElement;
    if (!el) return;
    const isVertical = this.orientation() === 'vertical';
    if (isVertical) {
      el.scrollBy({ top: -120, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: -120, behavior: 'smooth' });
    }
  }

  scrollEnd(): void {
    const el = this.tablistInnerRef()?.nativeElement;
    if (!el) return;
    const isVertical = this.orientation() === 'vertical';
    if (isVertical) {
      el.scrollBy({ top: 120, behavior: 'smooth' });
    } else {
      el.scrollBy({ left: 120, behavior: 'smooth' });
    }
  }

  private updateScrollState(): void {
    const el = this.tablistInnerRef()?.nativeElement;
    if (!el) return;

    const isVertical = this.orientation() === 'vertical';
    if (isVertical) {
      this.canScrollStart.set(el.scrollTop > 0);
      this.canScrollEnd.set(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    } else {
      this.canScrollStart.set(el.scrollLeft > 0);
      this.canScrollEnd.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }
  }

  ngAfterViewInit(): void {
    this.initializeActiveTab();
  }

  constructor() {
    afterNextRender(() => {
      this.setupScrollDetection();
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.scrollCleanup?.();
    });
  }

  private initializeActiveTab(): void {
    // If no value was provided, default to the first enabled tab
    if (!this.activeValue()) {
      const first = this.tabs().find(t => !t.disabled());
      if (first) {
        this.activeValue.set(first.value());
        this.value.set(first.value());
      }
    }

    // Mark the initial active tab as activated (for lazy tracking)
    const val = this.activeValue();
    if (val) {
      this.activatedTabs.update(set => {
        const next = new Set(set);
        next.add(val);
        return next;
      });
    }
  }

  private setupScrollDetection(): void {
    const el = this.tablistInnerRef()?.nativeElement;
    if (!el) return;

    // Initial check
    this.updateScrollState();

    // ResizeObserver for container size changes
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateScrollState();
      });
      this.resizeObserver.observe(el);
    }

    // Scroll event for scroll position changes
    const onScroll = () => this.updateScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });
    this.scrollCleanup = () => el.removeEventListener('scroll', onScroll);
  }
}
