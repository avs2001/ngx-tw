import { type ComponentRef, type Injector, TemplateRef, type Type } from '@angular/core';
import {
  createGlobalPositionStrategy,
  Overlay,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { type ToastPosition } from './toast-config';
import { ToastContainerComponent } from './toast-container';
import type { ToastRef } from './toast-ref';

const OVERLAY_EDGE_OFFSET = '1rem';

interface PositionOverlay {
  overlayRef: OverlayRef;
  containerRef: ComponentRef<ToastContainerComponent>;
}

/**
 * Rendering half of the toast feature: owns the CDK overlays, the per-position
 * {@link ToastContainerComponent} instances, and every `LiveAnnouncer` call.
 *
 * This module is reached only through a dynamic `import()` in `ToastService`,
 * which is what keeps `@angular/cdk/overlay`, the toast components, and
 * `tailwind-variants` out of a consumer's initial bundle. Nothing here may be
 * imported statically from `toast.ts` — a value import (as opposed to a
 * `import type`) would pull the whole graph back into the eager chunk and
 * silently undo the split. See `toast.spec.ts` for the guard test.
 *
 * @docs-private
 */
export class ToastRenderer {
  private readonly overlay: Overlay;
  private readonly positionOverlays = new Map<ToastPosition, PositionOverlay>();
  private disposed = false;

  constructor(
    private readonly injector: Injector,
    private readonly regionAriaLabel: string,
  ) {
    // Resolved here rather than injected into `ToastService`, so the `Overlay`
    // symbol lives in this lazily-loaded chunk. It is `providedIn: 'root'`, so
    // no eager provider is required.
    this.overlay = injector.get(Overlay);
  }

  /**
   * Render a toast into its position container, creating the overlay on first
   * use. Returns `false` if the renderer has already been disposed.
   */
  attach(ref: ToastRef, position: ToastPosition): boolean {
    if (this.disposed) return false;
    const entry = this.getContainerForPosition(position);
    const instance = entry.containerRef.instance;

    // Component-class content needs an injector built from the container, so
    // the portal cannot be created until the container exists.
    const content = ref.content();
    if (isComponentConstructor(content)) {
      ref._portal = new ComponentPortal(content, null, instance._createContentInjector(ref));
    }

    instance.visibleRefs.update((list) => [...list, ref]);
    ref._overlayPanelElement = entry.overlayRef.overlayElement;
    return true;
  }

  /** Announce a freshly attached toast to assistive technology. */
  announceOpen(ref: ToastRef): void {
    this.containerFor(ref)?._announceOpen(ref);
  }

  /** Re-announce a toast whose content or severity changed via `update()`. */
  announceUpdate(ref: ToastRef): void {
    this.containerFor(ref)?._announceUpdate(ref);
  }

  /** Drop a dismissed toast from its container's render list. */
  detach(ref: ToastRef): void {
    const instance = this.containerFor(ref);
    if (!instance) return;
    instance.visibleRefs.update((list) => list.filter((r) => r !== ref));
  }

  /** Tear down every overlay this renderer created. */
  dispose(): void {
    this.disposed = true;
    for (const { overlayRef } of this.positionOverlays.values()) {
      overlayRef.dispose();
    }
    this.positionOverlays.clear();
  }

  private containerFor(ref: ToastRef): ToastContainerComponent | undefined {
    return this.positionOverlays.get(ref.config.position ?? 'bottom-right')?.containerRef
      .instance;
  }

  private getContainerForPosition(position: ToastPosition): PositionOverlay {
    const existing = this.positionOverlays.get(position);
    if (existing) return existing;

    const overlayRef = this.overlay.create({
      positionStrategy: this.buildPositionStrategy(position),
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      hasBackdrop: false,
      panelClass: ['tw-toast-overlay', `tw-toast-overlay-${position}`],
    });

    const containerPortal = new ComponentPortal(
      ToastContainerComponent,
      null,
      this.injector,
    );
    const containerRef = overlayRef.attach(containerPortal);
    containerRef.instance.position.set(position);
    containerRef.instance.regionLabel.set(this.regionAriaLabel);

    const entry: PositionOverlay = { overlayRef, containerRef };
    this.positionOverlays.set(position, entry);
    return entry;
  }

  private buildPositionStrategy(position: ToastPosition) {
    const strategy = createGlobalPositionStrategy(this.injector);
    switch (position) {
      case 'top-right':
        strategy.top(OVERLAY_EDGE_OFFSET).right(OVERLAY_EDGE_OFFSET);
        break;
      case 'top-left':
        strategy.top(OVERLAY_EDGE_OFFSET).left(OVERLAY_EDGE_OFFSET);
        break;
      case 'top-center':
        strategy.top(OVERLAY_EDGE_OFFSET).centerHorizontally();
        break;
      case 'bottom-right':
        strategy.bottom(OVERLAY_EDGE_OFFSET).right(OVERLAY_EDGE_OFFSET);
        break;
      case 'bottom-left':
        strategy.bottom(OVERLAY_EDGE_OFFSET).left(OVERLAY_EDGE_OFFSET);
        break;
      case 'bottom-center':
        strategy.bottom(OVERLAY_EDGE_OFFSET).centerHorizontally();
        break;
    }
    return strategy;
  }

}

function isComponentConstructor(value: unknown): value is Type<unknown> {
  return typeof value === 'function' && !(value instanceof TemplateRef);
}
