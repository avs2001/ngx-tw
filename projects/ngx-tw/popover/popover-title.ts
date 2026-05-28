import {
  Directive,
  ElementRef,
  inject,
  input,
  type OnDestroy,
  type OnInit,
} from '@angular/core';
import { _IdGenerator } from '@angular/cdk/a11y';
import { POPOVER_REF } from './popover-tokens';

/**
 * Popover title. Registers its ID with the enclosing popover overlay's
 * `aria-labelledby` queue so screen readers announce it automatically.
 *
 * Mirrors `DialogTitleDirective` and is the recommended way to label a
 * popover whose content has a heading. Use `twPopoverAriaLabel` when no
 * heading is present.
 */
@Directive({
  selector: '[twPopoverTitle], tw-popover-title',
  host: {
    class: 'text-sm font-semibold text-fg',
    '[id]': 'id()',
  },
})
export class PopoverTitleDirective implements OnInit, OnDestroy {
  private readonly generatedId = inject(_IdGenerator).getId('tw-popover-title-');
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly popoverRef = inject(POPOVER_REF, { optional: true });

  /** Custom id for the title element. Defaults to a generated unique id. */
  readonly id = input<string>(this.generatedId);

  ngOnInit(): void {
    this.popoverRef?._addAriaLabelledBy?.(this.id());
  }

  ngOnDestroy(): void {
    this.popoverRef?._removeAriaLabelledBy?.(this.id());
  }
}
