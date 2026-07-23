import {
  inject,
  Injectable,
  Injector,
  type OnDestroy,
  type Provider,
  type TemplateRef,
  signal,
  type Signal,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import type { ComponentType } from '@angular/cdk/portal';
import { defer, type Observable, startWith, Subject } from 'rxjs';
import {
  TW_DIALOG_DEFAULT_OPTIONS,
  TwDialogConfig,
} from './dialog-config';
import { TwDialogRef } from './dialog-ref';
// Type-only: importing the renderer as a value would drag `@angular/cdk/dialog`
// and the overlay scroll strategies back into the eager chunk. See
// `dialog-renderer.ts`.
import type { openRenderedDialog } from './dialog-renderer';

let nextDialogId = 0;

function generateDialogId(): string {
  return `tw-dialog-${++nextDialogId}`;
}

/**
 * Opens Tailwind-styled modal dialogs. Composes `@angular/cdk/dialog` for focus
 * trapping, portals, overlay plumbing, and adds a Tailwind container, richer
 * ref API, and animation lifecycle.
 *
 * The rendering layer (`@angular/cdk/dialog` + the Tailwind container) is loaded
 * through a dynamic `import()` on the first `open()` call, so merely registering
 * this service costs nothing in the initial bundle. `open()` still returns its
 * {@link TwDialogRef} synchronously — the dialog is rendered once the chunk
 * lands. Read the rendered component via {@link TwDialogRef.whenComponentReady}.
 *
 * Not `providedIn: 'root'` — register it via {@link provideTwDialog}.
 */
@Injectable()
export class TwDialog implements OnDestroy {
  private readonly injector = inject(Injector);
  private readonly defaultOptions = inject(TW_DIALOG_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parentDialog = inject(TwDialog, { optional: true, skipSelf: true });

  /** Cached renderer chunk import — kicked off on the first `open()`. */
  private rendererPromise: Promise<typeof openRenderedDialog | null> | null = null;
  private destroyed = false;

  private readonly openDialogsAtThisLevel = signal<readonly TwDialogRef<unknown, unknown>[]>([]);
  private readonly afterOpenedSubject = new Subject<TwDialogRef<unknown, unknown>>();
  private readonly afterAllClosedSubject = new Subject<void>();

  /** Reactively-readable list of currently-open dialogs across the full dialog tree. */
  readonly openDialogs: Signal<readonly TwDialogRef<unknown, unknown>[]> = this.parentDialog
    ? this.parentDialog.openDialogs
    : this.openDialogsAtThisLevel.asReadonly();

  /** Emits every time a dialog is opened. */
  readonly afterOpened: Observable<TwDialogRef<unknown, unknown>> = this.parentDialog
    ? this.parentDialog.afterOpened
    : this.afterOpenedSubject.asObservable();

  /**
   * Emits when every open dialog has closed. Emits immediately on subscribe if
   * there are none open.
   */
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openDialogs().length
      ? this.getAfterAllClosedSource()
      : this.getAfterAllClosedSource().pipe(startWith(undefined as void)),
  );

  /**
   * Opens a dialog using the given component or template.
   * @param content Component class or `TemplateRef`.
   * @param config Options merged over the application defaults.
   * @returns Reference controlling the opened dialog, returned synchronously.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config?: TwDialogConfig<D, R>,
  ): TwDialogRef<R, C> {
    const merged = this.resolveConfig<D, R>(config);
    const id = merged.id ?? generateDialogId();
    merged.id = id;

    // Enforce id uniqueness eagerly. CDK throws this synchronously from
    // `open()`; since our CDK open is now deferred, replicate the check here so
    // the error still surfaces at the call site rather than in a later tick.
    if (this.getDialogById(id)) {
      throw new Error(`Dialog with id "${id}" exists already. The dialog id must be unique.`);
    }

    const twRef = new TwDialogRef<R, C>(id, merged as unknown as TwDialogConfig<unknown, R>);

    const scope = this.parentDialog ?? this;
    scope.registerOpen(twRef as unknown as TwDialogRef<unknown, unknown>);
    twRef.afterClosed().subscribe(() => {
      scope.unregister(twRef as unknown as TwDialogRef<unknown, unknown>);
    });

    void this.renderWhenReady(content, merged, twRef);

    return twRef;
  }

  /** Closes every open dialog managed by this service (and child services). */
  closeAll(): void {
    const dialogs = [...this.openDialogs()];
    for (let i = dialogs.length - 1; i >= 0; i--) dialogs[i].close();
  }

  /** Looks up an open dialog by its id. */
  getDialogById<R = unknown, C = unknown>(id: string): TwDialogRef<R, C> | undefined {
    return this.openDialogs().find((dialog) => dialog.id === id) as TwDialogRef<R, C> | undefined;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    const dialogs = [...this.openDialogsAtThisLevel()];
    for (let i = dialogs.length - 1; i >= 0; i--) dialogs[i].close();
    this.afterOpenedSubject.complete();
    this.afterAllClosedSubject.complete();
  }

  /**
   * @internal Resolves once the renderer chunk has loaded. Exposed for tests,
   * which must await the dynamic import before asserting on rendered DOM.
   */
  async _whenRendered(): Promise<void> {
    await this.loadRenderer();
    await Promise.resolve();
  }

  /**
   * Render a dialog once the renderer chunk has loaded. The ref was already
   * returned to the caller, so it may have been closed (or the service
   * destroyed) while the import was in flight — both skip the actual open.
   */
  private async renderWhenReady<R, D, C>(
    content: ComponentType<C> | TemplateRef<C>,
    merged: TwDialogConfig<D, R>,
    twRef: TwDialogRef<R, C>,
  ): Promise<void> {
    const openRendered = await this.loadRenderer();
    if (!openRendered || this.destroyed) return;
    // Closed before the chunk landed — the facade already synthesized its
    // closed state; never create the overlay.
    if (twRef.state() === 'closed') return;
    openRendered(this.injector, content, merged, twRef);
  }

  private loadRenderer(): Promise<typeof openRenderedDialog | null> {
    if (!this.rendererPromise) {
      this.rendererPromise = import('./dialog-renderer').then(({ openRenderedDialog }) =>
        this.destroyed ? null : openRenderedDialog,
      );
    }
    return this.rendererPromise;
  }

  private registerOpen(ref: TwDialogRef<unknown, unknown>): void {
    if (this.parentDialog) {
      this.parentDialog.registerOpen(ref);
    } else {
      this.openDialogsAtThisLevel.update((list) => [...list, ref]);
      this.afterOpenedSubject.next(ref);
    }
  }

  private unregister(ref: TwDialogRef<unknown, unknown>): void {
    if (this.parentDialog) {
      this.parentDialog.unregister(ref);
    } else {
      this.openDialogsAtThisLevel.update((list) => list.filter((d) => d !== ref));
      if (this.openDialogsAtThisLevel().length === 0) {
        this.afterAllClosedSubject.next();
      }
    }
  }

  private getAfterAllClosedSource(): Subject<void> {
    return this.parentDialog
      ? this.parentDialog.getAfterAllClosedSource()
      : this.afterAllClosedSubject;
  }

  private resolveConfig<D, R>(config: TwDialogConfig<D, R> | undefined): TwDialogConfig<D, R> {
    const merged = new TwDialogConfig<D, R>();
    Object.assign(merged, this.defaultOptions, config);
    return merged;
  }
}

/**
 * Registers the {@link TwDialog} service for dependency injection.
 *
 * @param defaultOptions Optional defaults merged into every `open()` call.
 * @example
 * ```ts
 * provideTwDialog({ size: 'lg', hasBackdrop: true })
 * ```
 */
export function provideTwDialog(
  defaultOptions?: Partial<TwDialogConfig>,
): EnvironmentProviders {
  const providers: Provider[] = [TwDialog];
  if (defaultOptions) {
    providers.push({ provide: TW_DIALOG_DEFAULT_OPTIONS, useValue: defaultOptions });
  }
  return makeEnvironmentProviders(providers);
}
