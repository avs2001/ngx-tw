import {
  type ComponentRef,
  type EnvironmentProviders,
  Injectable,
  Injector,
  type OnDestroy,
  type Provider,
  type Signal,
  TemplateRef,
  type Type,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import {
  createGlobalPositionStrategy,
  Overlay,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { type Observable, Subject, defer, startWith } from 'rxjs';
import {
  TW_TOAST_DATA,
  TW_TOAST_DEFAULT_OPTIONS,
  TW_TOAST_REF,
  ToastConfig,
  type ToastContent,
  type ToastPosition,
  type ToastSeverity,
  type ToastTemplateContext,
} from './toast-config';
import { ToastContainerComponent } from './toast-container';
import { ToastRef } from './toast-ref';

const OVERLAY_EDGE_OFFSET = '1rem';

interface PositionOverlay {
  overlayRef: OverlayRef;
  containerRef: ComponentRef<ToastContainerComponent>;
}

interface PromiseMessages<T> {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((err: unknown) => string);
}

let nextToastId = 0;

function generateId(): string {
  return `tw-toast-${++nextToastId}`;
}

/**
 * Opens Tailwind-styled toasts / snackbars inside CDK overlays. One overlay is
 * created per `ToastPosition` on first use and reused for the lifetime of the
 * service; toasts stack vertically inside their position container.
 *
 * Not `providedIn: 'root'` — register via {@link provideToast}.
 */
@Injectable()
export class ToastService implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly defaultOptions =
    inject(TW_TOAST_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parent = inject(ToastService, { optional: true, skipSelf: true });

  private readonly positionOverlays = new Map<ToastPosition, PositionOverlay>();
  private readonly activeRefsAtThisLevel = signal<readonly ToastRef[]>([]);
  private readonly afterOpenedSubject = new Subject<ToastRef>();
  private readonly afterAllDismissedSubject = new Subject<void>();

  /** Reactive list of every toast that has not yet fully dismissed. */
  readonly activeToasts: Signal<readonly ToastRef[]> = this.parent
    ? this.parent.activeToasts
    : this.activeRefsAtThisLevel.asReadonly();

  /** Emits every time a new toast is opened. */
  readonly afterOpened: Observable<ToastRef> = this.parent
    ? this.parent.afterOpened
    : this.afterOpenedSubject.asObservable();

  /** Emits when the active-toasts list transitions back to empty. Emits immediately on subscribe if none are open. */
  readonly afterAllDismissed: Observable<void> = defer(() =>
    this.activeToasts().length
      ? this.getAfterAllDismissedSource()
      : this.getAfterAllDismissedSource().pipe(startWith(undefined as void)),
  );

  /**
   * Open a toast. Content may be a string (rendered inside the default
   * `ToastComponent`), a `TemplateRef` (rendered via `TemplatePortal`), or a
   * component class (rendered via `ComponentPortal` with `TW_TOAST_REF` +
   * `TW_TOAST_DATA` injected).
   */
  show<R = void, D = unknown>(
    content: ToastContent,
    config?: ToastConfig<D, R>,
  ): ToastRef<unknown, R> {
    const merged = this.resolveConfig<D, R>(config);
    return this.openInternal<R>(content, merged);
  }

  /** Shorthand for `show(message, { severity: 'success', ... })`. */
  success<R = void>(message: string, config?: ToastConfig<unknown, R>): ToastRef<unknown, R> {
    return this.openWithSeverity('success', message, config);
  }

  /** Shorthand for `show(message, { severity: 'error', politeness: 'assertive', ... })`. */
  error<R = void>(message: string, config?: ToastConfig<unknown, R>): ToastRef<unknown, R> {
    return this.openWithSeverity('error', message, config, 'assertive');
  }

  /** Shorthand for `show(message, { severity: 'warning', ... })`. */
  warning<R = void>(message: string, config?: ToastConfig<unknown, R>): ToastRef<unknown, R> {
    return this.openWithSeverity('warning', message, config);
  }

  /** Shorthand for `show(message, { severity: 'info', ... })`. */
  info<R = void>(message: string, config?: ToastConfig<unknown, R>): ToastRef<unknown, R> {
    return this.openWithSeverity('info', message, config);
  }

  /**
   * Show a loading toast, then swap it to success / error when the promise
   * settles. The same ref is returned and re-used across all three states.
   * The loading toast is pinned (duration forced to 0, dismissible forced to
   * false) until the promise resolves.
   */
  promise<T, R = void>(
    promise: Promise<T>,
    messages: PromiseMessages<T>,
    config?: ToastConfig<unknown, R>,
  ): ToastRef<unknown, R> {
    const resolvedDuration = config?.duration ?? this.defaultOptions.duration ?? 5000;
    const ref = this.show<R>(messages.loading, {
      ...(config as ToastConfig<unknown, R>),
      severity: 'neutral',
      duration: 0,
      dismissible: false,
    });

    promise.then(
      (value) => {
        if (ref.state() === 'dismissed' || ref.state() === 'dismissing') return;
        const msg = typeof messages.success === 'function' ? messages.success(value) : messages.success;
        ref.update({
          severity: 'success',
          content: msg,
          duration: resolvedDuration,
          dismissible: config?.dismissible ?? true,
        });
        this.announceUpdate(ref);
      },
      (err) => {
        if (ref.state() === 'dismissed' || ref.state() === 'dismissing') return;
        const msg = typeof messages.error === 'function' ? messages.error(err) : messages.error;
        ref.update({
          severity: 'error',
          content: msg,
          duration: resolvedDuration,
          dismissible: config?.dismissible ?? true,
        });
        this.announceUpdate(ref);
      },
    );

    return ref;
  }

  /** Dismiss a toast by id. No-op if no matching toast is active. */
  dismiss(id: string): void {
    const match = this.activeToasts().find((ref) => ref.id === id);
    if (match) match.dismiss();
  }

  /** Dismiss every active toast across every position. */
  dismissAll(): void {
    const refs = [...this.activeToasts()];
    for (let i = refs.length - 1; i >= 0; i--) refs[i].dismiss();
  }

  /** Look up an active toast by id. */
  getToastById<R = unknown>(id: string): ToastRef<unknown, R> | undefined {
    return this.activeToasts().find((ref) => ref.id === id) as
      | ToastRef<unknown, R>
      | undefined;
  }

  ngOnDestroy(): void {
    const refs = [...this.activeRefsAtThisLevel()];
    for (let i = refs.length - 1; i >= 0; i--) refs[i]._finishDismiss();
    for (const { overlayRef } of this.positionOverlays.values()) {
      overlayRef.dispose();
    }
    this.positionOverlays.clear();
    this.afterOpenedSubject.complete();
    this.afterAllDismissedSubject.complete();
  }

  private openWithSeverity<R>(
    severity: ToastSeverity,
    message: string,
    config?: ToastConfig<unknown, R>,
    forcedPoliteness?: 'polite' | 'assertive' | 'off',
  ): ToastRef<unknown, R> {
    const merged = this.resolveConfig<unknown, R>(config);
    merged.severity = severity;
    if (forcedPoliteness && !config?.politeness) merged.politeness = forcedPoliteness;
    return this.openInternal<R>(message, merged);
  }

  private openInternal<R>(
    content: ToastContent,
    config: ToastConfig<unknown, R>,
  ): ToastRef<unknown, R> {
    const id = config.id ?? generateId();
    config.id = id;

    const ref = new ToastRef<unknown, R>(id, content, config, (dismissed) =>
      this.handleDismissed(dismissed),
    );

    if (isComponentConstructor(content)) {
      const injector = this.getContainerForPosition(
        config.position!,
      ).containerRef.instance._createContentInjector(ref as ToastRef<unknown, unknown>);
      ref._portal = new ComponentPortal(content, null, injector);
    }

    this.enforceMaxVisible(config.position!, config.maxVisible ?? 5);
    this.registerOpen(ref);
    this.attachToContainer(ref, config.position!);
    this.announceOpen(ref);
    return ref;
  }

  private enforceMaxVisible(position: ToastPosition, max: number): void {
    if (max <= 0) return;
    const atPosition = this.activeToasts().filter(
      (ref) =>
        (ref.config.position ?? 'bottom-right') === position &&
        ref.state() !== 'dismissing' &&
        ref.state() !== 'dismissed',
    );
    while (atPosition.length >= max) {
      const oldest = atPosition.shift();
      if (!oldest) break;
      oldest._dismissAsMaxExceeded();
    }
  }

  private registerOpen<R>(ref: ToastRef<unknown, R>): void {
    const scope = this.parent ?? this;
    const anyRef = ref as ToastRef<unknown, unknown>;
    scope.activeRefsAtThisLevel.update((list) => [...list, anyRef]);
    scope.afterOpenedSubject.next(anyRef);
  }

  private handleDismissed(ref: ToastRef): void {
    const scope = this.parent ?? this;
    scope.activeRefsAtThisLevel.update((list) => list.filter((r) => r !== ref));

    const position = ref.config.position ?? 'bottom-right';
    const entry = this.positionOverlays.get(position);
    if (entry) {
      const instance = entry.containerRef.instance;
      instance.visibleRefs.update((list) => list.filter((r) => r !== ref));
    }

    if (scope.activeRefsAtThisLevel().length === 0) {
      scope.afterAllDismissedSubject.next();
    }
  }

  private attachToContainer<R>(ref: ToastRef<unknown, R>, position: ToastPosition): void {
    const entry = this.getContainerForPosition(position);
    const instance = entry.containerRef.instance;
    const anyRef = ref as ToastRef<unknown, unknown>;
    instance.visibleRefs.update((list) => [...list, anyRef]);
    ref._overlayPanelElement = entry.overlayRef.overlayElement;
  }

  private announceOpen<R>(ref: ToastRef<unknown, R>): void {
    const entry = this.positionOverlays.get(ref.config.position ?? 'bottom-right');
    entry?.containerRef.instance._announceOpen(ref as ToastRef<unknown, unknown>);
  }

  private announceUpdate<R>(ref: ToastRef<unknown, R>): void {
    const entry = this.positionOverlays.get(ref.config.position ?? 'bottom-right');
    entry?.containerRef.instance._announceUpdate(ref as ToastRef<unknown, unknown>);
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

    const containerPortal = new ComponentPortal(ToastContainerComponent, null, this.injector);
    const containerRef = overlayRef.attach(containerPortal);
    containerRef.instance.position.set(position);
    containerRef.instance.regionLabel.set(
      this.defaultOptions.regionAriaLabel ?? 'Notifications',
    );

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

  private resolveConfig<D, R>(config: ToastConfig<D, R> | undefined): ToastConfig<D, R> {
    const merged = new ToastConfig<D, R>();
    Object.assign(merged, this.defaultOptions, config);
    return merged;
  }

  private getAfterAllDismissedSource(): Subject<void> {
    return this.parent ? this.parent.getAfterAllDismissedSource() : this.afterAllDismissedSubject;
  }
}

function isComponentConstructor(value: unknown): value is Type<unknown> {
  return typeof value === 'function' && !(value instanceof TemplateRef);
}

/**
 * Registers {@link ToastService} for dependency injection and installs optional
 * application-wide defaults.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideToast({ position: 'top-right', duration: 4000 })]
 * });
 * ```
 */
export function provideToast(
  defaultOptions?: Partial<ToastConfig>,
): EnvironmentProviders {
  const providers: Provider[] = [ToastService];
  if (defaultOptions) {
    providers.push({ provide: TW_TOAST_DEFAULT_OPTIONS, useValue: defaultOptions });
  }
  return makeEnvironmentProviders(providers);
}

/** Re-exported helpers so `inject(TW_TOAST_DATA)` / `inject(TW_TOAST_REF)` work from component content. */
export { TW_TOAST_DATA, TW_TOAST_REF };

// Re-exports to keep the barrel tidy.
export type { ToastContent, ToastTemplateContext };

export const ToastInternals = {
  /** @internal Reset id counter for tests. */
  _resetIdForTesting(): void {
    nextToastId = 0;
  },
};
