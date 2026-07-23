export { TwDialog, provideTwDialog } from './dialog';
export { TwDialogRef } from './dialog-ref';
// `DialogContainer` is the internal render surface — it now lives in the
// dynamically-imported renderer chunk and is no longer part of the public API.
// Only its lifecycle types remain exported.
export type {
  DialogAnimationEvent,
  DialogState,
} from './dialog-container';
export {
  TwDialogConfig,
  TW_DIALOG_DATA,
  TW_DIALOG_DEFAULT_OPTIONS,
  type TwDialogSize,
  type TwDialogRole,
  type TwDialogAutoFocus,
  type TwDialogRestoreFocus,
  type TwDialogScrollStrategy,
} from './dialog-config';
export {
  DialogTitleDirective,
  DialogSubtitleDirective,
  DialogDescriptionDirective,
  DialogContentDirective,
  DialogActionsDirective,
  DialogCloseDirective,
  DialogIconDirective,
  DialogHeaderDirective,
  type DialogActionsAlign,
} from './dialog-content';
