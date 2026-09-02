import {
  type EnvironmentProviders,
  Injectable,
  Injector,
  type OnDestroy,
  type Provider,
  type Signal,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
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
import { ToastRef } from './toast-ref';
// Type-only: importing `ToastRenderer` as a value here would drag CDK overlay
// and the toast components back into the eager chunk. See `toast-renderer.ts`.
import type { ToastRenderer } from './toast-renderer';

/**
 * The three messages {@link ToastService.promise} shows as a promise settles.
 * `success` and `error` may be functions, receiving the resolved value or the
 * rejection reason so the message can quote it.
 */
export interface PromiseMessages<T> {
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
 * The rendering layer (CDK overlay + the toast components) is loaded through a
 * dynamic `import()` on the first `show()` call, so merely registering this
 * service costs nothing in the initial bundle. Every open method still returns
 * its {@link ToastRef} synchronously — the toast is attached once the chunk
 * lands, and `update()` / `dismiss()` called in the meantime are honoured.
 *
 * Not `providedIn: 'root'` — register via {@link provideToast}.
 */
@Injectable()
export class ToastService implements OnDestroy {
  private readonly injector = inject(Injector);
  private readonly defaultOptions =
    inject(TW_TOAST_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parent = inject(ToastService, { optional: true, skipSelf: true });

  /** Cached renderer chunk. Non-null once the first `show()` has kicked off the import. */
  private rendererPromise: Promise<ToastRenderer | null> | null = null;
  private renderer: ToastRenderer | null = null;
  private destroyed = false;

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
    // Set first: an in-flight renderer import resolves after this and must not
    // instantiate overlays for a service that is already gone.
    this.destroyed = true;
    const refs = [...this.activeRefsAtThisLevel()];
    for (let i = refs.length - 1; i >= 0; i--) refs[i]._finishDismiss();
    this.renderer?.dispose();
    this.renderer = null;
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

    this.enforceMaxVisible(config.position!, config.maxVisible ?? 5);
    this.registerOpen(ref);
    void this.attachWhenRendererReady(ref as ToastRef<unknown, unknown>, config.position!);
    return ref;
  }

  /**
   * Attach a toast once the renderer chunk has loaded. The ref was already
   * returned to the caller, so it may have been dismissed (or the service
   * destroyed) while the import was in flight — both are checked before
   * anything is put on screen.
   */
  private async attachWhenRendererReady(
    ref: ToastRef<unknown, unknown>,
    position: ToastPosition,
  ): Promise<void> {
    const renderer = await this.loadRenderer();
    if (!renderer || this.destroyed) return;

    const state = ref.state();
    if (state === 'dismissing' || state === 'dismissed') return;

    if (!renderer.attach(ref, position)) return;
    // Only now does the enter animation — and with it the auto-dismiss
    // countdown — begin. See `ToastRef._startEnterSequence`.
    ref._startEnterSequence();
    renderer.announceOpen(ref);
  }

  /**
   * @internal Resolves once the renderer chunk has loaded and pending toasts
   * have been attached. Exposed for tests, which must await the dynamic import
   * before asserting on rendered DOM.
   */
  async _whenRendered(): Promise<void> {
    await this.loadRenderer();
    // Let the per-toast `attachWhenRendererReady` continuations run.
    await Promise.resolve();
  }

  /** Load (once) and instantiate the rendering layer. Resolves to `null` if the service was destroyed mid-import. */
  private loadRenderer(): Promise<ToastRenderer | null> {
    if (!this.rendererPromise) {
      this.rendererPromise = import('./toast-renderer').then(({ ToastRenderer }) => {
        if (this.destroyed) return null;
        this.renderer = new ToastRenderer(
          this.injector,
          this.defaultOptions.regionAriaLabel ?? 'Notifications',
        );
        return this.renderer;
      });
    }
    return this.rendererPromise;
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

    this.renderer?.detach(ref);

    if (scope.activeRefsAtThisLevel().length === 0) {
      scope.afterAllDismissedSubject.next();
    }
  }

  /**
   * Re-announce an updated toast. If the renderer has not landed yet there is
   * nothing on screen to announce — the announcement that fires on attach
   * reads the ref's current (already updated) content, so nothing is lost.
   */
  private announceUpdate<R>(ref: ToastRef<unknown, R>): void {
    this.renderer?.announceUpdate(ref as ToastRef<unknown, unknown>);
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
