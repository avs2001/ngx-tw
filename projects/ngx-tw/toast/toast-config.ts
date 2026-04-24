import { InjectionToken, type TemplateRef, type Type } from '@angular/core';
import type { ToastRef } from './toast-ref';

/** Severity variant — drives color palette, default icon, and live-region politeness. */
export type ToastSeverity = 'info' | 'success' | 'warning' | 'error' | 'neutral';

/** Screen anchor for a stack of toasts. One CDK overlay is created per position on first use. */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Lifecycle state of a single toast. */
export type ToastState = 'entering' | 'visible' | 'paused' | 'dismissing' | 'dismissed';

/** Reason a toast was dismissed. */
export type ToastDismissReason =
  | 'action'
  | 'timeout'
  | 'swipe'
  | 'manual'
  | 'programmatic'
  | 'max-exceeded';

/** Payload forwarded to `afterDismissed()` subscribers. */
export interface ToastDismissal<R = unknown> {
  /** Why the toast closed. */
  reason: ToastDismissReason;
  /** Optional value forwarded from `ref.dismiss(result)`. */
  result?: R;
}

/** Context object handed to `TemplateRef` content (`let-data let-ref="ref"`). */
export interface ToastTemplateContext<T = unknown> {
  /** Data value from `config.data`, unwrapped as the template's `$implicit`. */
  $implicit: T;
  /** Reference to the toast itself, bound as `let-ref="ref"`. */
  ref: ToastRef<unknown, unknown>;
}

/** Action button configuration. When `handler` is omitted the button dismisses the toast with reason `'action'`. */
export interface ToastAction {
  /** Visible label of the action button. */
  label: string;
  /** Optional callback invoked when the action is clicked or `ref.triggerAction()` is called. */
  handler?: (ref: ToastRef) => void;
}

/**
 * Per-call configuration for {@link ToastService} methods. Also used as the
 * payload of {@link TW_TOAST_DEFAULT_OPTIONS} for app-wide defaults.
 */
export class ToastConfig<D = unknown, R = unknown> {
  /** Severity of the toast. Defaults to `'info'`. */
  severity?: ToastSeverity = 'info';

  /** Screen position of the toast stack. Defaults to `'bottom-right'`. */
  position?: ToastPosition = 'bottom-right';

  /** Auto-dismiss duration in ms. `0` disables auto-dismiss. Defaults to `5000`. */
  duration?: number = 5000;

  /** When true, renders a close (×) button. Defaults to `true`. */
  dismissible?: boolean = true;

  /**
   * Live-region politeness. When omitted, resolves to `'assertive'` for
   * `severity: 'error'` and `'polite'` otherwise. Pass `'off'` to skip
   * `LiveAnnouncer` entirely.
   */
  politeness?: 'polite' | 'assertive' | 'off';

  /** Action button configuration. Omit to hide the action button. */
  action?: ToastAction;

  /** Arbitrary data provided to component / template content via `TW_TOAST_DATA`. */
  data?: D | null = null;

  /** Extra CSS classes merged onto the toast panel root via `twMerge`. */
  panelClass?: string | string[];

  /**
   * Icon override. Pass a string (treated as text glyph / icon name), a
   * `TemplateRef` to render arbitrary markup, or `false` to hide the icon.
   * When omitted the severity-default icon is used.
   */
  icon?: string | TemplateRef<void> | false;

  /** When true, pause the auto-dismiss timer while the toast is hovered or holds focus. Defaults to `true`. */
  pauseOnInteraction?: boolean = true;

  /** Enable horizontal swipe-to-dismiss via pointer gestures. Defaults to `true`. */
  swipeToDismiss?: boolean = true;

  /**
   * Maximum visible toasts *per position*. When exceeded, the oldest toast in
   * that position dismisses with reason `'max-exceeded'`. Defaults to `5`.
   */
  maxVisible?: number = 5;

  /** Explicit id. When omitted a unique id is generated. */
  id?: string;

  /** Accessible label applied to the toast element. When omitted, text content is used. */
  ariaLabel?: string;

  /** Accessible label applied to the per-position `role="region"` container. Defaults to `'Notifications'`. */
  regionAriaLabel?: string;
}

/** Injection token providing `config.data` to projected component / template content. */
export const TW_TOAST_DATA = new InjectionToken<unknown>('TW_TOAST_DATA');

/** Injection token providing the owning {@link ToastRef} to projected component content. */
export const TW_TOAST_REF = new InjectionToken<ToastRef>('TW_TOAST_REF');

/** Injection token carrying application-wide toast defaults. Set via `provideToast(defaults)`. */
export const TW_TOAST_DEFAULT_OPTIONS = new InjectionToken<Partial<ToastConfig>>(
  'TW_TOAST_DEFAULT_OPTIONS',
);

/** Accepted content forms for `ToastService.show()`. */
export type ToastContent = string | TemplateRef<ToastTemplateContext> | Type<unknown>;
