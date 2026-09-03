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
  TW_SHEET_DEFAULT_OPTIONS,
  SheetConfig,
} from './sheet-config';
import { SheetRef } from './sheet-ref';
// Type-only: importing the renderer as a value would drag `@angular/cdk/dialog`
// and the overlay strategies back into the eager chunk. See `sheet-renderer.ts`.
import type { openRenderedSheet } from './sheet-renderer';

let nextSheetId = 0;

function generateSheetId(): string {
  return `tw-sheet-${++nextSheetId}`;
}

/**
 * Opens edge-anchored sheet (drawer) overlays. Composes `@angular/cdk/dialog`
 * for focus trapping, portals, and overlay plumbing — adds a `GlobalPositionStrategy`
 * pinned to the requested viewport edge, a Tailwind container with axis-aware
 * sizing, slide enter/exit animations, and split close-behavior flags.
 *
 * The rendering layer (`@angular/cdk/dialog` + the Tailwind container) is loaded
 * through a dynamic `import()` on the first `open()` call, so merely registering
 * this service costs nothing in the initial bundle. `open()` still returns its
 * {@link SheetRef} synchronously — the sheet is rendered once the chunk lands.
 * Read the rendered component via {@link SheetRef.whenComponentReady}.
 *
 * Not `providedIn: 'root'` — register it via {@link provideSheet}.
 */
@Injectable()
export class Sheet implements OnDestroy {
  private readonly injector = inject(Injector);
  private readonly defaultOptions = inject(TW_SHEET_DEFAULT_OPTIONS, { optional: true }) ?? {};
  private readonly parentSheet = inject(Sheet, { optional: true, skipSelf: true });

  /** Cached renderer chunk import — kicked off on the first `open()`. */
  private rendererPromise: Promise<typeof openRenderedSheet | null> | null = null;
  private destroyed = false;

  private readonly openSheetsAtThisLevel = signal<readonly SheetRef<unknown, unknown>[]>([]);
  private readonly afterOpenedSubject = new Subject<SheetRef<unknown, unknown>>();
  private readonly afterAllClosedSubject = new Subject<void>();

  /** Reactively-readable list of currently-open sheets across the full sheet tree. */
  readonly openSheets: Signal<readonly SheetRef<unknown, unknown>[]> = this.parentSheet
    ? this.parentSheet.openSheets
    : this.openSheetsAtThisLevel.asReadonly();

  /** Emits every time a sheet is opened. */
  readonly afterOpened: Observable<SheetRef<unknown, unknown>> = this.parentSheet
    ? this.parentSheet.afterOpened
    : this.afterOpenedSubject.asObservable();

  /**
   * Emits when every open sheet has closed. Emits immediately on subscribe if
   * there are none open.
   */
  readonly afterAllClosed: Observable<void> = defer(() =>
    this.openSheets().length
      ? this.getAfterAllClosedSource()
      : this.getAfterAllClosedSource().pipe(startWith(undefined as void)),
  );

  /**
   * Opens a sheet using the given component or template.
   * @param content Component class or `TemplateRef`.
   * @param config Options merged over the application defaults.
   * @returns Reference controlling the opened sheet, returned synchronously.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<C>,
    config?: SheetConfig<D, R>,
  ): SheetRef<R, C> {
    const merged = this.resolveConfig<D, R>(config);
    const id = merged.id ?? generateSheetId();
    merged.id = id;

    // Enforce id uniqueness eagerly. CDK throws this synchronously from
    // `open()`; since our CDK open is now deferred, replicate the check here so
    // the error still surfaces at the call site rather than in a later tick.
    if (this.getSheetById(id)) {
      throw new Error(`Sheet with id "${id}" exists already. The sheet id must be unique.`);
    }

    const sheetRef = new SheetRef<R, C>(id, merged as unknown as SheetConfig<unknown, R>);

    const scope = this.parentSheet ?? this;
    scope.registerOpen(sheetRef as unknown as SheetRef<unknown, unknown>);
    sheetRef.afterClosed().subscribe(() => {
      scope.unregister(sheetRef as unknown as SheetRef<unknown, unknown>);
    });

    void this.renderWhenReady(content, merged, sheetRef);

    return sheetRef;
  }

  /** Closes every open sheet managed by this service (and child services). */
  closeAll(): void {
    const sheets = [...this.openSheets()];
    for (let i = sheets.length - 1; i >= 0; i--) sheets[i].close();
  }

  /** Looks up an open sheet by its id. */
  getSheetById<R = unknown, C = unknown>(id: string): SheetRef<R, C> | undefined {
    return this.openSheets().find((sheet) => sheet.id === id) as SheetRef<R, C> | undefined;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    const sheets = [...this.openSheetsAtThisLevel()];
    for (let i = sheets.length - 1; i >= 0; i--) sheets[i].close();
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
   * Render a sheet once the renderer chunk has loaded. The ref was already
   * returned to the caller, so it may have been closed (or the service
   * destroyed) while the import was in flight — both skip the actual open.
   */
  private async renderWhenReady<R, D, C>(
    content: ComponentType<C> | TemplateRef<C>,
    merged: SheetConfig<D, R>,
    sheetRef: SheetRef<R, C>,
  ): Promise<void> {
    const openRendered = await this.loadRenderer();
    if (!openRendered || this.destroyed) return;
    // Closed before the chunk landed — the facade already synthesized its
    // closed state; never create the overlay.
    if (sheetRef.state() === 'closed') return;
    openRendered(this.injector, content, merged, sheetRef);
  }

  private loadRenderer(): Promise<typeof openRenderedSheet | null> {
    if (!this.rendererPromise) {
      this.rendererPromise = import('./sheet-renderer').then(({ openRenderedSheet }) =>
        this.destroyed ? null : openRenderedSheet,
      );
    }
    return this.rendererPromise;
  }

  private registerOpen(ref: SheetRef<unknown, unknown>): void {
    if (this.parentSheet) {
      this.parentSheet.registerOpen(ref);
    } else {
      this.openSheetsAtThisLevel.update((list) => [...list, ref]);
      this.afterOpenedSubject.next(ref);
    }
  }

  private unregister(ref: SheetRef<unknown, unknown>): void {
    if (this.parentSheet) {
      this.parentSheet.unregister(ref);
    } else {
      this.openSheetsAtThisLevel.update((list) => list.filter((d) => d !== ref));
      if (this.openSheetsAtThisLevel().length === 0) {
        this.afterAllClosedSubject.next();
      }
    }
  }

  private getAfterAllClosedSource(): Subject<void> {
    return this.parentSheet
      ? this.parentSheet.getAfterAllClosedSource()
      : this.afterAllClosedSubject;
  }

  private resolveConfig<D, R>(config: SheetConfig<D, R> | undefined): SheetConfig<D, R> {
    const merged = new SheetConfig<D, R>();
    Object.assign(merged, this.defaultOptions, config);
    return merged;
  }
}

/**
 * Registers the {@link Sheet} service for dependency injection.
 *
 * @param defaultOptions Optional defaults merged into every `open()` call.
 * @example
 * ```ts
 * provideSheet({ side: 'left', size: 'lg' })
 * ```
 */
export function provideSheet(defaultOptions?: Partial<SheetConfig>): EnvironmentProviders {
  const providers: Provider[] = [Sheet];
  if (defaultOptions) {
    providers.push({ provide: TW_SHEET_DEFAULT_OPTIONS, useValue: defaultOptions });
  }
  return makeEnvironmentProviders(providers);
}
