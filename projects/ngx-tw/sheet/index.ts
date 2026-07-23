export { Sheet, provideSheet } from './sheet';
export { SheetRef } from './sheet-ref';
// `SheetContainer` is the internal render surface — it now lives in the
// dynamically-imported renderer chunk and is no longer part of the public API.
// Only its lifecycle types remain exported.
export type {
  SheetAnimationEvent,
  SheetState,
} from './sheet-container';
export {
  SheetConfig,
  SHEET_DATA,
  SHEET_DEFAULT_OPTIONS,
  type SheetSide,
  type SheetSize,
  type SheetRole,
  type SheetAutoFocus,
  type SheetRestoreFocus,
  type SheetScrollStrategy,
} from './sheet-config';
export {
  SheetTitleDirective,
  SheetSubtitleDirective,
  SheetDescriptionDirective,
  SheetContentDirective,
  SheetActionsDirective,
  SheetCloseDirective,
  SheetIconDirective,
  SheetHeaderDirective,
  type SheetActionsAlign,
} from './sheet-content';
