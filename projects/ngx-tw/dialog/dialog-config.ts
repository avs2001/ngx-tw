import { InjectionToken } from '@angular/core';
import {
  type AutoFocusTarget,
  DialogConfig as CdkDialogConfig,
  type DialogRole,
  type RestoreFocusValue,
} from '@angular/cdk/dialog';
import type { ScrollStrategy } from '@angular/cdk/overlay';

/** Preset sizes mapped to width constraints for the dialog panel. */
export type TwDialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

/** ARIA role of the dialog element. Use `'alertdialog'` for destructive confirmation prompts. */
export type TwDialogRole = DialogRole;

/** Where to move focus when the dialog opens. */
export type TwDialogAutoFocus = AutoFocusTarget | string | boolean;

/** How to restore focus on close. `true` restores to the previously focused element; a selector or element targets a specific node. */
export type TwDialogRestoreFocus = RestoreFocusValue;

/** Scroll behavior for content underneath the dialog. */
export type TwDialogScrollStrategy = 'block' | 'close' | 'reposition' | 'noop';

/**
 * Configuration for opening a dialog with {@link TwDialog.open}.
 *
 * Mirrors the shape of `@angular/cdk/dialog`'s `DialogConfig` with additional
 * tailwind-focused options (`size`, `enterAnimationDuration`, etc.).
 */
export class TwDialogConfig<D = unknown, R = unknown> extends CdkDialogConfig<D, R> {
  /** Preset size for the dialog panel. Ignored when `width`/`maxWidth` are provided. Defaults to `'md'`. */
  size?: TwDialogSize = 'md';

  /** Duration of the open animation in ms. Defaults to `150`. Use `0` to disable. */
  enterAnimationDuration?: number = 150;

  /** Duration of the close animation in ms. Defaults to `120`. Use `0` to disable. */
  exitAnimationDuration?: number = 120;

  /** Scroll strategy preset applied when `scrollStrategy` isn't set. Defaults to `'block'`. */
  scrollBehavior?: TwDialogScrollStrategy = 'block';

  /** Maximum width. Number values are treated as pixels. Defaults to `'calc(100vw - 32px)'`. */
  override maxWidth?: number | string = 'calc(100vw - 32px)';
}

/** Injection token carrying the `data` value passed via {@link TwDialogConfig.data}. */
export const TW_DIALOG_DATA = new InjectionToken<unknown>('TW_DIALOG_DATA');

/** Injection token for application-wide default dialog options. Set via `provideTwDialog()`. */
export const TW_DIALOG_DEFAULT_OPTIONS = new InjectionToken<Partial<TwDialogConfig>>(
  'TW_DIALOG_DEFAULT_OPTIONS',
);
