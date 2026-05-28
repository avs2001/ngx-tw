import {
  afterNextRender,
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
  linkedSignal,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  viewChildren,
  type AfterViewInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FocusableOption, FocusKeyManager, LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import {
  getActiveTriggerClasses,
  getInactiveTriggerClasses,
  tabTriggerVariants,
  type TabTriggerVariant,
  type TwColor,
  type TwSize,
} from '@cdevhub/ngx-tw/core';

/** Visual style of the tab strip. */
export type TabsVariant = TabTriggerVariant;

// ── tv() config (component-local slots only — trigger config is shared) ──

const tabsLayoutVariants = tv(
  {
    slots: {
      root: 'flex',
      tablist: 'relative flex shrink-0',
      tablistInner: 'flex overflow-x-auto',
      panel: 'min-w-0 flex-1',
      scrollButton:
        'inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-normal motion-reduce:transition-none disabled:opacity-30 disabled:cursor-default hover:bg-surface-muted',
      closeButton:
        'inline-flex items-center justify-center rounded-md cursor-pointer transition-colors duration-normal motion-reduce:transition-none hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      variant: {
        underline: {
          tablist: 'border-b border-border',
          tablistInner: 'gap-0',
          panel: 'pt-4',
        },
        enclosed: {
          tablist: 'border-b border-border',
          tablistInner: 'gap-0',
          panel: 'pt-4',
        },
        pill: {
          tablist: 'bg-surface-muted rounded-xl p-1',
          tablistInner: 'gap-1',
          panel: 'pt-4',
        },
      },
      // Square interactive-target scale: see CLAUDE.md "Icon Sizing".
      size: {
        xs: { scrollButton: 'size-5', closeButton: 'size-6' },
        sm: { scrollButton: 'size-5', closeButton: 'size-7' },
        md: { scrollButton: 'size-6', closeButton: 'size-8' },
        lg: { scrollButton: 'size-7', closeButton: 'size-9' },
        xl: { scrollButton: 'size-8', closeButton: 'size-9' },
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
    },
    compoundVariants: [
      {
        variant: 'underline',
        orientation: 'vertical',
        class: {
          tablist: 'border-b-0 border-r border-border',
          panel: 'pt-0 pl-4',
        },
      },
      {
        variant: 'enclosed',
        orientation: 'vertical',
        class: {
          tablist: 'border-b-0 border-r border-border',
          panel: 'pt-0 pl-4',
        },
      },
      {
        variant: 'pill',
        orientation: 'vertical',
        class: {
          panel: 'pt-0 pl-4',
        },
      },
    ],
    defaultVariants: {
      variant: 'underline',
      size: 'md',
      orientation: 'horizontal',
    },
  },
  { twMerge: true },
);

// ── Per-variant/orientation trigger additions (vertical underline/enclosed
//    re-route the active border axis, hence these compound overrides). ──

function getTriggerOrientationExtras(
  variant: TabsVariant,
  orientation: 'horizontal' | 'vertical',
): string {
  if (orientation !== 'vertical') return '';
  switch (variant) {
    case 'underline':
      return 'border-b-0 -mb-0 border-r-2 border-transparent -mr-px';
    case 'enclosed':
      return '-mb-0 -mr-px';
    case 'pill':
      return '';
  }
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
export class TabTriggerElementDirective implements FocusableOption {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly isActive = input(false);
  readonly isDisabled = input(false);

  readonly tabIndex = computed(() => this.isActive() ? 0 : -1);

  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  /**
   * FocusableOption getter. NOTE: we cannot expose the `isDisabled` input
   * signal directly — the signal function itself is always truthy, which would
   * make FocusKeyManager treat every trigger as disabled. We resolve the
   * signal here so the manager skips the right items.
   */
  get disabled(): boolean {
    return this.isDisabled();
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

  private readonly layoutResult = computed(() =>
    tabsLayoutVariants({
      variant: this.variant(),
      size: this.size(),
      orientation: this.orientation(),
    }),
  );

  private readonly triggerResult = computed(() =>
    tabTriggerVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      fitted: this.fitted(),
    }),
  );

  readonly rootClasses = computed(() => this.layoutResult().root());
  readonly tablistClasses = computed(() => this.layoutResult().tablist());
  readonly tablistInnerClasses = computed(() => this.layoutResult().tablistInner());
  readonly baseTriggerClasses = computed(() => this.triggerResult().trigger());
  readonly panelClasses = computed(() => this.layoutResult().panel());
  readonly scrollButtonClasses = computed(() => this.layoutResult().scrollButton());
  readonly closeButtonClasses = computed(() => this.layoutResult().closeButton());

  // ── Per-trigger active/inactive class computation ──

  /** @internal Get combined trigger classes for a given tab. */
  getTriggerClasses(_tabValue: string, isActive: boolean): string {
    const base = this.baseTriggerClasses();
    const orientationExtras = getTriggerOrientationExtras(this.variant(), this.orientation());
    const state = isActive
      ? getActiveTriggerClasses(this.variant(), this.color(), this.orientation())
      : getInactiveTriggerClasses(this.variant());
    return twMerge(base, orientationExtras, state);
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

  closeTab(tab: TabComponent, event: Event): void {
    event.stopPropagation();
    if (event instanceof KeyboardEvent) {
      event.preventDefault();
    }
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

  // ── Keyboard navigation (CDK FocusKeyManager) ──

  private keyManager: FocusKeyManager<TabTriggerElementDirective> | null = null;

  /**
   * @internal Handles keyboard navigation. The manager handles Arrow/Home/End;
   * we layer Enter/Space to select the focused tab (the wrapper is a `<div role="tab">`
   * so we lose the native button activation) and Delete to close a closable tab.
   */
  onKeydown(event: KeyboardEvent): void {
    if (!this.keyManager) return;
    const triggers = this.triggerElements();
    if (triggers.length === 0) return;

    // Sync active item with the trigger DOM-focused by the user. We accept
    // either `event.target` (which works under shadow DOM) or the currently
    // active tab's index as a safety net (e.g. when the event was dispatched
    // on the tablist container itself, not a trigger).
    const focusedIdx = triggers.findIndex(
      t => t.elementRef.nativeElement === event.target,
    );
    const activeIdx = focusedIdx >= 0
      ? focusedIdx
      : this.tabs().findIndex(t => t.value() === this.activeValue());
    if (activeIdx >= 0 && activeIdx !== this.keyManager.activeItemIndex) {
      this.keyManager.setActiveItem(activeIdx);
    }

    // Enter / Space select the focused tab (we no longer get this for free
    // because the trigger is a div, not a button — see DOM restructure below).
    if (event.key === 'Enter' || event.key === ' ') {
      if (focusedIdx >= 0) {
        event.preventDefault();
        this.selectTab(this.tabs()[focusedIdx]);
      }
      return;
    }

    // Delete on a closable tab dismisses it (APG-recommended). Keyboard users
    // who don't want to traverse to the close button can dismiss inline.
    if (event.key === 'Delete' && focusedIdx >= 0) {
      const tab = this.tabs()[focusedIdx];
      if (tab.closable() && !tab.disabled()) {
        event.preventDefault();
        this.closeTab(tab, event);
        return;
      }
    }

    // Let the manager handle arrow/home/end navigation.
    const before = this.keyManager.activeItemIndex;
    this.keyManager.onKeydown(event);
    const after = this.keyManager.activeItemIndex;
    if (after !== null && after !== before && after >= 0) {
      // Automatic activation pattern (APG): selection follows focus.
      this.selectTab(this.tabs()[after]);
    }
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

    // Rebuild FocusKeyManager whenever triggers or orientation change.
    effect((onCleanup) => {
      const triggers = this.triggerElements();
      const orientation = this.orientation();
      if (triggers.length === 0) {
        this.keyManager = null;
        return;
      }
      const manager = new FocusKeyManager(triggers)
        .withWrap()
        .withHomeAndEnd();
      if (orientation === 'vertical') {
        manager.withVerticalOrientation();
      } else {
        manager.withHorizontalOrientation('ltr');
      }
      this.keyManager = manager;

      // Initialise the manager's active index to the active tab so the first
      // arrow press moves from the active item, not from -1.
      untracked(() => {
        const activeVal = this.activeValue();
        const tabs = this.tabs();
        const idx = tabs.findIndex(t => t.value() === activeVal);
        if (idx >= 0) {
          manager.setActiveItem(idx);
        }
      });

      onCleanup(() => {
        manager.destroy();
      });
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
