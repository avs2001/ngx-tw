import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  Directive,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  model,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
  type Signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { FocusTrapFactory, LiveAnnouncer } from '@angular/cdk/a11y';
import { Subscription } from 'rxjs';
import { tv } from 'tailwind-variants';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import {
  COMMAND_PALETTE_REF,
  type CommandPaletteFilterFn,
  type CommandPaletteItem,
  type CommandPaletteRef,
} from './command-palette-tokens';

// ── Constants ──

/** Duration of leave animation (ms) — matches scale-out/fade-out in theme/_base.css. */
const ANIMATION_DURATION = 120;

/** Debounce window (ms) for live-region result announcements while typing. */
const ANNOUNCE_DEBOUNCE = 200;

let nextPaletteId = 0;

// ── Types ──

/** Resolved item shape used internally — merges declarative directive refs with data entries. */
interface ResolvedItem {
  readonly data: CommandPaletteItem;
  readonly directive?: CommandPaletteItemDirective;
  readonly template?: TemplateRef<unknown>;
  readonly shortcutKeys: readonly string[];
}

/** A rendered group in the filtered view. */
interface ResolvedGroup {
  readonly id: string;
  readonly label?: string;
  readonly items: readonly ResolvedItem[];
}

// ── Variant config ──

const commandPaletteVariants = tv(
  {
    slots: {
      panel:
        'pointer-events-auto w-full max-w-xl mt-[15vh] bg-surface-overlay text-fg rounded-lg border border-border shadow-md overflow-hidden flex flex-col max-h-[70vh] outline-none',
      searchWrapper: 'flex items-center gap-3 border-b border-border px-4',
      searchInput:
        'flex-1 bg-transparent border-0 outline-none text-fg placeholder:text-fg-subtle',
      searchIcon: 'size-5 shrink-0 text-fg-muted',
      list: 'flex-1 overflow-y-auto py-1',
      groupHeader:
        'px-4 text-xs font-semibold uppercase tracking-wide text-fg-subtle',
      item:
        'relative flex items-center gap-3 px-4 select-none transition-colors duration-normal motion-reduce:transition-none text-fg outline-none',
      itemBody: 'flex-1 min-w-0 flex flex-col',
      itemLabel: 'min-w-0 truncate',
      itemDescription: 'block text-xs text-fg-muted mt-0.5 min-w-0 truncate',
      itemShortcut: 'ml-auto flex items-center gap-1 pl-3 shrink-0',
      itemKbd:
        'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-md border border-border bg-surface-muted text-fg-muted text-2xs font-mono',
      empty: 'px-4 py-10 text-center text-sm text-fg-muted',
      footer: 'border-t border-border px-4 py-2 bg-surface-muted',
    },
    variants: {
      size: {
        xs: {
          item: 'py-1 text-xs',
          searchInput: 'py-2 text-xs',
          groupHeader: 'pt-2 pb-0.5',
        },
        sm: {
          item: 'py-1.5 text-xs',
          searchInput: 'py-2.5 text-xs',
          groupHeader: 'pt-2 pb-0.5',
        },
        md: {
          item: 'py-2 text-sm',
          searchInput: 'py-3 text-sm',
          groupHeader: 'pt-3 pb-1',
        },
        lg: {
          item: 'py-2.5 text-sm',
          searchInput: 'py-3.5 text-base',
          groupHeader: 'pt-3 pb-1',
        },
        xl: {
          item: 'py-3 text-base',
          searchInput: 'py-4 text-base',
          groupHeader: 'pt-4 pb-1',
        },
      },
      // Active option uses `bg-surface-sunken` (one step recessed from `bg-surface-muted`)
      // so the activedescendant-listbox carve-out remains unambiguously distinguishable
      // from the hovered non-active state — DOM focus stays on the combobox input, so
      // this background shift is the only visual signal for the keyboard-active option.
      active: {
        true: { item: 'bg-surface-sunken' },
        false: { item: '' },
      },
      disabled: {
        true: { item: 'opacity-50 pointer-events-none cursor-default' },
        false: { item: 'cursor-pointer hover:bg-surface-muted' },
      },
    },
    compoundVariants: [
      {
        // When an item is BOTH active and enabled, drop the non-active hover token so
        // hovering the keyboard-active option doesn't visually demote it to the
        // hovered-non-active state. Without this, twMerge keeps both background classes
        // and the active sunken fill flips to muted on hover.
        active: true,
        disabled: false,
        class: { item: 'hover:bg-surface-sunken' },
      },
    ],
    defaultVariants: { size: 'md', active: false, disabled: false },
  },
  { twMerge: true },
);

// ── Helpers ──

function normalizeShortcut(
  value: string | readonly string[] | undefined,
): readonly string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value as string];
}

function defaultFilter(
  items: readonly CommandPaletteItem[],
  query: string,
): readonly CommandPaletteItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;
  return items.filter((item) => {
    if (item.label.toLowerCase().includes(trimmed)) return true;
    if (item.group && item.group.toLowerCase().includes(trimmed)) return true;
    if (item.keywords) {
      for (const keyword of item.keywords) {
        if (keyword.toLowerCase().includes(trimmed)) return true;
      }
    }
    return false;
  });
}

function findFirstEnabled(items: readonly ResolvedItem[]): number {
  for (let i = 0; i < items.length; i++) {
    if (!items[i].data.disabled) return i;
  }
  return 0;
}

function findLastEnabled(items: readonly ResolvedItem[]): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (!items[i].data.disabled) return i;
  }
  return items.length - 1;
}

// ── Group directive ──

/** Optional explicit grouping wrapper. Items placed inside inherit its label. */
@Directive({
  selector: '[twCommandPaletteGroup]',
})
export class CommandPaletteGroupDirective {
  /** Group heading text shown above the items. Required. */
  readonly label = input.required<string>();
}

// ── Item directive (component with projection) ──

/** A declarative palette item. Consumers project its rendered content as children. */
@Component({
  selector: 'tw-command-palette-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: none',
  },
  template: `<ng-template #content><ng-content /></ng-template>`,
})
export class CommandPaletteItemDirective {
  /** Stable identifier for the item. Used as DOM id and in selection payloads. Required. */
  readonly id = input.required<string>();

  /** Plain-text label used for filtering and default rendering. Defaults to `''`. */
  readonly label = input<string>('');

  /** Additional search keywords that match the query but are not rendered. Defaults to `[]`. */
  readonly keywords = input<readonly string[]>([]);

  /** Explicit group name. Overrides any enclosing `twCommandPaletteGroup`. Defaults to `undefined`. */
  readonly group = input<string | undefined>(undefined);

  /** Whether the item is disabled. Disabled items render but cannot be activated. Defaults to `false`. */
  readonly disabled = input<boolean>(false);

  /** Keyboard shortcut hint. A string renders as one kbd; an array renders each key separately. Defaults to `undefined`. */
  readonly shortcut = input<string | readonly string[] | undefined>(undefined);

  /** Secondary description text rendered under the label. Defaults to `''`. */
  readonly description = input<string>('');

  /** Callback run before `activated` emits. Defaults to `undefined`. */
  readonly run = input<(() => void) | undefined>(undefined);

  /** Fires when this specific item is activated (Enter or click). */
  readonly activated = output<void>();

  /** Projected template used by the palette overlay to render this item's content. */
  readonly contentTemplate = viewChild<TemplateRef<unknown>>('content');

  private readonly parentGroup = inject(CommandPaletteGroupDirective, {
    optional: true,
    skipSelf: true,
  });

  /** Resolved CommandPaletteItem data derived from inputs + parent group. */
  readonly data: Signal<CommandPaletteItem> = computed(() => ({
    id: this.id(),
    label: this.label(),
    keywords: this.keywords(),
    group: this.group() ?? this.parentGroup?.label() ?? undefined,
    disabled: this.disabled(),
    shortcut: this.shortcut(),
    description: this.description() || undefined,
    run: this.run(),
  }));
}

// ── Item decoration directives ──

/** Styles a leading icon inside a palette item. */
@Directive({
  selector: '[twCommandPaletteItemIcon]',
  host: {
    class: 'size-4 shrink-0 text-fg-muted',
  },
})
export class CommandPaletteItemIconDirective {}

/** Styles secondary description text inside a palette item. */
@Directive({
  selector: '[twCommandPaletteItemDescription]',
  host: {
    class: 'block text-xs text-fg-muted mt-0.5 min-w-0 truncate',
  },
})
export class CommandPaletteItemDescriptionDirective {}

// ── Template directives ──

/** Structural directive — consumer template rendered when no items match the query. */
@Directive({
  selector: '[twCommandPaletteEmpty]',
})
export class CommandPaletteEmptyDirective {
  readonly template = inject(TemplateRef<{ $implicit: string }>);
}

/** Structural directive — consumer template rendered as a sticky footer inside the palette. */
@Directive({
  selector: '[twCommandPaletteFooter]',
})
export class CommandPaletteFooterDirective {
  readonly template = inject(TemplateRef<void>);
}

// ── Overlay component (private, not exported) ──

@Component({
  selector: 'tw-command-palette-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class:
      'fixed inset-0 flex items-start justify-center p-4 pointer-events-none origin-top',
    '[attr.data-command-palette-overlay]': '""',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': '"scale-out"',
  },
  templateUrl: './command-palette-overlay.html',
})
class CommandPaletteOverlayComponent {
  /** Host palette instance — provided via the content injector on attach. */
  readonly palette = inject(CommandPaletteComponent);

  readonly listId = `tw-command-palette-list-${nextPaletteId++}`;

  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  private readonly variantResult = computed(() =>
    commandPaletteVariants({ size: this.palette.size() }),
  );

  protected readonly panelClasses = computed(() => {
    const base = this.variantResult().panel();
    const custom = this.palette.panelClassResolved();
    return custom ? `${base} ${custom}` : base;
  });
  protected readonly searchWrapperClasses = computed(() =>
    this.variantResult().searchWrapper(),
  );
  protected readonly searchInputClasses = computed(() =>
    this.variantResult().searchInput(),
  );
  protected readonly searchIconClasses = computed(() =>
    this.variantResult().searchIcon(),
  );
  protected readonly listClasses = computed(() => this.variantResult().list());
  protected readonly groupHeaderClasses = computed(() =>
    this.variantResult().groupHeader(),
  );
  protected readonly itemBodyClasses = computed(() =>
    this.variantResult().itemBody(),
  );
  protected readonly itemLabelClasses = computed(() =>
    this.variantResult().itemLabel(),
  );
  protected readonly itemDescriptionClasses = computed(() =>
    this.variantResult().itemDescription(),
  );
  protected readonly itemShortcutClasses = computed(() =>
    this.variantResult().itemShortcut(),
  );
  protected readonly itemKbdClasses = computed(() =>
    this.variantResult().itemKbd(),
  );
  protected readonly emptyClasses = computed(() => this.variantResult().empty());
  protected readonly footerClasses = computed(() => this.variantResult().footer());

  protected itemClasses(active: boolean, disabled: boolean): string {
    return commandPaletteVariants({
      size: this.palette.size(),
      active,
      disabled,
    }).item();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.palette.query.set(value);
  }

  protected onItemClick(item: ResolvedItem): void {
    this.palette.selectItem(item);
  }

  protected onItemHover(item: ResolvedItem): void {
    this.palette.setActiveItem(item);
  }

  /** Focuses the search input (called by the palette after attach). */
  focusSearch(): void {
    this.searchInputRef()?.nativeElement.focus();
  }
}

// ── Public palette component ──

@Component({
  selector: 'tw-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style: 'display: none',
  },
  template: `<ng-content />`,
})
export class CommandPaletteComponent {
  /** Controls item density and padding across the palette. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Placeholder text shown inside the search input. Defaults to `'Type a command or search…'`. */
  readonly placeholder = input<string>('Type a command or search…');

  /** Two-way bindable search query. Reads or resets the current filter. Defaults to `''`. */
  readonly query = model<string>('');

  /** Two-way bindable open state. Setting to `true` opens the palette; closing updates it to `false`. Defaults to `false`. */
  readonly open = model<boolean>(false);

  /** Data-driven command list. Merged with projected items and filtered by `query`. Defaults to `[]`. */
  readonly commands = input<readonly CommandPaletteItem[]>([]);

  /** Custom filter function. Receives the merged item list and current query, returns the filtered result. Defaults to `undefined` (case-insensitive substring match). */
  readonly filterFn = input<CommandPaletteFilterFn | undefined>(undefined);

  /** Whether the palette closes automatically after an item is activated. Defaults to `true` — a command palette is a fire-and-dismiss surface; the special case is a "run many" launcher that opts out. */
  readonly closeOnSelect = input<boolean>(true);

  /** Whether Escape closes the palette. Defaults to `true` — Escape is the universal dismiss key for modal surfaces; the special case is a non-dismissible palette. */
  readonly closeOnEscape = input<boolean>(true);

  /** Whether clicking the backdrop closes the palette. Defaults to `true` — clicking outside a modal is the expected dismiss gesture; the special case is enforcing an explicit choice. */
  readonly closeOnBackdropClick = input<boolean>(true);

  /** Whether the search input is auto-focused when the palette opens. Defaults to `true` — without auto-focus the user must click into the input before typing, defeating the keyboard-first design. */
  readonly autoFocus = input<boolean>(true);

  /** Accessible label used for the dialog role. Defaults to `'Command palette'`. */
  readonly ariaLabel = input<string>('Command palette');

  /** Accessible label applied to the search input (`role="combobox"`). Defaults to `'Search commands'`. */
  readonly searchAriaLabel = input<string>('Search commands');

  /** Additional classes appended to the overlay panel for consumer customization. Defaults to `''`. */
  readonly panelClass = input<string | string[]>('');

  /** Fires when a command is activated (via click or Enter). Payload is the resolved `CommandPaletteItem`. */
  readonly itemSelected = output<CommandPaletteItem>();

  /** Fires after the palette becomes fully visible. */
  readonly opened = output<void>();

  /** Fires after the palette is fully removed from the DOM. */
  readonly closed = output<void>();

  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly announcer = inject(LiveAnnouncer);

  private readonly declarativeItems = contentChildren(CommandPaletteItemDirective, {
    descendants: true,
  });
  private readonly emptyDirective = contentChild(CommandPaletteEmptyDirective);
  private readonly footerDirective = contentChild(CommandPaletteFooterDirective);

  private overlayRef: OverlayRef | null = null;
  private overlayInstance: CommandPaletteOverlayComponent | null = null;
  private focusTrap: ReturnType<FocusTrapFactory['create']> | null = null;
  private perOpenSubs: Subscription | null = null;
  private previousFocus: HTMLElement | null = null;
  private closing = false;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private announceTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly isAttached = signal(false);

  /** Merged (declarative + data-array) items keyed by id — declarative wins on collision. */
  private readonly allItems = computed<readonly ResolvedItem[]>(() => {
    const declarative = this.declarativeItems();
    const declarativeResolved: ResolvedItem[] = declarative.map((dir) => ({
      data: dir.data(),
      directive: dir,
      template: dir.contentTemplate(),
      shortcutKeys: normalizeShortcut(dir.shortcut()),
    }));
    const seenIds = new Set<string>(declarativeResolved.map((it) => it.data.id));

    const arrayItems = this.commands();
    const arrayResolved: ResolvedItem[] = [];
    for (const data of arrayItems) {
      if (seenIds.has(data.id)) continue;
      seenIds.add(data.id);
      arrayResolved.push({
        data,
        shortcutKeys: normalizeShortcut(data.shortcut),
      });
    }
    return [...declarativeResolved, ...arrayResolved];
  });

  /** Items after applying the filter function. */
  readonly filteredItems = computed<readonly ResolvedItem[]>(() => {
    const all = this.allItems();
    const q = this.query();
    const dataList = all.map((r) => r.data);
    const fn = this.filterFn();
    const filtered = fn ? fn(dataList, q) : defaultFilter(dataList, q);
    const byId = new Map<string, ResolvedItem>();
    for (const r of all) byId.set(r.data.id, r);
    const result: ResolvedItem[] = [];
    for (const data of filtered) {
      const resolved = byId.get(data.id);
      if (resolved) result.push(resolved);
    }
    return result;
  });

  /** Filtered items grouped by their `group` field. */
  readonly grouped = computed<readonly ResolvedGroup[]>(() => {
    const items = this.filteredItems();
    const groups: { id: string; label?: string; items: ResolvedItem[] }[] = [];
    const byKey = new Map<string, { id: string; label?: string; items: ResolvedItem[] }>();
    for (const item of items) {
      const label = item.data.group;
      const key = label ?? '__ungrouped__';
      let g = byKey.get(key);
      if (!g) {
        g = { id: `group-${key}`, label, items: [] };
        byKey.set(key, g);
        groups.push(g);
      }
      g.items.push(item);
    }
    return groups;
  });

  /**
   * Active item index, auto-resets to the first enabled item when the filtered
   * *id set* changes. Keyed off the id sequence (not the array reference) so a
   * re-emission of `filteredItems` with identical ids preserves the user's
   * keyboard selection; only when ids actually shift do we recompute. When the
   * previously-active id is still present in the new sequence its index is
   * carried over; otherwise we fall back to the first enabled item.
   */
  readonly activeIndex = linkedSignal<readonly string[], number>({
    source: () => this.filteredItems().map((i) => i.data.id),
    computation: (ids, previous) => {
      const items = this.filteredItems();
      if (!previous) return findFirstEnabled(items);
      const prevId = previous.source[previous.value];
      if (prevId) {
        const carriedIndex = ids.indexOf(prevId);
        if (carriedIndex >= 0) return carriedIndex;
      }
      return findFirstEnabled(items);
    },
  });

  /** Id of the currently active item (for `aria-activedescendant`). */
  readonly activeItemId = computed<string | null>(() => {
    const idx = this.activeIndex();
    const items = this.filteredItems();
    return items[idx]?.data.id ?? null;
  });

  /** Template-ref of the projected empty state (if any). */
  readonly emptyTemplate = computed<TemplateRef<{ $implicit: string }> | null>(
    () => this.emptyDirective()?.template ?? null,
  );

  /** Template-ref of the projected footer (if any). */
  readonly footerTemplate = computed<TemplateRef<void> | null>(
    () => this.footerDirective()?.template ?? null,
  );

  /** Resolved panel-class string (array merged into a single string). */
  readonly panelClassResolved = computed<string>(() => {
    const raw = this.panelClass();
    return Array.isArray(raw) ? raw.join(' ') : raw;
  });

  constructor() {
    // React to model changes from the consumer
    effect(() => {
      const shouldOpen = this.open();
      if (shouldOpen && !this.overlayInstance && !this.closing) {
        this.openPalette();
      } else if (!shouldOpen && this.overlayInstance && !this.closing) {
        this.closePalette();
      }
    });

    // Debounced live-region announcements while the palette is open
    effect(() => {
      const q = this.query();
      const count = this.filteredItems().length;
      untracked(() => {
        if (!this.isAttached()) return;
        this.clearAnnounceTimer();
        this.announceTimer = setTimeout(() => {
          const message =
            count === 0
              ? `No commands match ${q}`
              : `${count} ${count === 1 ? 'result' : 'results'} for ${q}`;
          this.announcer.announce(message, 'polite');
        }, ANNOUNCE_DEBOUNCE);
      });
    });

    this.destroyRef.onDestroy(() => {
      this.clearCloseTimer();
      this.clearAnnounceTimer();
      this.destroyFocusTrap();
      this.perOpenSubs?.unsubscribe();
      this.disposeOverlay();
    });
  }

  // ── Public API ──

  /** Open the palette programmatically. */
  show(): void {
    if (this.overlayInstance || this.closing) return;
    this.open.set(true);
  }

  /** Close the palette programmatically. */
  hide(): void {
    if (!this.overlayInstance || this.closing) return;
    this.closePalette();
  }

  /** Toggle the current open state. */
  toggle(): void {
    if (this.overlayInstance || this.closing) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** Force the palette to reapply focus to the search input. */
  focusSearch(): void {
    this.overlayInstance?.focusSearch();
  }

  // ── Internal wiring (used by overlay) ──

  /** Activate an item: run callbacks, emit events, optionally close. */
  selectItem(item: ResolvedItem): void {
    if (item.data.disabled) return;
    item.data.run?.();
    item.directive?.activated.emit();
    this.itemSelected.emit(item.data);
    if (this.closeOnSelect()) this.hide();
  }

  /** Move the active descendant to the given item (used on hover). */
  setActiveItem(item: ResolvedItem): void {
    if (item.data.disabled) return;
    const idx = this.filteredItems().indexOf(item);
    if (idx >= 0) this.activeIndex.set(idx);
  }

  // ── Private ──

  private openPalette(): void {
    this.previousFocus =
      (document.activeElement as HTMLElement | null) ?? null;
    this.ensureOverlay();
    this.attachContent();
    this.subscribePerOpen();
    this.isAttached.set(true);
    this.setupFocusTrap();
    if (this.autoFocus()) {
      queueMicrotask(() => this.overlayInstance?.focusSearch());
    }
    this.announcer.announce(
      `Command palette opened. ${this.filteredItems().length} commands available.`,
      'polite',
    );
    this.opened.emit();
  }

  private closePalette(): void {
    if (this.closing) return;
    this.closing = true;

    this.destroyFocusTrap();

    this.previousFocus?.focus();
    this.previousFocus = null;

    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;

      // Guard against teardown during the animation window. `destroyRef.onDestroy`
      // calls `clearCloseTimer()` so this branch only fires when the timer survived;
      // even so, `isAttached` is the authoritative signal — if the overlay already
      // detached (programmatic disposeOverlay, double-close race), skip writes that
      // would touch a destroyed instance or re-emit `open=false`.
      if (!this.isAttached()) {
        this.closing = false;
        return;
      }

      if (this.overlayRef?.hasAttached()) {
        this.overlayRef.detach();
      }

      this.perOpenSubs?.unsubscribe();
      this.perOpenSubs = null;
      this.overlayInstance = null;
      this.isAttached.set(false);

      untracked(() => this.open.set(false));

      this.closed.emit();
      this.closing = false;
    }, ANIMATION_DURATION);
  }

  private ensureOverlay(): void {
    if (this.overlayRef) return;
    const positionStrategy = this.overlay.position().global();
    const scrollStrategy = this.overlay.scrollStrategies.block();
    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy,
      hasBackdrop: true,
      backdropClass: 'tw-dialog-backdrop',
      panelClass: 'tw-command-palette-panel',
    });
  }

  private attachContent(): void {
    if (!this.overlayRef) return;
    const paletteRef: CommandPaletteRef = {
      close: () => this.hide(),
      setQuery: (q) => this.query.set(q),
    };
    const contentInjector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: CommandPaletteComponent, useValue: this },
        { provide: COMMAND_PALETTE_REF, useValue: paletteRef },
      ],
    });
    const portal = new ComponentPortal(
      CommandPaletteOverlayComponent,
      this.viewContainerRef,
      contentInjector,
    );
    const ref = this.overlayRef.attach(portal);
    this.overlayInstance = ref.instance;
  }

  private subscribePerOpen(): void {
    this.perOpenSubs?.unsubscribe();
    this.perOpenSubs = new Subscription();

    this.perOpenSubs.add(
      this.overlayRef!.backdropClick().subscribe(() => {
        if (this.closeOnBackdropClick()) this.hide();
      }),
    );

    this.perOpenSubs.add(
      this.overlayRef!.keydownEvents().subscribe((event) =>
        this.handleOverlayKeydown(event),
      ),
    );
  }

  private handleOverlayKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        if (this.closeOnEscape()) {
          event.preventDefault();
          this.hide();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(findFirstEnabled(this.filteredItems()));
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(findLastEnabled(this.filteredItems()));
        break;
      case 'Enter':
        event.preventDefault();
        this.activateActive();
        break;
      // Tab is intentionally NOT handled here — the FocusTrap installed in
      // `setupFocusTrap()` cycles focus through the modal's focusable elements,
      // so the user cannot accidentally tab out of the palette. Closing on Tab
      // (the previous behaviour) ran counter to the universal "Tab moves focus
      // within a modal" convention and surprised keyboard users.
    }
  }

  private moveActive(delta: 1 | -1): void {
    const items = this.filteredItems();
    if (items.length === 0) return;
    const n = items.length;
    let idx = this.activeIndex();
    for (let i = 0; i < n; i++) {
      idx = (idx + delta + n) % n;
      if (!items[idx].data.disabled) {
        this.activeIndex.set(idx);
        return;
      }
    }
  }

  private activateActive(): void {
    const items = this.filteredItems();
    const item = items[this.activeIndex()];
    if (item && !item.data.disabled) this.selectItem(item);
  }

  private setupFocusTrap(): void {
    if (!this.overlayRef) return;
    this.focusTrap = this.focusTrapFactory.create(this.overlayRef.overlayElement);
  }

  private destroyFocusTrap(): void {
    this.focusTrap?.destroy();
    this.focusTrap = null;
  }

  private disposeOverlay(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.overlayInstance = null;
  }

  private clearCloseTimer(): void {
    if (this.closeTimer !== null) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  private clearAnnounceTimer(): void {
    if (this.announceTimer !== null) {
      clearTimeout(this.announceTimer);
      this.announceTimer = null;
    }
  }
}
