import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { TemplateRef } from '@angular/core';
import type {
  ComboboxRenderedRow,
  ComboboxVisibleOption,
  TwComboboxOptionContext,
} from './types';

/**
 * Internal overlay panel for `tw-combobox`. Renders the listbox region with
 * grouped/flat option rows, the loading slot, and the empty fallback. Not
 * exported from the public API — instances are attached via `ComponentPortal`
 * by the parent `ComboboxComponent`.
 */
@Component({
  selector: 'tw-combobox-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    '[class]': 'panelClasses()',
    '[animate.enter]': '"scale-in"',
    '[animate.leave]': '"scale-out"',
  },
  template: `
    @if (loading()) {
      @if (loadingTemplate(); as tpl) {
        <ng-container *ngTemplateOutlet="tpl" />
      } @else {
        <div class="flex items-center justify-center gap-2 px-4 py-6 text-sm text-fg-muted">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            class="size-4 animate-spin"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
          </svg>
          <span>Loading…</span>
        </div>
      }
    }

    <ul
      [id]="listboxId()"
      role="listbox"
      [attr.aria-labelledby]="labelledBy() || null"
      aria-multiselectable="false"
      [style.maxHeight.px]="panelMaxHeight()"
      class="list-none m-0 p-0 overflow-y-auto py-1"
    >
      @if (renderedRows().length === 0 && !loading()) {
        @if (emptyTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: { $implicit: query() }" />
        } @else {
          <li class="px-4 py-10 text-center text-sm text-fg-muted list-none">
            {{ emptyMessage() }}
          </li>
        }
      } @else {
        @for (row of renderedRows(); track trackRow($index, row)) {
          @if (row.kind === 'group') {
            <li
              role="group"
              [attr.aria-labelledby]="groupHeaderId(row.group)"
              class="list-none"
            >
              <div
                [id]="groupHeaderId(row.group)"
                class="px-3 py-1 text-2xs uppercase tracking-wide text-fg-subtle font-semibold"
              >
                {{ row.group }}
              </div>
            </li>
          } @else {
            <li
              role="option"
              [id]="optionIdFn()(row.index)"
              [attr.aria-selected]="isSelected()(row.index) ? 'true' : 'false'"
              [attr.aria-disabled]="row.option.disabled ? 'true' : null"
              [class]="optionClass(row.index, row.option.disabled)"
              (mousedown)="onOptionMousedown($event, row.index)"
              (click)="onOptionClick($event, row.index)"
              (mouseenter)="onOptionMouseEnter(row.index, row.option.disabled)"
            >
              @if (optionTemplate(); as tpl) {
                <ng-container
                  *ngTemplateOutlet="
                    tpl;
                    context: buildOptionContext(row.index, row.option)
                  "
                />
              } @else {
                <span class="flex-1 min-w-0">
                  <span class="block truncate">{{ row.option.label }}</span>
                  @if (row.option.description) {
                    <span class="block text-xs text-fg-muted truncate">{{ row.option.description }}</span>
                  }
                </span>
              }
            </li>
          }
        }
      }
    </ul>
  `,
})
export class ComboboxOverlayComponent<T = unknown> {
  /** @internal */
  readonly hostElement = inject(ElementRef<HTMLElement>);

  // ── Config signals pushed by the parent ──

  /** @internal */
  readonly listboxId = signal('');
  /** @internal */
  readonly labelledBy = signal('');
  /** @internal */
  readonly panelMaxHeight = signal(256);
  /** @internal */
  readonly emptyMessage = signal('No results');
  /** @internal */
  readonly query = signal('');
  /** @internal */
  readonly loading = signal(false);
  /** @internal */
  readonly activeIndex = signal(-1);
  /** @internal */
  readonly renderedRows = signal<readonly ComboboxRenderedRow<T>[]>([]);
  /** @internal */
  readonly isSelected = signal<(visibleIndex: number) => boolean>(() => false);
  /** @internal */
  readonly optionIdFn = signal<(index: number) => string>((i) => `option-${i}`);
  /** @internal */
  readonly groupHeaderIdFn = signal<(group: string) => string>((g) => `group-${g}`);
  /** @internal */
  readonly customPanelClass = signal('');

  /** @internal */
  readonly optionTemplate = signal<TemplateRef<TwComboboxOptionContext<T>> | undefined>(undefined);
  /** @internal */
  readonly emptyTemplate = signal<TemplateRef<{ $implicit: string }> | undefined>(undefined);
  /** @internal */
  readonly loadingTemplate = signal<TemplateRef<unknown> | undefined>(undefined);

  // ── Callbacks pushed by the parent ──

  /** @internal */
  readonly onOptionPick = signal<(index: number) => void>(() => {});
  /** @internal */
  readonly onOptionHover = signal<(index: number) => void>(() => {});

  // ── Computed classes ──

  /** @internal */
  readonly panelClasses = computed(() => {
    const base =
      'block w-full bg-surface-overlay border border-border rounded-md shadow-md overflow-hidden';
    const custom = this.customPanelClass();
    return custom ? `${base} ${custom}` : base;
  });

  /** @internal */
  optionClass(index: number, disabled: boolean): string {
    const base =
      'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-fg select-none transition-colors duration-normal motion-reduce:transition-none';
    const parts: string[] = [base];
    if (disabled) {
      parts.push('opacity-50 pointer-events-none cursor-default');
    } else if (this.activeIndex() === index) {
      parts.push('bg-surface-muted');
    } else {
      parts.push('hover:bg-surface-muted');
    }
    return parts.join(' ');
  }

  /** @internal */
  groupHeaderId(group: string): string {
    return this.groupHeaderIdFn()(group);
  }

  /** @internal */
  buildOptionContext(index: number, option: ComboboxVisibleOption<T>): TwComboboxOptionContext<T> {
    return {
      $implicit: option.option as TwComboboxOptionContext<T>['$implicit'],
      option: option.option as TwComboboxOptionContext<T>['option'],
      label: option.label,
      value: option.value,
      selected: this.isSelected()(index),
      active: this.activeIndex() === index,
      disabled: option.disabled,
      index,
    };
  }

  /** @internal track function for `@for`. */
  trackRow(_index: number, row: ComboboxRenderedRow<T>): string | number {
    if (row.kind === 'group') return `g:${row.group}`;
    return `o:${row.index}`;
  }

  // ── Interactions ──

  /** @internal — `preventDefault` on mousedown keeps DOM focus on the input. */
  onOptionMousedown(event: MouseEvent, _index: number): void {
    event.preventDefault();
  }

  /** @internal */
  onOptionClick(event: MouseEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.onOptionPick()(index);
  }

  /** @internal */
  onOptionMouseEnter(index: number, disabled: boolean): void {
    if (disabled) return;
    this.onOptionHover()(index);
  }
}
