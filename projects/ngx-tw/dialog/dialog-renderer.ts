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
  createNoopScrollStrategy,
  createRepositionScrollStrategy,
  type ScrollStrategy,
} from '@angular/cdk/overlay';
import type { ComponentType } from '@angular/cdk/portal';
import {
  TW_DIALOG_DATA,
  TwDialogConfig,
  type TwDialogScrollStrategy,
} from './dialog-config';
import { DialogContainer } from './dialog-container';
import { TwDialogRef } from './dialog-ref';

/**
 * Rendering half of the dialog feature: the only module that pulls in
 * `@angular/cdk/dialog`, the overlay scroll strategies, and the Tailwind
 * `DialogContainer`. Reached exclusively through a dynamic `import()` in
 * {@link TwDialog}, which is what keeps that graph out of a consumer's initial
 * bundle. Nothing here may be imported as a value from `dialog.ts`.
 *
 * @docs-private
 */
export function openRenderedDialog<R, D, C>(
  injector: Injector,
  content: ComponentType<C> | TemplateRef<C>,
  merged: TwDialogConfig<D, R>,
  twRef: TwDialogRef<R, C>,
): void {
  // `Dialog` is `providedIn: 'root'`, so resolving it here — rather than
  // injecting it into the service — keeps the CDK symbol in this lazy chunk.
  const cdkDialog = injector.get(Dialog);

  const cdkRef = cdkDialog.open<R, D, C>(content, {
    id: merged.id,
    role: merged.role,
    data: merged.data,
    panelClass: merged.panelClass,
    backdropClass: merged.backdropClass ?? 'tw-dialog-backdrop',
    hasBackdrop: merged.hasBackdrop,
    width: merged.width,
    height: merged.height,
    minWidth: merged.minWidth,
    minHeight: merged.minHeight,
    maxWidth: merged.maxWidth,
    maxHeight: merged.maxHeight,
    direction: merged.direction,
    ariaDescribedBy: merged.ariaDescribedBy,
    ariaLabelledBy: merged.ariaLabelledBy,
    ariaLabel: merged.ariaLabel,
    ariaModal: merged.ariaModal,
    autoFocus: merged.autoFocus,
    restoreFocus: merged.restoreFocus,
    scrollStrategy:
      merged.scrollStrategy ?? resolveScrollStrategy(injector, merged.scrollBehavior),
    closeOnNavigation: merged.closeOnNavigation,
    viewContainerRef: merged.viewContainerRef,
    injector: merged.injector,
    // We handle close/Escape/backdrop ourselves so we can run the exit animation.
    disableClose: true,
    closeOnOverlayDetachments: false,
    container: {
      type: DialogContainer,
      providers: () => [
        { provide: TwDialogConfig, useValue: merged },
        { provide: CdkDialogConfig, useValue: merged },
      ],
    },
    providers: (cdkRef, _cdkConfig, container) => {
      // Wire the facade to its CDK backend at the exact point the ref
      // constructor ran before deferral, so animation subscriptions are live
      // before the container emits.
      twRef._attach(cdkRef, container as DialogContainer);
      const providers: StaticProvider[] = [
        { provide: TwDialogRef, useValue: twRef },
        { provide: TW_DIALOG_DATA, useValue: merged.data ?? null },
      ];
      if (Array.isArray(merged.providers)) providers.push(...merged.providers);
      return providers;
    },
  });

  twRef._setComponent(
    cdkRef.componentInstance as C | null,
    cdkRef.componentRef as ComponentRef<C> | null,
  );
}

function resolveScrollStrategy(
  injector: Injector,
  strategy: TwDialogScrollStrategy | undefined,
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
