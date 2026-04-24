import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  forwardRef,
  input,
  model,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import {
  CollapsibleComponent,
  CollapsibleGroupComponent,
  CollapsibleTriggerDirective,
} from 'ngx-tw/collapsible';

/** Open mode of the accordion. */
export type AccordionType = 'single' | 'multiple';

/** Visual style of the accordion container. */
export type AccordionVariant = 'default' | 'bordered' | 'ghost';

// ── tv() config ──

const accordionVariants = tv(
  {
    slots: {
      root: 'block',
    },
    variants: {
      variant: {
        default: {
          root: 'rounded-lg overflow-hidden divide-y divide-border',
        },
        bordered: {
          root: 'rounded-lg overflow-hidden divide-y divide-border border border-border',
        },
        ghost: {
          root: '',
        },
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
  {
    twMerge: true,
  },
);

// ── AccordionComponent ──

@Component({
  selector: 'tw-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'role': 'group',
    '[class]': 'rootClasses()',
  },
  template: `<ng-content />`,
  providers: [
    {
      provide: CollapsibleGroupComponent,
      useExisting: forwardRef(() => AccordionComponent),
    },
  ],
})
export class AccordionComponent {
  /** Open mode. `'single'` allows one panel open at a time; `'multiple'` allows many. Defaults to `'single'`. */
  readonly type = input<AccordionType>('single');

  /** Visual style of the accordion container. Defaults to `'default'`. */
  readonly variant = input<AccordionVariant>('default');

  /** In `'single'` mode, whether re-clicking the open panel closes it. Defaults to `true`. */
  readonly collapsible = input(true, { transform: booleanAttribute });

  /** Open panel value(s). String in `'single'` mode, string[] in `'multiple'` mode. Two-way bindable. */
  readonly value = model<string | string[]>('');

  /** @internal */
  readonly items = contentChildren(CollapsibleComponent);

  /** @internal */
  readonly triggers = contentChildren(CollapsibleTriggerDirective, { descendants: true });

  /** @internal */
  readonly rootClasses = computed(() =>
    accordionVariants({ variant: this.variant() }).root(),
  );

  constructor() {
    afterNextRender(() => {
      this.syncChildrenFromValue();
    });

    effect(() => {
      const val = this.value();
      const items = this.items();
      if (items.length === 0) return;

      const isSingle = this.type() === 'single';
      for (const item of items) {
        const itemValue = item.value();
        if (isSingle) {
          item.setOpen(itemValue === val);
        } else {
          const openValues = Array.isArray(val) ? val : [];
          item.setOpen(openValues.includes(itemValue));
        }
      }
    });
  }

  private syncChildrenFromValue(): void {
    const val = this.value();
    const items = this.items();
    const isSingle = this.type() === 'single';
    for (const item of items) {
      const itemValue = item.value();
      if (isSingle) {
        item.setOpen(itemValue === val);
      } else {
        const openValues = Array.isArray(val) ? val : [];
        item.setOpen(openValues.includes(itemValue));
      }
    }
  }

  /** @internal Called by a child collapsible when it is toggled. */
  toggleItem(item: CollapsibleComponent): void {
    const itemValue = item.value();
    const isCurrentlyOpen = item.open();
    const next = !isCurrentlyOpen;

    if (this.type() === 'single') {
      if (next) {
        for (const child of this.items()) {
          if (child !== item) child.setOpen(false);
        }
        item.setOpen(true);
        this.value.set(itemValue);
      } else {
        if (!this.collapsible()) return;
        item.setOpen(false);
        this.value.set('');
      }
    } else {
      item.setOpen(next);
      const currentOpen = this.items()
        .filter(i => i.open())
        .map(i => i.value());
      this.value.set(currentOpen);
    }

    item.toggled.emit(next);
    item.announceState(next);
  }

  /** @internal Handle keyboard navigation within the accordion. */
  onTriggerKeydown(event: KeyboardEvent): void {
    const triggers = this.triggers();
    if (triggers.length === 0) return;

    const currentIndex = triggers.findIndex(
      t => t.elementRef.nativeElement === document.activeElement,
    );

    let targetIndex = -1;

    switch (event.key) {
      case 'ArrowDown':
        targetIndex = this.findNextEnabledIndex(currentIndex, 1);
        break;
      case 'ArrowUp':
        targetIndex = this.findNextEnabledIndex(currentIndex, -1);
        break;
      case 'Home':
        targetIndex = this.findFirstEnabledIndex();
        break;
      case 'End':
        targetIndex = this.findLastEnabledIndex();
        break;
      default:
        return;
    }

    if (targetIndex >= 0) {
      event.preventDefault();
      triggers[targetIndex].focus();
    }
  }

  private findNextEnabledIndex(from: number, direction: 1 | -1): number {
    const items = this.items();
    const len = items.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + direction + len) % len;
      if (!items[idx].disabled()) return idx;
    }
    return -1;
  }

  private findFirstEnabledIndex(): number {
    return this.items().findIndex(item => !item.disabled());
  }

  private findLastEnabledIndex(): number {
    const items = this.items();
    for (let i = items.length - 1; i >= 0; i--) {
      if (!items[i].disabled()) return i;
    }
    return -1;
  }
}
