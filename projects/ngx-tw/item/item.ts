import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  type OnInit,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';
import type { TwSize } from 'ngx-tw/core';

/** Density / typography scale for `tw-item`. A narrower subset of `TwSize` — the three sizes that match real use cases (table row, list item, section header). */
export type ItemSize = Extract<TwSize, 'sm' | 'md' | 'lg'>;

/** Vertical alignment of the leading and trailing slots relative to the title/description stack. */
export type ItemAlign = 'start' | 'center';

const itemVariants = tv(
  {
    slots: {
      root: 'flex w-full text-fg',
      // Leading is a layout slot only: `shrink-0` + optional `mt-*` nudge for baseline
      // alignment. No `flex` / `items-*` here — those would conflict with the consumer's
      // own tile styling (e.g. `flex items-center justify-center` on an icon tile).
      leading: 'shrink-0',
      content: 'flex min-w-0 flex-col',
      title: 'text-fg font-medium',
      description: 'text-fg-muted',
      trailing: 'flex shrink-0',
    },
    variants: {
      size: {
        sm: {
          root: 'gap-2 py-1.5',
          content: 'gap-0',
          title: 'text-sm truncate',
          description: 'text-xs truncate',
          trailing: 'gap-1.5',
        },
        md: {
          root: 'gap-3 py-2',
          leading: 'mt-0.5',
          content: 'gap-1',
          title: 'text-sm',
          description: 'text-sm',
          trailing: 'gap-2',
        },
        lg: {
          root: 'gap-3 py-3',
          leading: 'mt-0.5',
          content: 'gap-1',
          title: 'text-base font-semibold',
          description: 'text-sm',
          trailing: 'gap-2',
        },
      },
      align: {
        start: {
          root: 'items-start',
          trailing: 'items-start',
        },
        center: {
          root: 'items-center',
          leading: 'mt-0',
          trailing: 'items-center',
        },
      },
      interactive: {
        true: {
          root: '-mx-2 cursor-pointer rounded-md px-2 transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 motion-reduce:transition-none',
        },
        false: {},
      },
      disabled: {
        true: {
          root: 'pointer-events-none opacity-50',
        },
        false: {},
      },
    },
    compoundVariants: [
      { size: 'sm', align: 'center', class: { leading: 'mt-0', root: 'items-center' } },
      { size: 'md', align: 'center', class: { leading: 'mt-0', root: 'items-center' } },
      { size: 'lg', align: 'center', class: { leading: 'mt-0', root: 'items-center' } },
    ],
    defaultVariants: {
      size: 'md',
      align: 'start',
      interactive: false,
      disabled: false,
    },
  },
  { twMerge: true },
);

@Component({
  selector: 'tw-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'interactive() ? "button" : null',
    '[attr.tabindex]': 'interactive() && !disabled() ? 0 : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '(click)': 'onActivate($event)',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <ng-content select="[twItemLeading]" />
    <div [class]="contentClasses()">
      <ng-content select="[twItemTitle]" />
      <ng-content select="[twItemDescription]" />
    </div>
    <ng-content select="[twItemTrailing]" />
  `,
})
export class ItemComponent implements OnInit {
  /** Density and typography scale. `'sm'` is compact with truncated single-line title and description (table rows). `'md'` is the default list-item size. `'lg'` is the section-header scale with a larger title. Defaults to `'md'`. */
  readonly size = input<ItemSize>('md');

  /** Vertical alignment of the leading and trailing slots relative to the content stack. `'start'` aligns them with the title baseline (recommended when a description is present). `'center'` vertically centers them on the whole block (recommended for single-line items). Defaults to `'start'`. */
  readonly align = input<ItemAlign>('start');

  /** When `true`, the item is keyboard-activatable: adds `role="button"`, `tabindex="0"`, a hover background, pointer cursor, and a visible focus ring. Click and Enter/Space emit `selected`. Defaults to `false`. */
  readonly interactive = input(false);

  /** Disables an interactive item. Applies `opacity-50`, `pointer-events-none`, and sets `aria-disabled`. Only meaningful when `interactive` is `true`. Defaults to `false`. */
  readonly disabled = input(false);

  /** Fires when an interactive item is activated via click, Enter, or Space. Payload is the originating DOM event. Does not emit when `interactive` is `false` or `disabled` is `true`. */
  readonly selected = output<Event>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly destroyRef = inject(DestroyRef);

  private readonly variantResult = computed(() =>
    itemVariants({
      size: this.size(),
      align: this.align(),
      interactive: this.interactive(),
      disabled: this.disabled(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly leadingClasses = computed(() => this.variantResult().leading());
  readonly contentClasses = computed(() => this.variantResult().content());
  readonly titleClasses = computed(() => this.variantResult().title());
  readonly descriptionClasses = computed(() => this.variantResult().description());
  readonly trailingClasses = computed(() => this.variantResult().trailing());

  ngOnInit(): void {
    this.focusMonitor.monitor(this.elementRef);
    this.destroyRef.onDestroy(() => {
      this.focusMonitor.stopMonitoring(this.elementRef);
    });
  }

  onActivate(event: Event): void {
    if (!this.interactive() || this.disabled()) return;
    this.selected.emit(event);
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.interactive() || this.disabled()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.selected.emit(event);
    }
  }
}

@Directive({
  selector: '[twItemLeading]',
  host: {
    '[class]': 'classes()',
  },
})
export class ItemLeadingDirective {
  private readonly item = inject(ItemComponent);
  readonly classes = this.item.leadingClasses;
}

@Directive({
  selector: '[twItemTitle]',
  host: {
    '[class]': 'classes()',
  },
})
export class ItemTitleDirective {
  private readonly item = inject(ItemComponent);
  readonly classes = this.item.titleClasses;
}

@Directive({
  selector: '[twItemDescription]',
  host: {
    '[class]': 'classes()',
  },
})
export class ItemDescriptionDirective {
  private readonly item = inject(ItemComponent);
  readonly classes = this.item.descriptionClasses;
}

@Directive({
  selector: '[twItemTrailing]',
  host: {
    '[class]': 'classes()',
  },
})
export class ItemTrailingDirective {
  private readonly item = inject(ItemComponent);
  readonly classes = this.item.trailingClasses;
}
