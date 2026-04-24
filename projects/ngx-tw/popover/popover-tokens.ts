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
}

/** Injection token providing arbitrary data to popover component content. */
export const POPOVER_DATA = new InjectionToken<unknown>('POPOVER_DATA');

/** Injection token providing a `PopoverRef` to popover component content. */
export const POPOVER_REF = new InjectionToken<PopoverRef>('POPOVER_REF');
