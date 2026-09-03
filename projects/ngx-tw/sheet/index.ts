export { Sheet, provideSheet } from './sheet';
export { SheetRef } from './sheet-ref';
// `SheetContainer` is the render surface. At **runtime** it lives in the
// dynamically-imported renderer chunk and is never constructed by consumers —
// which is why it is exported `type`-only here: a value export would pull the
// class back into the eager `sheet` chunk and undo the deferral.
//
// Its **type**, however, is public whether we like it or not:
// `SheetRef.containerInstance` is a documented getter that returns it, so
// ng-packagr emits the whole class declaration into the shipped rollup and a
// consumer reading that getter had no way to name what they were handed. The
// comment that used to sit here said the type was "no longer part of the
// public API", which was true of the runtime chunk and false of the `.d.ts`.
export type {
  SheetContainer,
  SheetAnimationEvent,
  SheetState,
} from './sheet-container';
export {
  SheetConfig,
  TW_SHEET_DATA,
  TW_SHEET_DEFAULT_OPTIONS,
  /** @deprecated Use `TW_SHEET_DATA` — same token instance. */
  SHEET_DATA,
  /** @deprecated Use `TW_SHEET_DEFAULT_OPTIONS` — same token instance. */
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
