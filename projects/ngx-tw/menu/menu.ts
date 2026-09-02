import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CdkContextMenuTrigger,
  CdkMenu,
  CdkMenuGroup,
  CdkMenuItem,
  CdkMenuItemCheckbox,
  CdkMenuItemRadio,
  CdkMenuTrigger,
} from '@angular/cdk/menu';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Variant configs ──

const menuVariants = tv(
  {
    base: 'min-w-48 flex flex-col max-h-96 rounded-lg bg-surface-overlay border border-border shadow-md overflow-y-auto text-fg',
    variants: {
      // Menu panels intentionally use sub-`p-1` padding at xs/sm because items
      // carry their own inline padding — the codified `p-2`/`p-3`/`p-4` container
      // scale would over-pad the panel gutter. The size axis here scales the panel
      // border-to-item gap only, not item density.
      size: {
        xs: 'p-0.5 [&>tw-separator]:-mx-0.5 [&>tw-separator]:my-0.5',
        sm: 'p-0.5 [&>tw-separator]:-mx-0.5 [&>tw-separator]:my-0.5',
        md: 'p-1 [&>tw-separator]:-mx-1 [&>tw-separator]:my-1',
        lg: 'p-1.5 [&>tw-separator]:-mx-1.5 [&>tw-separator]:my-1',
        xl: 'p-2 [&>tw-separator]:-mx-2 [&>tw-separator]:my-1',
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

// Menu items use the codified menu-item focus carve-out: `focus-visible:bg-surface-muted`
// (and color-tinted equivalents below) in place of the canonical outline ring. See the
// "Focus Rings → Menu-item carve-out" section in CLAUDE.md.
const menuItemVariants = tv(
  {
    base: 'relative flex w-full flex-wrap items-center gap-2 rounded-md cursor-pointer select-none transition-colors duration-normal motion-reduce:transition-none text-fg outline-none focus-visible:bg-surface-muted hover:bg-surface-muted',
    variants: {
      // Menu rows are on the `min-h-*` list (docs/vertical-rhythm.md §2), not
      // the pinned one: `[twMenuItemDescription]` wraps onto a second line via
      // `basis-full`, so the box must stay free to grow. The floor lands on the
      // control scale (24 / 32 / 36 / 44 / 48) and `py-*` is kept exactly as it
      // was — it sets the breathing room around a wrapped two-line row, where
      // the floor no longer binds.
      size: {
        xs: 'px-1.5 py-0.5 text-xs min-h-6',
        sm: 'px-2 py-1 text-xs min-h-8',
        md: 'px-3 py-1.5 text-sm min-h-9',
        lg: 'px-4 py-2 text-sm min-h-11',
        xl: 'px-5 py-2.5 text-base min-h-12',
      },
      // Slot tokens own light/dark contrast — no `dark:`, no shade picks.
      // `undefined` (the default) leaves the base text-fg styling untouched.
      color: {
        primary: 'text-primary-fg hover:bg-primary-soft focus-visible:bg-primary-soft',
        secondary: 'text-secondary-fg hover:bg-secondary-soft focus-visible:bg-secondary-soft',
        accent: 'text-accent-fg hover:bg-accent-soft focus-visible:bg-accent-soft',
        info: 'text-info-fg hover:bg-info-soft focus-visible:bg-info-soft',
        success: 'text-success-fg hover:bg-success-soft focus-visible:bg-success-soft',
        warning: 'text-warning-fg hover:bg-warning-soft focus-visible:bg-warning-soft',
        error: 'text-error-fg hover:bg-error-soft focus-visible:bg-error-soft',
        neutral: 'text-fg-muted hover:bg-surface-muted focus-visible:bg-surface-muted',
      },
      // `cursor-not-allowed` is layered so a programmatically-focused disabled item
      // still reads as disabled — `pointer-events-none` blocks pointer activation, but
      // the cursor cue communicates the state if focus lands here via CDK's own paths.
      // CDK's `FocusableOption` honours `cdkItem.disabled` (synced via the effect below)
      // and skips disabled items in keyboard navigation automatically.
      disabled: {
        true: 'opacity-50 pointer-events-none cursor-not-allowed',
      },
    },
    defaultVariants: { size: 'md', disabled: false },
  },
  { twMerge: true },
);

const menuItemIconVariants = tv(
  {
    base: 'shrink-0 text-fg-muted',
    variants: {
      size: {
        xs: 'size-4',
        sm: 'size-4',
        md: 'size-4',
        lg: 'size-5',
        xl: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

const menuItemIndicatorVariants = tv(
  {
    base: 'shrink-0 flex items-center justify-center',
    variants: {
      size: {
        xs: 'size-4',
        sm: 'size-4',
        md: 'size-4',
        lg: 'size-5',
        xl: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

// Submenu indicator (trailing chevron). Keeps the `ml-auto pl-2` layout intent
// separate from the leading-icon scale; size axis follows the glyph scale per
// CLAUDE.md "Icon Sizing" so the chevron scales with the parent menu's density.
const menuItemSubmenuIndicatorVariants = tv(
  {
    base: 'ml-auto pl-2 shrink-0 text-fg-muted',
    variants: {
      size: {
        xs: 'size-3',
        sm: 'size-4',
        md: 'size-4',
        lg: 'size-5',
        xl: 'size-5',
      },
    },
    defaultVariants: { size: 'md' },
  },
  { twMerge: true },
);

// ── MenuComponent ──

@Component({
  selector: 'tw-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenu,
      outputs: ['closed'],
    },
  ],
  host: {
    '[class]': 'classes()',
    '[attr.aria-label]': 'ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'ariaLabel() ? null : (ariaLabelledBy() ?? null)',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': '"scale-out"',
  },
  template: `<ng-content />`,
})
export class MenuComponent {
  /** Controls item density and padding. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Accessible label for the menu panel. Use when no visible heading describes the menu (e.g. a kebab-icon trigger). Defaults to `undefined`. Alias: `aria-label`. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** ID of an element that labels the menu panel. Ignored when `ariaLabel` is set. Defaults to `undefined`. Alias: `aria-labelledby`. */
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  readonly classes = computed(() => menuVariants({ size: this.size() }));
}

// ── MenuTriggerDirective ──

@Directive({
  selector: '[twMenuTrigger]',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: [
        'cdkMenuTriggerFor: twMenuTrigger',
        // Forward CDK's positioning so consumers can anchor the menu (e.g. bottom-end vs bottom-start).
        // Accepts `ConnectedPosition[]` from `@angular/cdk/overlay`.
        'cdkMenuPosition: position',
        // Forward menu context data so consumers can parameterise the template.
        'cdkMenuTriggerData: data',
      ],
      outputs: ['cdkMenuOpened: opened', 'cdkMenuClosed: closed'],
    },
  ],
})
export class MenuTriggerDirective {}

// ── ContextMenuTriggerDirective ──

@Directive({
  selector: '[twContextMenuTrigger]',
  hostDirectives: [
    {
      directive: CdkContextMenuTrigger,
      inputs: [
        'cdkContextMenuTriggerFor: twContextMenuTrigger',
        'cdkContextMenuDisabled: disabled',
        // Context menus open at pointer coordinates; `position` here tunes the
        // `ConnectedPosition[]` fallback list once CDK has anchored the overlay.
        'cdkContextMenuPosition: position',
        'cdkContextMenuTriggerData: data',
      ],
      outputs: ['cdkContextMenuOpened: opened', 'cdkContextMenuClosed: closed'],
    },
  ],
})
export class ContextMenuTriggerDirective {}

// ── MenuItemDirective ──

@Directive({
  selector: '[twMenuItem]',
  hostDirectives: [
    {
      directive: CdkMenuItem,
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    '[class]': 'classes()',
  },
})
export class MenuItemDirective {
  /**
   * Semantic role tint applied to the item. Use `'error'` for destructive actions.
   * Defaults to `undefined` — no role tint is applied and the item inherits the
   * base `text-fg` styling at full prominence; `'neutral'` (the explicit muted
   * variant) is a distinct value with `text-fg-muted` + `bg-surface-muted` hovers.
   */
  readonly color = input<TwColor | undefined>(undefined);

  /** Whether this item is disabled. Defaults to `false`. */
  readonly disabled = input(false);

  private readonly menu = inject(MenuComponent, { optional: true });
  private readonly cdkItem = inject(CdkMenuItem);

  constructor() {
    // Single source of truth: the local `disabled` signal drives both visual state
    // and the underlying CDK directive's behavior (`disabled` is a plain property on CDK).
    effect(() => {
      this.cdkItem.disabled = this.disabled();
    });
  }

  readonly classes = computed(() =>
    menuItemVariants({
      size: this.menu?.size() ?? 'md',
      color: this.color(),
      disabled: this.disabled(),
    }),
  );
}

// ── MenuItemCheckboxComponent ──

@Component({
  selector: '[twMenuItemCheckbox]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItemCheckbox,
      inputs: ['cdkMenuItemChecked: checked'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    '[class]': 'classes()',
  },
  template: `
    <span [class]="indicatorClasses()">
      @if (cdkCheckbox.checked) {
        <svg class="size-full" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
        </svg>
      }
    </span>
    <ng-content />
  `,
})
export class MenuItemCheckboxComponent {
  /** Whether this item is disabled. Defaults to `false`. */
  readonly disabled = input(false);

  /** Fires when the item is activated, carrying the new `checked` value after CDK toggles it. */
  readonly checkedChange = output<boolean>();

  protected readonly cdkCheckbox = inject(CdkMenuItemCheckbox);
  private readonly menu = inject(MenuComponent, { optional: true });

  private readonly resolvedSize = computed(() => this.menu?.size() ?? 'md');

  constructor() {
    effect(() => {
      this.cdkCheckbox.disabled = this.disabled();
    });
    // CDK fires `triggered` BEFORE updating `checked`; emit the post-toggle value.
    this.cdkCheckbox.triggered
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.checkedChange.emit(!this.cdkCheckbox.checked));
  }

  readonly classes = computed(() =>
    menuItemVariants({
      size: this.resolvedSize(),
      disabled: this.disabled(),
    }),
  );

  readonly indicatorClasses = computed(() =>
    menuItemIndicatorVariants({ size: this.resolvedSize() }),
  );
}

// ── MenuItemRadioComponent ──

@Component({
  selector: '[twMenuItemRadio]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CdkMenuItemRadio,
      inputs: ['cdkMenuItemChecked: checked'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    '[class]': 'classes()',
  },
  template: `
    <span [class]="indicatorClasses()">
      @if (cdkRadio.checked) {
        <svg class="size-full" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="5"/>
        </svg>
      }
    </span>
    <ng-content />
  `,
})
export class MenuItemRadioComponent {
  /** Whether this item is disabled. Defaults to `false`. */
  readonly disabled = input(false);

  /** Fires when the item is activated, carrying the new `checked` value after CDK selects it. */
  readonly checkedChange = output<boolean>();

  protected readonly cdkRadio = inject(CdkMenuItemRadio);
  private readonly menu = inject(MenuComponent, { optional: true });

  private readonly resolvedSize = computed(() => this.menu?.size() ?? 'md');

  constructor() {
    effect(() => {
      this.cdkRadio.disabled = this.disabled();
    });
    // Radio activation always selects the item; emit `true` (the post-trigger checked state).
    this.cdkRadio.triggered
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.checkedChange.emit(true));
  }

  readonly classes = computed(() =>
    menuItemVariants({
      size: this.resolvedSize(),
      disabled: this.disabled(),
    }),
  );

  readonly indicatorClasses = computed(() =>
    menuItemIndicatorVariants({ size: this.resolvedSize() }),
  );
}

// ── MenuGroupDirective ──

@Directive({
  selector: '[twMenuGroup]',
  hostDirectives: [CdkMenuGroup],
})
export class MenuGroupDirective {}

// ── Content directives ──

/** Styles a leading icon inside a menu item. */
@Directive({
  selector: '[twMenuItemIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class MenuItemIconDirective {
  private readonly menu = inject(MenuComponent, { optional: true });

  readonly classes = computed(() =>
    menuItemIconVariants({ size: this.menu?.size() ?? 'md' }),
  );
}

/** Styles secondary description text inside a menu item. */
@Directive({
  selector: '[twMenuItemDescription]',
  host: {
    class: 'block text-xs text-fg-muted min-w-0 truncate order-last basis-full',
  },
})
export class MenuItemDescriptionDirective {}

/** Right-aligns and mutes keyboard shortcut hint text. */
@Directive({
  selector: '[twMenuItemShortcut]',
  host: {
    class: 'ml-auto pl-3 text-xs text-fg-subtle tracking-wide',
  },
})
export class MenuItemShortcutDirective {}

/** Styles the trailing chevron for submenu triggers. */
@Directive({
  selector: '[twMenuItemSubmenuIcon]',
  host: {
    '[class]': 'classes()',
  },
})
export class MenuItemSubmenuIndicatorDirective {
  private readonly menu = inject(MenuComponent, { optional: true });

  readonly classes = computed(() =>
    menuItemSubmenuIndicatorVariants({ size: this.menu?.size() ?? 'md' }),
  );
}
