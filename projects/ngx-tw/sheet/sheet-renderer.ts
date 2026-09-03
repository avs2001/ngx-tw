import {
  type ComponentRef,
  type Injector,
  type StaticProvider,
  type TemplateRef,
} from '@angular/core';
import { Dialog, DialogConfig as CdkDialogConfig } from '@angular/cdk/dialog';
import {
  createBlockScrollStrategy,
  createCloseScrollStrategy,
  createGlobalPositionStrategy,
  createNoopScrollStrategy,
  createRepositionScrollStrategy,
  type GlobalPositionStrategy,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import {
  TW_SHEET_DATA,
  SheetConfig,
  type SheetScrollStrategy,
  type SheetSide,
} from './sheet-config';
import { SheetContainer } from './sheet-container';
import { SheetRef } from './sheet-ref';

/**
 * Rendering half of the sheet feature: the only module that pulls in
 * `@angular/cdk/dialog`, the overlay position/scroll strategies, and the
 * Tailwind `SheetContainer`. Reached exclusively through a dynamic `import()`
 * in {@link Sheet}, which keeps that graph out of a consumer's initial bundle.
 * Nothing here may be imported as a value from `sheet.ts`.
 *
 * @docs-private
 */
export function openRenderedSheet<R, D, C>(
  injector: Injector,
  content: ComponentType<C> | TemplateRef<C>,
  merged: SheetConfig<D, R>,
  sheetRef: SheetRef<R, C>,
): void {
  // `Dialog` is `providedIn: 'root'`, so resolving it here — rather than
  // injecting it into the service — keeps the CDK symbol in this lazy chunk.
  const cdkDialog = injector.get(Dialog);

  const cdkRef = cdkDialog.open<R, D, C>(content, {
    id: merged.id,
    role: merged.role,
    data: merged.data,
    panelClass: merged.panelClass,
    backdropClass: merged.backdropClass || 'tw-sheet-backdrop',
    hasBackdrop: merged.hasBackdrop,
    // Sheet sizing happens on the container element (axis-aware width/height
    // utilities). The overlay pane itself is the full-edge bounding box.
    direction: merged.direction,
    ariaDescribedBy: merged.ariaDescribedBy,
    ariaLabelledBy: merged.ariaLabelledBy,
    ariaLabel: merged.ariaLabel,
    ariaModal: merged.ariaModal,
    autoFocus: merged.autoFocus,
    restoreFocus: merged.restoreFocus,
    scrollStrategy:
      merged.scrollStrategy ?? resolveScrollStrategy(injector, merged.scrollBehavior),
    positionStrategy:
      merged.positionStrategy ?? resolvePositionStrategy(injector, merged.side ?? 'right'),
    closeOnNavigation: merged.closeOnNavigation,
    viewContainerRef: merged.viewContainerRef,
    injector: merged.injector,
    // We handle close/Escape/backdrop ourselves so we can run the exit slide animation.
    disableClose: true,
    closeOnOverlayDetachments: false,
    container: {
      type: SheetContainer,
      providers: () => [
        { provide: SheetConfig, useValue: merged },
        { provide: CdkDialogConfig, useValue: merged },
      ],
    },
    providers: (cdkRef, _cdkConfig, container) => {
      sheetRef._attach(cdkRef, container as SheetContainer);
      const providers: StaticProvider[] = [
        { provide: SheetRef, useValue: sheetRef },
        { provide: TW_SHEET_DATA, useValue: merged.data ?? null },
      ];
      if (Array.isArray(merged.providers)) providers.push(...merged.providers);
      return providers;
    },
  });

  sheetRef._setComponent(
    cdkRef.componentInstance as C | null,
    cdkRef.componentRef as ComponentRef<C> | null,
  );
}

function resolveScrollStrategy(
  injector: Injector,
  strategy: SheetScrollStrategy | undefined,
): ScrollStrategy {
  switch (strategy) {
    case 'close':
      return createCloseScrollStrategy(injector);
    case 'reposition':
      return createRepositionScrollStrategy(injector);
    case 'noop':
      return createNoopScrollStrategy();
    case 'block':
    default:
      return createBlockScrollStrategy(injector);
  }
}

function resolvePositionStrategy(injector: Injector, side: SheetSide): GlobalPositionStrategy {
  const strategy = createGlobalPositionStrategy(injector);
  switch (side) {
    case 'left':
      return strategy.top('0').left('0').bottom('0');
    case 'top':
      return strategy.top('0').left('0').right('0');
    case 'bottom':
      return strategy.bottom('0').left('0').right('0');
    case 'right':
    default:
      return strategy.top('0').right('0').bottom('0');
  }
}
