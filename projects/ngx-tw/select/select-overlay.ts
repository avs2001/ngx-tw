import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type {
  SelectEmptyTemplateDirective,
  SelectFooterTemplateDirective,
  SelectHeaderTemplateDirective,
  SelectOptionTemplateDirective,
  SelectRenderedRow,
  SelectVisibleOption,
  TwSelectOptionContext,
} from './select';

/**
 * Internal overlay panel for `tw-select`. Renders the header/search/listbox/empty/footer
 * regions and dispatches interaction callbacks back to the parent `SelectComponent`.
 * Not exported from the public API.
 */
@Component({
  selector: 'tw-select-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[class]': 'panelClasses()',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': '"scale-out"',
  },
  template: `
    @if (headerTemplate(); as tpl) {
      <div class="border-b border-border p-2">
        <ng-container *ngTemplateOutlet="tpl.templateRef" />
      </div>
    }

    @if (searchable()) {
      <div class="p-2 border-b border-border">
        <input
          #searchInput
          type="search"
          [id]="searchInputId()"
          [attr.aria-label]="'Search'"
          [attr.aria-controls]="listboxId()"
          [value]="search()"
          class="w-full px-3 py-1.5 rounded-md border border-border bg-surface text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-colors duration-normal motion-reduce:transition-none text-sm"
          placeholder="Search…"
          (input)="onSearchInputEvent($event)"
          (keydown)="onSearchKeydown($event)"
        />
      </div>
    }

    <div
      #listboxEl
      role="listbox"
      tabindex="-1"
      [id]="listboxId()"
      [attr.aria-multiselectable]="multiple() ? 'true' : null"
      [style.maxHeight.px]="panelMaxHeight()"
      class="flex-1 min-h-0 overflow-y-auto py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      @if (visibleOptions().length === 0) {
        @if (emptyTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: search() }" />
        } @else {
          <div class="p-4 text-center text-sm text-fg-muted">{{ emptyMessage() }}</div>
        }
      } @else {
        @for (row of renderedRows(); track trackRow($index, row)) {
          @if (row.kind === 'group-label') {
            <div role="group" [attr.aria-label]="row.group">
              <div class="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                {{ row.group }}
              </div>
            </div>
          } @else {
            <div
              role="option"
              [id]="optionIdFn()(row.index)"
              [attr.aria-selected]="selectedChecker()(row.index) ? 'true' : 'false'"
              [attr.aria-disabled]="isOptionDisabled(row.index) || null"
              [class]="
                computeOptionClass()(
                  selectedChecker()(row.index),
                  activeIndex() === row.index,
                  isOptionDisabled(row.index)
                )
              "
              (click)="onOptionClick(row.index, $event)"
              (mouseenter)="onOptionMouseEnter(row.index)"
            >
              @if (optionTemplate(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tpl.templateRef;
                    context: buildOptionContext(row.index, row.option)
                  "
                />
              } @else {
                <span class="flex-1 min-w-0 truncate">{{ optionLabelFn()(row.option) }}</span>
                @if (selectedChecker()(row.index)) {
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                    [class]="checkmarkClasses()"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.3a1 1 0 0 1-1.42.007L3.29 9.296a1 1 0 0 1 1.42-1.41l3.794 3.82 6.79-6.886a1 1 0 0 1 1.41-.07Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                }
              }
            </div>
          }
        }
      }
    </div>

    @if (footerTemplate(); as tpl) {
      <div class="border-t border-border p-2">
        <ng-container *ngTemplateOutlet="tpl.templateRef" />
      </div>
    }
  `,
})
export class SelectOverlayComponent<T = unknown> {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // ── Config signals set by the parent component ──

  /** @internal */
  readonly size = signal<TwSize>('md');
  /** @internal */
  readonly color = signal<TwColor>('primary');
  /** @internal */
  readonly multiple = signal(false);
  /** @internal */
  readonly searchable = signal(false);
  /** @internal */
  readonly panelMaxHeight = signal(256);
  /** @internal */
  readonly emptyMessage = signal('No results');
  /** @internal */
  readonly search = signal('');
  /** @internal */
  readonly activeIndex = signal(-1);
  /** @internal */
  readonly renderedRows = signal<readonly SelectRenderedRow<T>[]>([]);
  /** @internal */
  readonly visibleOptions = signal<readonly SelectVisibleOption<T>[]>([]);
  /** @internal */
  readonly optionTemplate = signal<SelectOptionTemplateDirective<T> | undefined>(undefined);
  /** @internal */
  readonly emptyTemplate = signal<SelectEmptyTemplateDirective | undefined>(undefined);
  /** @internal */
  readonly headerTemplate = signal<SelectHeaderTemplateDirective | undefined>(undefined);
  /** @internal */
  readonly footerTemplate = signal<SelectFooterTemplateDirective | undefined>(undefined);
  /** @internal */
  readonly optionLabelFn = signal<(option: unknown) => string>(() => '');
  /** @internal */
  readonly selectedChecker = signal<(visibleIndex: number) => boolean>(() => false);
  /** @internal */
  readonly computeOptionClass = signal<
    (selected: boolean, active: boolean, disabled: boolean) => string
  >(() => '');
  /** @internal */
  readonly checkmarkColorClass = signal('');
  /** @internal */
  readonly panelClassValue = signal('');
  /** @internal */
  readonly listboxId = signal('');
  /** @internal */
  readonly searchInputId = signal('');
  /** @internal */
  readonly optionIdFn = signal<(index: number) => string>((i) => `option-${i}`);
  /** @internal */
  readonly leaving = signal(false);

  // ── Callbacks set by the parent component ──

  /** @internal */
  readonly onSearchInput = signal<(value: string) => void>(() => {});
  /** @internal */
  readonly onOptionSelect = signal<(index: number) => void>(() => {});
  /** @internal */
  readonly onOptionActivate = signal<(index: number) => void>(() => {});
  /** @internal */
  readonly onPanelKeydown = signal<(event: KeyboardEvent) => void>(() => {});

  // ── View refs ──

  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ── Computed classes ──

  /** @internal */
  readonly panelClasses = computed(() => {
    const base =
      'block w-full bg-surface-overlay border border-border rounded-lg shadow-md overflow-hidden flex flex-col';
    const custom = this.panelClassValue();
    return custom ? `${base} ${custom}` : base;
  });

  /** @internal */
  readonly checkmarkClasses = computed(() => {
    // xs/sm densities use `size-3.5` (14px) for the checkmark — the half-step
    // is the only icon size that aligns with the surrounding text-xs metric.
    const size = this.size() === 'xs' || this.size() === 'sm' ? 'size-3.5' : 'size-4';
    return `${size} shrink-0 ml-auto ${this.checkmarkColorClass()}`;
  });

  // ── Template helpers ──

  /** @internal */
  isOptionDisabled(visibleIndex: number): boolean {
    const vis = this.visibleOptions();
    if (visibleIndex < 0 || visibleIndex >= vis.length) return false;
    return vis[visibleIndex].disabled;
  }

  /** @internal */
  buildOptionContext(visibleIndex: number, option: unknown): TwSelectOptionContext<T> {
    const v = this.visibleOptions()[visibleIndex];
    return {
      $implicit: option as TwSelectOptionContext<T>['$implicit'],
      label: v?.label ?? '',
      value: v?.value as T,
      selected: this.selectedChecker()(visibleIndex),
      active: this.activeIndex() === visibleIndex,
      disabled: v?.disabled ?? false,
      index: visibleIndex,
    };
  }

  /** @internal track function for @for. */
  trackRow(_index: number, row: SelectRenderedRow<T>): string | number {
    if (row.kind === 'group-label') return `g:${row.group}`;
    return `o:${row.index}`;
  }

  // ── Interactions ──

  /** @internal */
  onSearchInputEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.onSearchInput()(target.value);
  }

  /** @internal */
  onSearchKeydown(event: KeyboardEvent): void {
    this.onPanelKeydown()(event);
  }

  /** @internal */
  onOptionClick(visibleIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.onOptionSelect()(visibleIndex);
  }

  /** @internal */
  onOptionMouseEnter(visibleIndex: number): void {
    if (this.isOptionDisabled(visibleIndex)) return;
    this.onOptionActivate()(visibleIndex);
  }

  /** @internal */
  focusSearchInput(): void {
    const el = this.searchInputRef()?.nativeElement;
    el?.focus();
  }

  /** @internal Exposes the root overlay element for tests. */
  getElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
