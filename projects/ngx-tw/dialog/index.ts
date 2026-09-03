export { TwDialog, provideTwDialog } from './dialog';
export { TwDialogRef } from './dialog-ref';
// `DialogContainer` is the render surface. Its *runtime* is not part of the
// public API — the class lives in the dynamically-imported renderer chunk and
// is deliberately not exported as a value, so nothing outside the library can
// construct or declare it. Its *type* is public, because
// `TwDialogRef.containerInstance` is a documented getter that returns it and a
// consumer must be able to name what it hands back. Export it type-only.
export type {
  DialogAnimationEvent,
  DialogContainer,
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
