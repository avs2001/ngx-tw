import { InjectionToken } from '@angular/core';

/** Context object provided to popover template content. */
export interface PopoverTemplateContext<T = unknown> {
  /** The data passed via `twPopoverData` input. */
  $implicit: T;
  /** Closes the popover. */
  close: () => void;
}

/** Reference to control the popover from inside component content. */
export interface PopoverRef {
  /** Closes the popover. */
  close(): void;
  /** @internal — used by `PopoverTitleDirective` to register itself with `aria-labelledby`. */
  _addAriaLabelledBy?: (id: string) => void;
  /** @internal — used by `PopoverTitleDirective` to unregister itself. */
  _removeAriaLabelledBy?: (id: string) => void;
}

/** Injection token providing arbitrary data to popover component content. */
export const TW_POPOVER_DATA = new InjectionToken<unknown>('TW_POPOVER_DATA');

/** Injection token providing a `PopoverRef` to popover component content. */
export const TW_POPOVER_REF = new InjectionToken<PopoverRef>('TW_POPOVER_REF');

/**
 * @deprecated Renamed to {@link TW_POPOVER_DATA} for consistency with every
 * other ngx-tw injection token. This is the *same token instance*, not a copy —
 * providing under either name and injecting under the other resolves — so the
 * rename is safe to adopt incrementally. Removed in the next major.
 */
export const POPOVER_DATA = TW_POPOVER_DATA;

/**
 * @deprecated Renamed to {@link TW_POPOVER_REF} for consistency with every
 * other ngx-tw injection token. This is the *same token instance*, not a copy —
 * providing under either name and injecting under the other resolves — so the
 * rename is safe to adopt incrementally. Removed in the next major.
 */
export const POPOVER_REF = TW_POPOVER_REF;
