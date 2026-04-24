import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import { twMerge } from 'tailwind-merge';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Visual style of the tab navigation strip. */
export type TabNavVariant = 'underline' | 'enclosed' | 'pill';

// ── tv() config ──

const tabNavVariants = tv(
  {
    slots: {
      nav: 'relative flex shrink-0 items-stretch',
      list: 'flex overflow-x-auto items-stretch',
      link:
        'inline-flex items-center gap-1.5 font-medium whitespace-nowrap cursor-pointer no-underline transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    },
    variants: {
      variant: {
        underline: {
          nav: 'border-b border-border',
          list: 'gap-0',
          link: 'border-b-2 border-transparent -mb-px text-fg-muted hover:text-fg',
        },
        enclosed: {
          nav: 'border-b border-border',
          list: 'gap-0',
          link:
            'border border-transparent bg-surface-muted text-fg-muted hover:text-fg -mb-px',
        },
        pill: {
          nav: 'bg-surface-muted rounded-xl p-1',
          list: 'gap-1',
          link: 'rounded-md text-fg-muted hover:text-fg',
        },
      },
      size: {
        xs: { link: 'px-2 py-1 text-xs' },
        sm: { link: 'px-3 py-1.5 text-sm' },
        md: { link: 'px-4 py-2 text-sm' },
        lg: { link: 'px-5 py-2.5 text-base' },
        xl: { link: 'px-6 py-3 text-base' },
      },
      fitted: {
        true: { link: 'flex-1 justify-center' },
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
    defaultVariants: {
      variant: 'underline',
      color: 'primary',
      size: 'md',
      fitted: false,
    },
  },
  { twMerge: true },
);

// ── Static active-state class lookups (classes must be statically written for Tailwind v4) ──

const UNDERLINE_ACTIVE: Record<TwColor, string> = {
  primary: 'border-b-2 border-primary-500 text-primary-600',
  secondary: 'border-b-2 border-secondary-500 text-secondary-600',
  accent: 'border-b-2 border-accent-500 text-accent-600',
  neutral: 'border-b-2 border-border-strong text-fg',
  info: 'border-b-2 border-info-500 text-info-600',
  success: 'border-b-2 border-success-500 text-success-600',
  warning: 'border-b-2 border-warning-500 text-warning-600',
  error: 'border-b-2 border-error-500 text-error-600',
};

const ENCLOSED_ACTIVE: Record<TwColor, string> = {
  primary: 'bg-surface border border-border border-b-transparent text-primary-700',
  secondary: 'bg-surface border border-border border-b-transparent text-secondary-700',
  accent: 'bg-surface border border-border border-b-transparent text-accent-700',
  neutral: 'bg-surface border border-border border-b-transparent text-fg',
  info: 'bg-surface border border-border border-b-transparent text-info-700',
  success: 'bg-surface border border-border border-b-transparent text-success-700',
  warning: 'bg-surface border border-border border-b-transparent text-warning-700',
  error: 'bg-surface border border-border border-b-transparent text-error-700',
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

const INACTIVE_CLASSES: Record<TabNavVariant, string> = {
  underline: 'border-transparent',
  enclosed: 'border-transparent bg-surface-muted',
  pill: '',
};

function getActiveLinkClasses(variant: TabNavVariant, color: TwColor): string {
  switch (variant) {
    case 'underline':
      return UNDERLINE_ACTIVE[color];
    case 'enclosed':
      return ENCLOSED_ACTIVE[color];
    case 'pill':
      return PILL_ACTIVE[color];
  }
}

function getInactiveLinkClasses(variant: TabNavVariant): string {
  return INACTIVE_CLASSES[variant];
}

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

  /** Associated panel element. When provided, the nav follows the ARIA tabs pattern (role=tablist). When omitted, it uses the standard navigation landmark pattern with `aria-current="page"` on the active link. */
  readonly tabPanel = input<TabNavPanel | undefined>(undefined);

  /** @internal Tab links discovered via content projection. */
  readonly links = contentChildren(TabLinkDirective, { descendants: true });

  private readonly variantResult = computed(() =>
    tabNavVariants({
      variant: this.variant(),
      color: this.color(),
      size: this.size(),
      fitted: this.fitted(),
    }),
  );

  /** @internal Combined classes applied to the `<nav>` host. */
  readonly navClasses = computed(() => this.variantResult().nav());

  /** @internal Base trigger classes (without active/inactive state). */
  readonly linkBaseClasses = computed(() => this.variantResult().link());

  /** @internal ARIA role — `tablist` when a tabPanel is provided, otherwise inherited from `<nav>`. */
  readonly role = computed(() => (this.tabPanel() ? 'tablist' : null));

  /** @internal ARIA orientation — only set in the tabs pattern. */
  readonly ariaOrientation = computed(() => (this.tabPanel() ? 'horizontal' : null));

  /** @internal Classes applied to the active state of a link, based on current variant and color. */
  readonly activeLinkClasses = computed(() =>
    getActiveLinkClasses(this.variant(), this.color()),
  );

  /** @internal Classes applied to the inactive state of a link, based on current variant. */
  readonly inactiveLinkClasses = computed(() => getInactiveLinkClasses(this.variant()));

  constructor() {
    // Keep the associated panel's aria-labelledby in sync with the active link.
    effect(() => {
      const panel = this.tabPanel();
      if (!panel) return;
      const activeLink = this.links().find((link) => link.active());
      panel.activeTabId.set(activeLink?.linkId() ?? undefined);
    });
  }

  /** @internal Handles arrow-key navigation in the ARIA tabs pattern. Manual activation: focus moves, but the link is only clicked on Enter/Space. */
  onKeydown(event: KeyboardEvent): void {
    if (!this.tabPanel()) return;
    const links = this.links();
    if (links.length === 0) return;

    const focused = document.activeElement as HTMLElement | null;
    const currentIdx = links.findIndex(
      (link) => link.elementRef.nativeElement === focused,
    );
    if (currentIdx < 0) return;

    let targetIdx = -1;
    switch (event.key) {
      case 'ArrowRight':
        targetIdx = findNextEnabled(links, currentIdx, 1);
        break;
      case 'ArrowLeft':
        targetIdx = findNextEnabled(links, currentIdx, -1);
        break;
      case 'Home':
        targetIdx = links.findIndex((link) => !link.disabled());
        break;
      case 'End':
        for (let i = links.length - 1; i >= 0; i--) {
          if (!links[i].disabled()) {
            targetIdx = i;
            break;
          }
        }
        break;
      default:
        return;
    }

    if (targetIdx >= 0 && targetIdx < links.length) {
      event.preventDefault();
      links[targetIdx].focus();
    }
  }
}

function findNextEnabled(
  links: readonly TabLinkDirective[],
  from: number,
  direction: 1 | -1,
): number {
  const len = links.length;
  let idx = from;
  for (let i = 0; i < len; i++) {
    idx = (idx + direction + len) % len;
    if (!links[idx].disabled()) return idx;
  }
  return -1;
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

  /** @internal ARIA role — `tab` in the tabs pattern, otherwise default anchor role. */
  readonly linkRole = computed(() => (this.parent.tabPanel() ? 'tab' : null));

  /** @internal `aria-current="page"` on the active link when no tabPanel is associated. */
  readonly ariaCurrent = computed(() => {
    if (this.parent.tabPanel()) return null;
    return this.active() ? 'page' : null;
  });

  /** @internal `aria-selected` applied only in the tabs pattern. */
  readonly ariaSelected = computed(() => {
    if (!this.parent.tabPanel()) return null;
    return this.active() ? 'true' : 'false';
  });

  /** @internal `aria-controls` points to the associated panel id. */
  readonly ariaControls = computed(() => this.parent.tabPanel()?.id() ?? null);

  /** @internal */
  readonly ariaDisabled = computed(() => (this.disabled() ? 'true' : null));

  /** @internal Tabindex — roving in the tabs pattern, default for navigation links, always -1 when disabled. */
  readonly tabIndex = computed(() => {
    if (this.disabled()) return -1;
    if (!this.parent.tabPanel()) return null;
    return this.active() ? 0 : -1;
  });

  /** @internal Combined classes: base + active/inactive state + disabled modifiers. */
  readonly classes = computed(() => {
    const base = this.parent.linkBaseClasses();
    const state = this.active()
      ? this.parent.activeLinkClasses()
      : this.parent.inactiveLinkClasses();
    const disabled = this.disabled()
      ? 'opacity-50 pointer-events-none cursor-not-allowed'
      : '';
    return twMerge(base, state, disabled);
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

  /** @internal Intercepts Enter/Space on disabled links. */
  onKeydown(event: KeyboardEvent): void {
    if (this.disabled() && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
