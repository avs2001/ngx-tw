import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  contentChild,
  contentChildren,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { type FocusableOption, FocusKeyManager, LiveAnnouncer } from '@angular/cdk/a11y';
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

/** Visual style of the tab navigation strip. */
export type TabNavVariant = TabTriggerVariant;

/** Optional label overrides for screen-reader announcements emitted by `TabNavComponent`. */
export interface TabNavLabels {
  /** Formatter for the LiveAnnouncer message emitted when the active link changes in the ARIA tabs pattern. Receives the link's visible text, its 1-based index, and the total link count. */
  activeTabAnnouncement?: (label: string, index: number, total: number) => string;
}

// ── tv() config — nav-shell-only slots (trigger config is shared in core) ──

const tabNavLayoutVariants = tv(
  {
    slots: {
      nav: 'relative flex shrink-0 items-stretch',
      list: 'flex overflow-x-auto items-stretch',
    },
    variants: {
      variant: {
        underline: {
          nav: 'border-b border-border',
          list: 'gap-0',
        },
        enclosed: {
          nav: 'border-b border-border',
          list: 'gap-0',
        },
        pill: {
          nav: 'bg-surface-muted rounded-xl p-1',
          list: 'gap-1',
        },
      },
    },
    defaultVariants: {
      variant: 'underline',
    },
  },
  { twMerge: true },
);

// ── TabNavPanel ──

let nextPanelId = 0;

@Component({
  selector: 'tw-tab-nav-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    role: 'tabpanel',
    tabindex: '0',
    '[attr.id]': 'id()',
    '[attr.aria-labelledby]': 'activeTabId()',
  },
})
export class TabNavPanel {
  /** Unique id for this panel. Referenced by the active link's `aria-controls`. Auto-generated when not provided. */
  readonly id = input(`tw-tab-nav-panel-${nextPanelId++}`);

  /** @internal Id of the active link — set by the associated TabNavComponent. */
  readonly activeTabId = signal<string | undefined>(undefined);
}

// ── TabNavComponent ──

@Component({
  selector: 'nav[twTabNav]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    '[class]': 'navClasses()',
    '[attr.role]': 'role()',
    '[attr.aria-orientation]': 'ariaOrientation()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class TabNavComponent {
  /** Visual style of the tab strip. Defaults to `'underline'`. */
  readonly variant = input<TabNavVariant>('underline');

  /** Semantic color used for the active link indicator and text. Defaults to `'primary'`. */
  readonly color = input<TwColor>('primary');

  /** Controls padding and font size of tab links. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** When true, tab links stretch to fill available width equally. Defaults to `false`. */
  readonly fitted = input(false);

  /** Associated panel element. When provided, the nav follows the ARIA tabs pattern (role=tablist). When omitted, it uses the standard navigation landmark pattern with `aria-current="page"` on the active link. A panel projected as a child of the `<nav>` is auto-discovered. */
  readonly tabPanel = input<TabNavPanel | undefined>(undefined);

  /** Additional classes merged onto the `<nav>` host. Useful for layout tweaks or borders that the default tv() config does not cover. */
  readonly navClass = input<string>('');

  /** Additional classes merged onto every tab link. Applied after base/active/disabled classes so consumer styles always win the cascade. */
  readonly linkClass = input<string>('');

  /** Optional label overrides for screen-reader announcements. Only used in the ARIA tabs pattern (i.e. when a panel is associated). */
  readonly labels = input<TabNavLabels>({});

  /** @internal Tab links discovered via content projection. */
  readonly links = contentChildren(TabLinkDirective, { descendants: true });

  /** @internal Panel discovered as a content child of the nav. */
  readonly projectedPanel = contentChild(TabNavPanel);

  /** @internal Resolved panel — explicit `tabPanel` input wins, falls back to a projected `<tw-tab-nav-panel>` inside the nav. */
  readonly resolvedPanel = computed(() => this.tabPanel() ?? this.projectedPanel());

  private readonly liveAnnouncer = inject(LiveAnnouncer);

  /** Tracks the previously-announced active link id so we only announce on actual changes. `null` = before the first sync. */
  private readonly previousActiveLinkId = signal<string | null | undefined>(null);

  private readonly layoutResult = computed(() =>
    tabNavLayoutVariants({
      variant: this.variant(),
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

  /** @internal Combined classes applied to the `<nav>` host. */
  readonly navClasses = computed(() =>
    twMerge(this.layoutResult().nav(), this.navClass()),
  );

  /** @internal Base trigger classes (without active/inactive state). `no-underline` is appended because anchors need to override the default browser underline — tabs (which uses `<div role="tab">`) doesn't need it. */
  readonly linkBaseClasses = computed(() =>
    twMerge(this.triggerResult().trigger(), 'no-underline'),
  );

  /** @internal ARIA role — `tablist` when a tabPanel is associated, otherwise inherited from `<nav>`. */
  readonly role = computed(() => (this.resolvedPanel() ? 'tablist' : null));

  /** @internal ARIA orientation — only set in the tabs pattern. */
  readonly ariaOrientation = computed(() => (this.resolvedPanel() ? 'horizontal' : null));

  /** @internal Classes applied to the active state of a link, based on current variant and color. tab-nav is horizontal-only, so the orientation argument is hard-coded. */
  readonly activeLinkClasses = computed(() =>
    getActiveTriggerClasses(this.variant(), this.color(), 'horizontal'),
  );

  /** @internal Classes applied to the inactive state of a link, based on current variant. */
  readonly inactiveLinkClasses = computed(() => getInactiveTriggerClasses(this.variant()));

  // Typed as FocusableOption because TabLinkDirective's `disabled` InputSignal
  // is structurally incompatible with FocusableOption.disabled (boolean).
  private keyManager: FocusKeyManager<FocusableOption> | null = null;

  constructor() {
    // Keep the associated panel's aria-labelledby in sync with the active link
    // and announce route changes to screen readers when in the ARIA tabs pattern.
    effect(() => {
      const panel = this.resolvedPanel();
      if (!panel) {
        // Reset so the next time a panel is associated we don't fire a stale announcement.
        untracked(() => this.previousActiveLinkId.set(null));
        return;
      }
      const links = this.links();
      const activeLink = links.find((link) => link.active());
      const activeLinkId = activeLink?.linkId() ?? undefined;
      panel.activeTabId.set(activeLinkId);

      const prev = untracked(() => this.previousActiveLinkId());
      untracked(() => this.previousActiveLinkId.set(activeLinkId));
      if (prev === null || prev === activeLinkId || !activeLink) {
        return;
      }

      const idx = links.indexOf(activeLink);
      const label = activeLink.elementRef.nativeElement.textContent?.trim() ?? '';
      const formatter = this.labels().activeTabAnnouncement;
      const message = formatter
        ? formatter(label, idx + 1, links.length)
        : `${label}, tab ${idx + 1} of ${links.length}`;
      this.liveAnnouncer.announce(message);
    });

    // Rebuild FocusKeyManager whenever the link set changes. tab-nav is
    // horizontal-only, so we always configure horizontal orientation.
    effect((onCleanup) => {
      const links = this.links();
      if (links.length === 0) {
        this.keyManager = null;
        return;
      }
      // Cast through unknown because `disabled` on TabLinkDirective is an
      // InputSignal — structurally incompatible with FocusableOption's
      // `disabled?: boolean`. FocusKeyManager only calls `focus()` (which we
      // provide) and the disabled check, which we override via skipPredicate.
      const focusable = links as unknown as readonly FocusableOption[];
      const manager = (new FocusKeyManager(focusable)
        .withWrap()
        .withHomeAndEnd()
        .withHorizontalOrientation('ltr')) as FocusKeyManager<FocusableOption>;
      // The `disabled` field on TabLinkDirective is an InputSignal (always
      // truthy as a function), so we cannot rely on FocusKeyManager's default
      // disabled check. Resolve the signal explicitly here.
      manager.skipPredicate((link) => (link as unknown as TabLinkDirective).disabled());
      this.keyManager = manager;

      onCleanup(() => {
        manager.destroy();
      });
    });
  }

  /** @internal Handles arrow-key navigation in the ARIA tabs pattern via CDK FocusKeyManager. Manual activation: focus moves, but the link is only activated on Enter/Space (handled by the anchor itself). */
  onKeydown(event: KeyboardEvent): void {
    if (!this.resolvedPanel()) return;
    if (!this.keyManager) return;
    const links = this.links();
    if (links.length === 0) return;

    // Sync the manager's active item with whichever link the user has DOM-focused
    // (mirrors the accordion pattern; event.target works under shadow DOM).
    const focusedIdx = links.findIndex(
      (link) => link.elementRef.nativeElement === event.target,
    );
    if (focusedIdx >= 0 && focusedIdx !== this.keyManager.activeItemIndex) {
      this.keyManager.setActiveItem(focusedIdx);
    } else if (focusedIdx < 0) {
      // No focused link inside the nav — nothing to navigate.
      return;
    }

    this.keyManager.onKeydown(event);
  }
}

// ── TabLinkDirective ──

let nextLinkId = 0;

@Directive({
  selector: 'a[twTabLink]',
  host: {
    '[attr.id]': 'linkId()',
    '[attr.role]': 'linkRole()',
    '[attr.aria-current]': 'ariaCurrent()',
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.aria-controls]': 'ariaControls()',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.tabindex]': 'tabIndex()',
    '[class]': 'classes()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
/**
 * Note: we intentionally do not declare `implements FocusableOption`. The
 * FocusableOption interface requires a `disabled?: boolean` property, but
 * `disabled` here is an InputSignal — a function whose own boolean-coerced
 * value is always truthy. FocusKeyManager only requires a `focus()` method
 * (structurally satisfied below) and we override the disabled check via
 * `.skipPredicate()` when constructing the manager.
 */
export class TabLinkDirective {
  /** @internal */
  readonly elementRef = inject<ElementRef<HTMLAnchorElement>>(ElementRef);

  private readonly parent = inject(TabNavComponent);

  /** Whether the link represents the current active page/tab. Typically bound to router state. Defaults to `false`. */
  readonly active = input(false);

  /** When true, the link is visually disabled and cannot be activated by click or keyboard. Defaults to `false`. */
  readonly disabled = input(false);

  /** Unique id for this link. Referenced by the panel's `aria-labelledby` when the link is active. Auto-generated when not provided. */
  readonly linkId = input(`tw-tab-link-${nextLinkId++}`);

  /**
   * @internal ARIA role — `'tab'` when the nav is wired to a panel (APG
   * tablist pattern requires `role="tab"` on every link); `null` otherwise so
   * the anchor's native `role="link"` wins. Do NOT collapse to a single
   * branch — both are meaningful.
   */
  readonly linkRole = computed(() => (this.parent.resolvedPanel() ? 'tab' : null));

  /** @internal `aria-current="page"` on the active link when no tabPanel is associated. */
  readonly ariaCurrent = computed(() => {
    if (this.parent.resolvedPanel()) return null;
    return this.active() ? 'page' : null;
  });

  /** @internal `aria-selected` applied only in the tabs pattern. */
  readonly ariaSelected = computed(() => {
    if (!this.parent.resolvedPanel()) return null;
    return this.active() ? 'true' : 'false';
  });

  /** @internal `aria-controls` points to the associated panel id. */
  readonly ariaControls = computed(() => this.parent.resolvedPanel()?.id() ?? null);

  /** @internal */
  readonly ariaDisabled = computed(() => (this.disabled() ? 'true' : null));

  /** @internal Tabindex — roving in the tabs pattern, default for navigation links, always -1 when disabled. */
  readonly tabIndex = computed(() => {
    if (this.disabled()) return -1;
    if (!this.parent.resolvedPanel()) return null;
    return this.active() ? 0 : -1;
  });

  /** @internal Combined classes: base + active/inactive state + disabled modifiers + consumer overrides. */
  readonly classes = computed(() => {
    const base = this.parent.linkBaseClasses();
    const state = this.active()
      ? this.parent.activeLinkClasses()
      : this.parent.inactiveLinkClasses();
    const disabled = this.disabled()
      ? 'opacity-50 pointer-events-none cursor-not-allowed'
      : '';
    return twMerge(base, state, disabled, this.parent.linkClass());
  });

  /** Programmatically focus this link. */
  focus(): void {
    this.elementRef.nativeElement.focus();
  }

  /** @internal Intercepts clicks on disabled links to prevent navigation. */
  onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  /** @internal Handles keyboard activation: blocks Enter/Space on disabled links, and activates the link on Space for enabled ones (anchors do not respond to Space by default). */
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      this.elementRef.nativeElement.click();
    }
  }
}
