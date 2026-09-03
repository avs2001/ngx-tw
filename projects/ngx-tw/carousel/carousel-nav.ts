/**
 * `[twCarouselPrev]` / `[twCarouselNext]` — the prev/next navigation
 * directives applied to a consumer's own button primitive.
 *
 * Both inject `CarouselComponent` and are never referenced by it, so the
 * import edge to `./carousel` is strictly one-way.
 */

import { computed, Directive, ElementRef, inject } from '@angular/core';

import { CarouselComponent } from './carousel';

// ── Prev / Next directives ────────────────────────────────────────

/**
 * Apply to any focusable element (typically `<button>`) inside a `<tw-carousel>`
 * to navigate to the previous page. Auto-disables at the first slide when the
 * carousel is not looping. Sets `aria-label` to `labels.previous` unless the
 * host already carries `aria-label` or `aria-labelledby`.
 */
@Directive({
  selector: '[twCarouselPrev]',
  host: {
    '(click)': '_onClick($event)',
    '[attr.aria-label]': '_ariaLabel()',
    '[attr.disabled]': '_isButtonDisabled()',
    '[attr.aria-disabled]': '_isDisabled() ? "true" : null',
    '[attr.tabindex]': '_isTabindex()',
  },
})
export class CarouselPrevDirective {
  /** @internal Parent carousel. */
  readonly carousel = inject(CarouselComponent);

  private readonly _hostEl = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly _consumerLabel = this._hostEl.getAttribute('aria-label');
  private readonly _hasLabelledBy = this._hostEl.hasAttribute('aria-labelledby');
  private readonly _isButton = this._hostEl.tagName === 'BUTTON';

  /** @internal True when prev is unavailable (at start and !loop). */
  readonly _isDisabled = computed<boolean>(
    () => !this.carousel.loop() && this.carousel.isAtStart(),
  );

  _ariaLabel(): string | null {
    // Consumer-provided aria-label wins outright. Consumer-provided
    // aria-labelledby suppresses our binding so the two labels don't compete.
    if (this._consumerLabel !== null) return this._consumerLabel;
    if (this._hasLabelledBy) return null;
    return this.carousel.resolvedLabels().previous;
  }

  _isButtonDisabled(): string | null {
    return this._isButton && this._isDisabled() ? '' : null;
  }

  _isTabindex(): string | null {
    return !this._isButton && this._isDisabled() ? '-1' : null;
  }

  _onClick(event: Event): void {
    if (this._isDisabled()) {
      event.preventDefault();
      return;
    }
    this.carousel._setLastInteractionSource('button');
    this.carousel.prev();
  }
}

/**
 * Apply to any focusable element (typically `<button>`) inside a `<tw-carousel>`
 * to navigate to the next page. Auto-disables at the last page when the
 * carousel is not looping. Sets `aria-label` to `labels.next` unless the host
 * already carries `aria-label` or `aria-labelledby`.
 */
@Directive({
  selector: '[twCarouselNext]',
  host: {
    '(click)': '_onClick($event)',
    '[attr.aria-label]': '_ariaLabel()',
    '[attr.disabled]': '_isButtonDisabled()',
    '[attr.aria-disabled]': '_isDisabled() ? "true" : null',
    '[attr.tabindex]': '_isTabindex()',
  },
})
export class CarouselNextDirective {
  /** @internal Parent carousel. */
  readonly carousel = inject(CarouselComponent);

  private readonly _hostEl = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly _consumerLabel = this._hostEl.getAttribute('aria-label');
  private readonly _hasLabelledBy = this._hostEl.hasAttribute('aria-labelledby');
  private readonly _isButton = this._hostEl.tagName === 'BUTTON';

  readonly _isDisabled = computed<boolean>(
    () => !this.carousel.loop() && this.carousel.isAtEnd(),
  );

  _ariaLabel(): string | null {
    if (this._consumerLabel !== null) return this._consumerLabel;
    if (this._hasLabelledBy) return null;
    return this.carousel.resolvedLabels().next;
  }

  _isButtonDisabled(): string | null {
    return this._isButton && this._isDisabled() ? '' : null;
  }

  _isTabindex(): string | null {
    return !this._isButton && this._isDisabled() ? '-1' : null;
  }

  _onClick(event: Event): void {
    if (this._isDisabled()) {
      event.preventDefault();
      return;
    }
    this.carousel._setLastInteractionSource('button');
    this.carousel.next();
  }
}
