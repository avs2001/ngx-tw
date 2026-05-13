import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';
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
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Variant configs ──

const menuVariants = tv(
  {
    base: 'min-w-48 flex flex-col max-h-96 rounded-lg bg-surface-overlay border border-border shadow-md overflow-y-auto text-fg',
    variants: {
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
    base: 'relative flex w-full flex-wrap items-center gap-2 rounded-md cursor-pointer select-none transition-colors duration-200 motion-reduce:transition-none text-fg outline-none focus-visible:bg-surface-muted hover:bg-surface-muted',
    variants: {
      size: {
        xs: 'px-1.5 py-0.5 text-xs',
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-sm',
        xl: 'px-5 py-2.5 text-base',
      },
      color: {
        default: '',
        primary:
          'text-primary-700 hover:bg-primary-50 focus-visible:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950 dark:focus-visible:bg-primary-950',
        secondary:
          'text-secondary-700 hover:bg-secondary-50 focus-visible:bg-secondary-50 dark:text-secondary-300 dark:hover:bg-secondary-950 dark:focus-visible:bg-secondary-950',
        accent:
          'text-accent-700 hover:bg-accent-50 focus-visible:bg-accent-50 dark:text-accent-300 dark:hover:bg-accent-950 dark:focus-visible:bg-accent-950',
        info: 'text-info-700 hover:bg-info-50 focus-visible:bg-info-50 dark:text-info-300 dark:hover:bg-info-950 dark:focus-visible:bg-info-950',
        success:
          'text-success-700 hover:bg-success-50 focus-visible:bg-success-50 dark:text-success-300 dark:hover:bg-success-950 dark:focus-visible:bg-success-950',
        warning:
          'text-warning-700 hover:bg-warning-50 focus-visible:bg-warning-50 dark:text-warning-300 dark:hover:bg-warning-950 dark:focus-visible:bg-warning-950',
        error:
          'text-error-700 hover:bg-error-50 focus-visible:bg-error-50 dark:text-error-300 dark:hover:bg-error-950 dark:focus-visible:bg-error-950',
        neutral: 'text-fg-muted hover:bg-surface-muted focus-visible:bg-surface-muted',
      },
      disabled: {
        true: 'opacity-50 pointer-events-none',
      },
    },
    defaultVariants: { size: 'md', color: 'default', disabled: false },
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
    '[animate.enter]': '"scale-in fade-in"',
    '[animate.leave]': '"scale-out fade-out"',
  },
  template: `<ng-content />`,
})
export class MenuComponent {
  /** Controls item density and padding. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  readonly classes = computed(() => menuVariants({ size: this.size() }));
}

// ── MenuTriggerDirective ──

@Directive({
  selector: '[twMenuTrigger]',
  hostDirectives: [
    {
      directive: CdkMenuTrigger,
      inputs: ['cdkMenuTriggerFor: twMenuTrigger'],
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
      inputs: ['cdkMenuItemDisabled: disabled'],
      outputs: ['cdkMenuItemTriggered: triggered'],
    },
  ],
  host: {
    '[class]': 'classes()',
  },
})
export class MenuItemDirective {
  /** Semantic color of the item. Use `'error'` for destructive actions. Defaults to `'default'`. */
  readonly color = input<'default' | TwColor>('default');

  /** Whether this item is disabled. Defaults to `false`. */
  readonly disabled = input(false);

  private readonly menu = inject(MenuComponent, { optional: true });

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
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuItemChecked: checked'],
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

  protected readonly cdkCheckbox = inject(CdkMenuItemCheckbox);
  private readonly menu = inject(MenuComponent, { optional: true });

  private readonly resolvedSize = computed(() => this.menu?.size() ?? 'md');

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
      inputs: ['cdkMenuItemDisabled: disabled', 'cdkMenuItemChecked: checked'],
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

  protected readonly cdkRadio = inject(CdkMenuItemRadio);
  private readonly menu = inject(MenuComponent, { optional: true });

  private readonly resolvedSize = computed(() => this.menu?.size() ?? 'md');

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
    class: 'ml-auto pl-2 size-4 shrink-0 text-fg-muted',
  },
})
export class MenuItemSubmenuIndicatorDirective {}
