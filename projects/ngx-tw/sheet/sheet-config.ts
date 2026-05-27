import { InjectionToken } from '@angular/core';
import {
  type AutoFocusTarget,
  DialogConfig as CdkDialogConfig,
  type DialogRole,
  type RestoreFocusValue,
} from '@angular/cdk/dialog';

/** Edge the sheet anchors against. */
export type SheetSide = 'top' | 'right' | 'bottom' | 'left';

/**
 * Preset size for the sheet panel.
 *
 * Sizing is axis-dependent:
 *  - `'left' | 'right'` — controls panel width (height is always `100vh`).
 *  - `'top'  | 'bottom'` — controls panel height (width is always `100vw`).
 */
export type SheetSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** ARIA role of the sheet element. Use `'alertdialog'` for destructive confirmation surfaces. */
export type SheetRole = DialogRole;

/** Where to move focus when the sheet opens. */
export type SheetAutoFocus = AutoFocusTarget | string | boolean;

/** How to restore focus on close. `true` restores to the previously focused element; a selector or element targets a specific node. */
export type SheetRestoreFocus = RestoreFocusValue;

/** Scroll behavior for content underneath the sheet. */
export type SheetScrollStrategy = 'block' | 'close' | 'reposition' | 'noop';

/**
 * Configuration for opening a sheet with {@link Sheet.open}.
 *
 * Extends `@angular/cdk/dialog`'s `DialogConfig` with sheet-specific options
 * (`side`, `size`, animation durations, split close flags).
 */
export class SheetConfig<D = unknown, R = unknown> extends CdkDialogConfig<D, R> {
  /** Edge the sheet anchors against. Defaults to `'right'`. */
  side?: SheetSide = 'right';

  /** Preset size for the sheet panel. Axis-dependent (width for left/right, height for top/bottom). Defaults to `'md'`. */
  size?: SheetSize = 'md';

  /** Duration of the open slide animation in ms. Defaults to `200`. Use `0` to disable. */
  enterAnimationDuration?: number = 200;

  /**
   * Duration of the close slide animation in ms. Defaults to `160`. Use `0` to disable.
   * Asymmetric with `enterAnimationDuration` by design — the close transition is slightly
   * faster so the sheet feels dismissive rather than reluctant.
   */
  exitAnimationDuration?: number = 160;

  /** Scroll strategy preset applied when `scrollStrategy` isn't set. Defaults to `'block'`. */
  scrollBehavior?: SheetScrollStrategy = 'block';

  /**
   * Whether the sheet is modal — sets `aria-modal` on the container. Defaults to `true`:
   * a sheet opened over the page is modal by default and the rest of the document is
   * inert while it is open. Set to `false` only for non-modal surfaces.
   */
  override ariaModal?: boolean = true;

  /** Whether the sheet renders a backdrop. Defaults to `true`. */
  override hasBackdrop?: boolean = true;

  /**
   * Whether pressing `Escape` closes the sheet.
   *
   * Defaults to `true` — Escape is the universal dismiss key for modal surfaces; the
   * "swallow Escape" variant is the special case. `disableClose` overrides this when
   * `true`.
   */
  closeOnEscape?: boolean = true;

  /**
   * Whether clicking the backdrop closes the sheet.
   *
   * Defaults to `true` — clicking outside a modal sheet is the expected dismiss
   * gesture; enforcing an explicit dismiss button is the special case. `disableClose`
   * overrides this when `true`.
   */
  closeOnBackdropClick?: boolean = true;

  /**
   * Whether Escape AND backdrop clicks are blocked. Defaults to `false`.
   * When `true`, this overrides both `closeOnEscape` and `closeOnBackdropClick`.
   */
  override disableClose?: boolean = false;

  /** Whether navigation (e.g. router) closes the sheet. Defaults to `true`. */
  override closeOnNavigation?: boolean = true;

  /** Where to move focus when the sheet opens. Defaults to `'first-tabbable'`. */
  override autoFocus?: SheetAutoFocus = 'first-tabbable';

  /** Whether to restore focus to the previously focused element after close. Defaults to `true`. */
  override restoreFocus?: SheetRestoreFocus = true;
}

/** Injection token carrying the `data` value passed via {@link SheetConfig.data}. */
export const SHEET_DATA = new InjectionToken<unknown>('SHEET_DATA');

/** Injection token for application-wide default sheet options. Set via `provideSheet()`. */
export const SHEET_DEFAULT_OPTIONS = new InjectionToken<Partial<SheetConfig>>(
  'SHEET_DEFAULT_OPTIONS',
);
